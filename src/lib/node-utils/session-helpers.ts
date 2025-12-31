export const CLAUDE_CODE_COMMANDS = ['clear', 'ide', 'model', 'compact', 'init'];

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
