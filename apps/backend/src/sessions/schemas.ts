import { z } from 'zod';
import { PaginationMetaSchema } from '../common/schemas';

export const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  messageCount: z.number(),
  createdAt: z.number(),
  tokenPercentage: z.number().optional(),
  searchMatchCount: z.number().optional(),
  imageCount: z.number().optional(),
  customCommandCount: z.number().optional(),
  filesOrFoldersCount: z.number().optional(),
  labels: z.array(z.string()).optional()
});

export const MessageSchema = z.object({
  type: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.number().optional()
});

export const ImageSchema = z.object({
  index: z.number(),
  data: z.string()
});

export const SessionsResponseSchema = z.object({
  items: z.array(SessionSchema),
  meta: PaginationMetaSchema
});

export const SessionDetailResponseSchema = z.object({
  messages: z.array(MessageSchema),
  images: z.array(ImageSchema)
});
