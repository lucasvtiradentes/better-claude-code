import { ClaudeHelper, MessageSource } from '@better-claude-code/node-utils';

const CLAUDE_CODE_COMMANDS = ['clear', 'ide', 'model', 'compact', 'init'];

export interface ParsedMessage {
  id: string;
  type: MessageSource;
  content: string;
  timestamp?: number;
}

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

function cleanCommandMessage(content: string): string {
  const commandMatch = content.match(/<command-name>\/?([^<]+)<\/command-name>/);
  if (!commandMatch) return content;

  const commandName = commandMatch[1];
  const argsMatch = content.match(/<command-args>([^<]+)<\/command-args>/);
  const args = argsMatch ? ` ${argsMatch[1]}` : '';

  let cleaned = content.replace(/<command-message>[^<]*<\/command-message>/g, '').trim();
  cleaned = cleaned.replace(/<command-name>\/?[^<]+<\/command-name>/g, `/${commandName}${args}`).trim();
  cleaned = cleaned.replace(/<command-args>[^<]+<\/command-args>/g, '').trim();

  return cleaned;
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

function cleanUserMessage(content: string): string[] {
  const parts = content.split('---').map((p) => p.trim());
  const cleanedParts: string[] = [];

  for (const part of parts) {
    if (!part || !isValidUserMessage(part)) continue;

    const cleaned = cleanCommandMessage(part);
    cleanedParts.push(cleaned);
  }

  return cleanedParts;
}

export interface ParseSessionOptions {
  groupMessages?: boolean;
  includeImages?: boolean;
}

export interface ParsedSession {
  messages: ParsedMessage[];
  images: Array<{ index: number; data: string; messageId: string }>;
}

export function parseSessionMessages(
  events: any[],
  options: ParseSessionOptions = { groupMessages: true, includeImages: true }
): ParsedSession {
  const messages: ParsedMessage[] = [];
  const imageToMessageMap = new Map<string, Array<{ localIndex: number; data: string }>>();
  const seenMessages = new Set<string>();
  let skipNextAssistant = false;

  for (const event of events) {
    if (event.type === 'queue-operation') {
      continue;
    }

    if (ClaudeHelper.isUserMessage(event.type)) {
      const textContent = extractTextContent(event.message?.content || event.content);

      const messageKey = `user-${event.timestamp}-${textContent}`;
      if (seenMessages.has(messageKey)) continue;
      seenMessages.add(messageKey);

      const messageId = event.uuid || `${event.timestamp}-${Math.random()}`;
      const messageImages: Array<{ localIndex: number; data: string }> = [];

      if (Array.isArray(event.message?.content)) {
        let localImageIndex = 1;
        for (const item of event.message.content) {
          if (item.type === 'image') {
            const imageData = item.source?.type === 'base64' ? item.source.data : null;
            if (imageData) {
              messageImages.push({ localIndex: localImageIndex, data: imageData });
            }
            localImageIndex++;
          }
        }
      }

      if (messageImages.length > 0) {
        imageToMessageMap.set(messageId, messageImages);
      }

      if (textContent === 'Warmup') {
        skipNextAssistant = true;
        continue;
      }

      if (textContent) {
        const cleanedParts = cleanUserMessage(textContent);
        for (const part of cleanedParts) {
          messages.push({
            id: messageId,
            type: event.type,
            content: part,
            timestamp: event.timestamp
          });
        }
      }
    } else if (ClaudeHelper.isCCMessage(event.type)) {
      if (skipNextAssistant) {
        skipNextAssistant = false;
        continue;
      }
      const textContent = extractTextContent(event.message?.content || event.content);

      const messageKey = `assistant-${event.timestamp}-${textContent}`;
      if (seenMessages.has(messageKey)) continue;
      seenMessages.add(messageKey);

      const messageId = event.uuid || `${event.timestamp}-${Math.random()}`;
      if (textContent && textContent !== 'Warmup') {
        messages.push({
          id: messageId,
          type: event.type,
          content: textContent,
          timestamp: event.timestamp
        });
      }
    }
  }

  let finalMessages = messages;

  if (options.groupMessages) {
    const groupedMessages: ParsedMessage[] = [];
    for (const msg of messages) {
      const lastMsg = groupedMessages[groupedMessages.length - 1];
      if (lastMsg && lastMsg.type === msg.type) {
        lastMsg.content = `${lastMsg.content}\n---\n${msg.content}`;
      } else {
        groupedMessages.push({ ...msg });
      }
    }
    finalMessages = groupedMessages.filter((msg) => msg.content.trim().length > 0);
  }

  const images: Array<{ index: number; data: string; messageId: string }> = [];

  if (options.includeImages) {
    try {
      const validMessageIds = new Set(messages.map((m) => m.id));
      for (const [messageId, messageImages] of imageToMessageMap.entries()) {
        if (!validMessageIds.has(messageId)) {
          continue;
        }
        for (const img of messageImages) {
          images.push({
            index: img.localIndex,
            data: img.data,
            messageId
          });
        }
      }
    } catch {}
  }

  return { messages: finalMessages, images };
}
