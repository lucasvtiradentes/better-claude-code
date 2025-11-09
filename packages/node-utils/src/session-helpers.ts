export const CLAUDE_CODE_COMMANDS = ['clear', 'ide', 'model', 'compact', 'init'];

export function extractTextContent(content: any): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    const textParts: string[] = [];
    for (const item of content) {
      if (item.type === 'text' && item.text) {
        textParts.push(item.text);
      } else if (item.type === 'tool_use') {
        const toolName = item.name;
        const input = item.input || {};
        let toolInfo = `[Tool: ${toolName}]`;

        if (toolName === 'Edit' || toolName === 'Read' || toolName === 'Write') {
          if (input.file_path) {
            toolInfo = `[Tool: ${toolName}] ${input.file_path}`;
          }
        } else if (toolName === 'Glob') {
          const parts: string[] = [];
          if (input.pattern) parts.push(`pattern: "${input.pattern}"`);
          if (input.path) parts.push(`path: ${input.path}`);
          if (parts.length > 0) {
            toolInfo = `[Tool: ${toolName}] ${parts.join(', ')}`;
          }
        } else if (toolName === 'Grep') {
          const parts: string[] = [];
          if (input.pattern) parts.push(`pattern: "${input.pattern}"`);
          if (input.path) parts.push(`path: ${input.path}`);
          if (parts.length > 0) {
            toolInfo = `[Tool: ${toolName}] ${parts.join(', ')}`;
          }
        } else if (toolName === 'Task') {
          if (input.description) {
            toolInfo = `[Tool: ${toolName}] ${input.description}`;
          }
        } else if (toolName === 'WebSearch') {
          if (input.query) {
            toolInfo = `[Tool: ${toolName}] "${input.query}"`;
          }
        } else if (toolName === 'Bash') {
          if (input.description) {
            toolInfo = `[Tool: ${toolName}] ${input.description}`;
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
