import type { SessionImage, SessionMessageType } from '@/lib/ui-components';

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

export type VSCodeAPI = {
  postMessage: (message: unknown) => void;
  setState: (state: unknown) => void;
  getState: () => unknown;
};
