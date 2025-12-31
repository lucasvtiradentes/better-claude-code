export type VSCodeAPI = {
  postMessage: (message: unknown) => void;
  setState: (state: unknown) => void;
  getState: () => unknown;
};

export type SessionImage = {
  index: number;
  data: string;
  messageIndex: number;
};

export type SessionMessageType = {
  type: 'user' | 'assistant';
  content: string | unknown[];
  timestamp?: number;
};

export type SessionData = {
  session: {
    id: string;
    title: string;
    shortId: string;
    createdAt: string;
    messageCount: number;
    tokenPercentage?: number;
    compacted?: boolean;
  };
  conversation: {
    messages: SessionMessageType[];
    images: SessionImage[];
  };
  filters?: {
    showUserMessages: boolean;
    showAssistantMessages: boolean;
    showToolCalls: boolean;
  };
};
