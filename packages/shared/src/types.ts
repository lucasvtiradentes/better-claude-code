export type MessageContent =
  | string
  | Array<{
      type: 'text' | 'image' | 'tool_use' | 'tool_result';
      text?: string;
      source?: { data: string };
      name?: string;
      input?: Record<string, unknown>;
    }>;
