import type { MessageContent } from '@bcc/shared';

export type ParsedContent = {
  text: string;
  toolCalls: Array<{ name: string; input: Record<string, unknown> }>;
  images: number[];
};

export const parseMessageContent = (content: MessageContent, imageOffset = 0): ParsedContent => {
  if (typeof content === 'string') {
    return { text: content, toolCalls: [], images: [] };
  }

  const text: string[] = [];
  const toolCalls: Array<{ name: string; input: Record<string, unknown> }> = [];
  const images: number[] = [];
  let currentImageIndex = imageOffset;

  for (const part of content) {
    if (part.type === 'text' && part.text) {
      text.push(part.text);
    } else if (part.type === 'image') {
      images.push(++currentImageIndex);
      text.push(`[Image #${currentImageIndex}]`);
    } else if (part.type === 'tool_use' && part.name) {
      toolCalls.push({ name: part.name, input: part.input || {} });
    }
  }

  return { text: text.join('\n'), toolCalls, images };
};

export const detectCommand = (text: string): string | null => {
  const match = text.match(/<command-name>([^<]+)<\/command-name>/);
  return match ? match[1] : null;
};

export const highlightFileReferences = (text: string): string => {
  return text.replace(/@([\w\-./]+)/g, '<span class="text-text-accent">@$1</span>');
};

export const formatToolCall = (name: string, input: Record<string, unknown>): string => {
  const params = Object.entries(input)
    .map(([key, value]) => {
      if (typeof value === 'string' && value.length > 50) {
        return `${key}: "${value.slice(0, 50)}..."`;
      }
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join(', ');

  return `${name}(${params})`;
};
