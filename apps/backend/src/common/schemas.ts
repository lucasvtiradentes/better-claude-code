import { z } from 'zod';

export const ProjectLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  usageCount: z.number().optional(),
  projects: z.array(z.string()).optional()
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

export const SessionLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  usageCount: z.number().optional(),
  sessions: z.record(z.string(), z.array(z.string())).optional()
});

export const AppSettingsSchema = z.object({
  projects: z.object({
    display: z.object({
      showSessionCount: z.boolean(),
      showCurrentBranch: z.boolean(),
      showActionButtons: z.boolean(),
      showProjectLabel: z.boolean()
    }),
    labels: z.array(ProjectLabelSchema),
    hiddenProjects: z.array(z.string())
  }),
  sessions: z.object({
    display: z.object({
      showTokenPercentage: z.boolean(),
      showAttachments: z.boolean()
    }),
    labels: z.array(SessionLabelSchema)
  })
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;
