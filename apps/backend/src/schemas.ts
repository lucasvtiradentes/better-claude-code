import { z } from 'zod';

export const ProjectLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string()
});

export const ProjectSettingSchema = z.object({
  labels: z.array(z.string()),
  hidden: z.boolean()
});

export const AppSettingsSchema = z.object({
  projects: z.object({
    groupBy: z.string(),
    filters: z.object({
      selectedLabels: z.array(z.string())
    }),
    display: z.object({
      showSessionCount: z.boolean(),
      showCurrentBranch: z.boolean(),
      showActionButtons: z.boolean(),
      showProjectLabel: z.boolean()
    }),
    search: z.string(),
    labels: z.array(ProjectLabelSchema),
    projectSettings: z.record(z.string(), ProjectSettingSchema)
  }),
  sessions: z.object({
    groupBy: z.string(),
    filters: z.record(z.string(), z.unknown()),
    display: z.object({
      showTokenPercentage: z.boolean(),
      showAttachments: z.boolean()
    }),
    labels: z.array(ProjectLabelSchema)
  })
});

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

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  sessionsCount: z.number(),
  lastModified: z.number(),
  isGitRepo: z.boolean(),
  githubUrl: z.string().optional(),
  currentBranch: z.string().optional(),
  labels: z.array(z.string()),
  hidden: z.boolean()
});

export const ErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional()
});

export const SuccessSchema = z.object({
  success: z.boolean()
});

export const PaginationMetaSchema = z.object({
  totalItems: z.number(),
  totalPages: z.number(),
  page: z.number(),
  limit: z.number()
});

export const SessionsResponseSchema = z.object({
  items: z.array(SessionSchema),
  meta: PaginationMetaSchema
});

export const SessionDetailResponseSchema = z.object({
  messages: z.array(MessageSchema),
  images: z.array(ImageSchema)
});

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

export const LabelsResponseSchema = z.object({
  success: z.boolean(),
  labels: z.array(z.string())
});

export const ActionResponseSchema = z.object({
  success: z.boolean(),
  action: z.string(),
  path: z.string()
});
