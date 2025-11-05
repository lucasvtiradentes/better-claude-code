import { z } from 'zod';

export const ProjectLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string()
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

export const ProjectSettingSchema = z.object({
  labels: z.array(z.string()),
  hidden: z.boolean()
});

export const AppSettingsSchema = z.object({
  projects: z.object({
    groupBy: z.enum(['date', 'label', 'session-count']),
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
    groupBy: z.enum(['date', 'token-percentage', 'label']),
    filters: z.record(z.string(), z.unknown()),
    display: z.object({
      showTokenPercentage: z.boolean(),
      showAttachments: z.boolean()
    }),
    labels: z.array(ProjectLabelSchema)
  })
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;
