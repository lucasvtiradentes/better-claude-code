import { z } from 'zod';

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

export const ActionResponseSchema = z.object({
  success: z.boolean(),
  action: z.string(),
  path: z.string()
});
