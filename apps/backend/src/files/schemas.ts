import { z } from 'zod';

export const FileInfoSchema = z.object({
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
  type: z.enum(['file', 'directory'])
});

export const FolderEntriesSchema = z.object({
  entries: z.array(FolderEntrySchema)
});

export const PathValidationSchema = z.object({
  path: z.string(),
  exists: z.boolean()
});
