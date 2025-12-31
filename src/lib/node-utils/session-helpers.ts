export const CLAUDE_CODE_COMMANDS = ['clear', 'ide', 'model', 'compact', 'init'];

export interface ParsedSessionLine {
  type?: string;
  cwd?: string;
  message?: {
    content?: string | Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown> }>;
    usage?: {
      input_tokens?: number;
      cache_read_input_tokens?: number;
      output_tokens?: number;
    };
  };
  content?: string | Array<{ type: string; text?: string }>;
  timestamp?: number;
  summary?: string;
}

interface SessionValidationResult {
  isValid: boolean;
  cwd?: string;
  title?: string;
}

export function parseSessionLine(line: string): ParsedSessionLine | null {
  if (!line.trim()) return null;

  try {
    return JSON.parse(line) as ParsedSessionLine;
  } catch {
    return null;
  }
}

export function extractCwd(parsed: ParsedSessionLine): string | null {
  return parsed.cwd || null;
}

export function validateSessionFile(lines: string[]): SessionValidationResult {
  let foundCwd = false;
  let cwd: string | undefined;
  let hasValidTitle = false;
  let title: string | undefined;

  for (const line of lines) {
    const parsed = parseSessionLine(line);
    if (!parsed) continue;

    if (parsed.cwd && !foundCwd) {
      foundCwd = true;
      cwd = parsed.cwd;
    }

    if (parsed.type === 'user' && !hasValidTitle) {
      const messageContent = parsed.message?.content;
      const textContent = extractTextContent(messageContent);
      const extractedTitle = extractSessionTitle(textContent);

      if (extractedTitle) {
        hasValidTitle = true;
        title = extractedTitle;
      }
    }

    if (foundCwd && hasValidTitle) {
      break;
    }
  }

  return {
    isValid: foundCwd && hasValidTitle,
    cwd,
    title
  };
}

interface ContentItem {
  type: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
}

export function extractTextContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    const textParts: string[] = [];
    for (const item of content as ContentItem[]) {
      if (item.type === 'text' && item.text) {
        textParts.push(item.text);
      } else if (item.type === 'tool_use') {
        const toolName = item.name || 'Unknown';
        const input = item.input || {};
        let toolInfo = `[Tool: ${toolName}]`;

        const getStringValue = (key: string): string | undefined => {
          const value = input[key];
          return typeof value === 'string' ? value : undefined;
        };

        if (toolName === 'Edit' || toolName === 'Read' || toolName === 'Write') {
          const filePath = getStringValue('file_path');
          if (filePath) {
            toolInfo = `[Tool: ${toolName}] ${filePath}`;
          }
        } else if (toolName === 'Glob') {
          const parts: string[] = [];
          const pattern = getStringValue('pattern');
          const path = getStringValue('path');
          if (pattern) parts.push(`pattern: "${pattern}"`);
          if (path) parts.push(`path: ${path}`);
          if (parts.length > 0) {
            toolInfo = `[Tool: ${toolName}] ${parts.join(', ')}`;
          }
        } else if (toolName === 'Grep') {
          const parts: string[] = [];
          const pattern = getStringValue('pattern');
          const path = getStringValue('path');
          if (pattern) parts.push(`pattern: "${pattern}"`);
          if (path) parts.push(`path: ${path}`);
          if (parts.length > 0) {
            toolInfo = `[Tool: ${toolName}] ${parts.join(', ')}`;
          }
        } else if (toolName === 'Task') {
          const description = getStringValue('description');
          if (description) {
            toolInfo = `[Tool: ${toolName}] ${description}`;
          }
        } else if (toolName === 'WebSearch') {
          const query = getStringValue('query');
          if (query) {
            toolInfo = `[Tool: ${toolName}] "${query}"`;
          }
        } else if (toolName === 'Bash') {
          const description = getStringValue('description');
          if (description) {
            toolInfo = `[Tool: ${toolName}] ${description}`;
          }
        }

        textParts.push(toolInfo);
      }
    }
    return textParts.join('\n');
  }

  return '';
}

export function isValidUserMessage(content: string): boolean {
  if (!content || content === 'Warmup') {
    return false;
  }

  const firstLine = content.split('\n')[0].replace(/\\/g, '').replace(/\s+/g, ' ').trim();

  if (firstLine.includes('Caveat:')) {
    return false;
  }

  const commandMatch = content.match(/<command-name>\/?([^<]+)<\/command-name>/);
  if (commandMatch) {
    const commandName = commandMatch[1];
    if (CLAUDE_CODE_COMMANDS.includes(commandName)) {
      return false;
    }
  }

  const isSystemMessage =
    firstLine.startsWith('<local-command-') ||
    firstLine.startsWith('[Tool:') ||
    firstLine.startsWith('[Request interrupted');

  return !isSystemMessage;
}

export function shouldSkipUserMessage(textContent: string): boolean {
  return !textContent || textContent === 'Warmup' || !isValidUserMessage(textContent);
}

export function shouldSkipAssistantMessage(textContent: string): boolean {
  return !textContent || textContent === 'Warmup';
}

export function createMessageKey(type: 'user' | 'assistant', timestamp: any, textContent: string): string {
  return `${type}-${timestamp}-${textContent}`;
}

export function extractSessionTitle(textContent: string): string | null {
  if (!textContent) return null;

  const allLines = textContent
    .split('\n')
    .map((line) => line.replace(/\\/g, '').trim())
    .filter((line) => line.length > 0);

  let firstLines = allLines.slice(0, 10).join(' ').replace(/\s+/g, ' ').trim();

  if (firstLines.includes('---')) {
    const beforeSeparator = firstLines.split('---')[0].trim();
    if (beforeSeparator) {
      firstLines = beforeSeparator;
    }
  }

  firstLines = firstLines.replace(/<command-message>.*?<\/command-message>/g, '').trim();

  const commandNameMatch = firstLines.match(/<command-name>(.*?)<\/command-name>/);
  const commandArgsMatch = firstLines.match(/<command-args>(.*?)<\/command-args>/);

  if (commandNameMatch) {
    const commandName = commandNameMatch[1];
    const commandArgs = commandArgsMatch ? ` ${commandArgsMatch[1]}` : '';
    firstLines = `${commandName}${commandArgs}`;
  }

  const isClearCommand = firstLines.includes('/clear');
  const isLocalCommand = firstLines.startsWith('<local-command-');
  const isIdeCommand = commandNameMatch && commandNameMatch[1] === '/ide';
  const shouldSkip =
    !firstLines ||
    firstLines === 'Warmup' ||
    firstLines.includes('Caveat:') ||
    isClearCommand ||
    isLocalCommand ||
    isIdeCommand;

  if (shouldSkip) {
    return null;
  }

  return firstLines.length > 80 ? `${firstLines.substring(0, 80)}...` : firstLines;
}
