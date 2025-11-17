import type { SessionImage, SessionMessageType } from '@better-claude-code/ui-components';

export type SessionData = {
  session: {
    id: string;
    title: string;
    shortId: string;
    createdAt: string;
    messageCount: number;
    tokenPercentage?: number;
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

export type VSCodeAPI = {
  postMessage: (message: unknown) => void;
  setState: (state: unknown) => void;
  getState: () => unknown;
};
