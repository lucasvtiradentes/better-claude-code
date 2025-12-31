export type SessionMessage = {
  id: string;
  type: string;
  content: string;
  timestamp: string;
};

export type SessionImage = {
  index: number;
  data: string;
  messageId: string;
};

export type PathValidation = {
  path: string;
  exists: boolean;
};

export type SessionCardData = {
  id: string;
  shortId?: string;
  title: string;
  createdAt: string;
  modifiedAt: string;
  messageCount: number;
  tokenPercentage?: number;
  imageCount?: number;
  customCommandCount?: number;
  filesOrFoldersCount?: number;
  urlCount?: number;
  searchMatchCount?: number;
  labels?: string[];
};
