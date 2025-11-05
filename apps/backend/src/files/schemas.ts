import { FolderEntry } from '@better-claude-code/shared';
import { z } from 'zod';

const FileInfoSchema = z.object({
  path: z.string(),
  label: z.string()
});

export const FileListResponseSchema = z.object({
  files: z.array(FileInfoSchema)
});

export const FileContentSchema = z.object({
  content: z.string(),
  extension: z.string(),
  isSymlink: z.boolean(),
  realPath: z.string(),
  path: z.string()
});

export const FolderContentSchema = z.object({
  content: z.string()
});

export const FolderEntrySchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(FolderEntry)
});

export const FolderEntriesSchema = z.object({
  entries: z.array(FolderEntrySchema)
});

export const PathValidationSchema = z.object({
  path: z.string(),
  exists: z.boolean()
});

export const UpdateFileBodySchema = z.object({
  path: z.string(),
  content: z.string()
});

export const UpdateFileResponseSchema = z.object({
  success: z.boolean(),
  path: z.string()
});
