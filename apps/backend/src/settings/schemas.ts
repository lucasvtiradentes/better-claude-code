import { z } from 'zod';
import { ProjectLabelSchema } from '../common/schemas';

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

export const LabelsResponseSchema = z.object({
  success: z.boolean(),
  labels: z.array(z.string())
});
