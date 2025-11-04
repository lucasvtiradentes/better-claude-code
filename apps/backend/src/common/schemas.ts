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
