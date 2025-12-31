import { ClaudeHelper, MessageSource } from './claude-helper.js';
import { createMessageKey, extractTextContent, isValidUserMessage } from './session-helpers.js';

export type ParsedMessage = {
  id: string;
  type: MessageSource;
  content: string;
  timestamp?: number;
};

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

export type ParseSessionOptions = {
  groupMessages?: boolean;
  includeImages?: boolean;
};

export type ParsedSession = {
  messages: ParsedMessage[];
  images: Array<{ index: number; data: string; messageId: string }>;
};

type SessionEvent = {
  type: MessageSource | string;
  message?: { content?: unknown };
  content?: unknown;
  timestamp?: number;
  uuid?: string;
};

export function parseSessionMessages(
  events: SessionEvent[],
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

    if (ClaudeHelper.isUserMessage(event.type as MessageSource)) {
      const textContent = extractTextContent(event.message?.content || event.content);

      const messageKey = createMessageKey('user', event.timestamp, textContent);
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
            type: event.type as MessageSource,
            content: part,
            timestamp: event.timestamp
          });
        }
      }
    } else if (ClaudeHelper.isCCMessage(event.type as MessageSource)) {
      if (skipNextAssistant) {
        skipNextAssistant = false;
        continue;
      }
      const textContent = extractTextContent(event.message?.content || event.content);

      const messageKey = createMessageKey('assistant', event.timestamp, textContent);
      if (seenMessages.has(messageKey)) continue;
      seenMessages.add(messageKey);

      const messageId = event.uuid || `${event.timestamp}-${Math.random()}`;
      if (textContent && textContent !== 'Warmup') {
        messages.push({
          id: messageId,
          type: event.type as MessageSource,
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
    finalMessages = groupedMessages.filter((m) => m.content.trim().length > 0);
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
