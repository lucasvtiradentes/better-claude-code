import { z } from '@hono/zod-openapi';

export const CreateSessionRequestSchema = z.object({
  projectPath: z.string().min(1),
  sessionId: z.string().uuid().optional()
});

export const CreateSessionResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.string()
});

export const SendMessageRequestSchema = z.object({
  message: z.string().min(1),
  imagePaths: z.array(z.string()).optional(),
  projectPath: z.string().min(1).optional()
});

export const StreamQuerySchema = z.object({
  projectPath: z.string().min(1)
});

export const SendMessageResponseSchema = z.object({
  success: z.boolean(),
  sessionId: z.string().optional()
});

export const ApprovePermissionsRequestSchema = z.object({
  permissions: z.array(
    z.object({
      id: z.string(),
      approved: z.boolean()
    })
  )
});

export const ApprovePermissionsResponseSchema = z.object({
  success: z.boolean(),
  processedCount: z.number()
});

export const CancelSessionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

export const ActiveSessionSchema = z.object({
  sessionId: z.string().uuid(),
  projectPath: z.string(),
  status: z.enum(['idle', 'streaming', 'pending-permissions', 'completed', 'cancelled', 'error']),
  createdAt: z.string().datetime(),
  pendingPermissionsCount: z.number()
});

export const ActiveSessionsResponseSchema = z.object({
  sessions: z.array(ActiveSessionSchema)
});

export const SessionStatusResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.enum(['idle', 'streaming', 'pending-permissions', 'completed', 'cancelled', 'error']),
  pendingPermissions: z.array(
    z.object({
      id: z.string(),
      tool: z.string(),
      description: z.string(),
      path: z.string().optional(),
      command: z.string().optional()
    })
  )
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional()
});
