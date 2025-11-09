import { generateUuid } from '@better-claude-code/node-utils';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { streamSSE } from 'hono/streaming';
import {
  ActiveSessionsResponseSchema,
  ApprovePermissionsRequestSchema,
  ApprovePermissionsResponseSchema,
  CancelSessionResponseSchema,
  CreateSessionRequestSchema,
  CreateSessionResponseSchema,
  ErrorResponseSchema,
  SendMessageRequestSchema,
  SendMessageResponseSchema,
  SessionStatusResponseSchema,
  StreamQuerySchema
} from './schemas.js';
import { sessionManager } from './session-manager.js';
import { approvePermissions } from './use-cases/approve-permissions.js';
import { cancelSession } from './use-cases/cancel-session.js';
import { createSession } from './use-cases/create-session.js';
import { getSessionStatus } from './use-cases/get-session-status.js';
import { listActiveSessions } from './use-cases/list-active-sessions.js';
import { sendMessage } from './use-cases/send-message.js';
import { startStream } from './use-cases/start-stream.js';

export const liveSessionsRouter = new OpenAPIHono();

const createSessionRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateSessionRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Session created successfully',
      content: {
        'application/json': {
          schema: CreateSessionResponseSchema
        }
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

liveSessionsRouter.openapi(createSessionRoute, async (c) => {
  const { projectPath, sessionId } = c.req.valid('json');

  try {
    const result = createSession(projectPath, sessionId);
    return c.json(result, 200);
  } catch (e) {
    return c.json(
      {
        error: 'Failed to create session',
        details: e instanceof Error ? e.message : 'Unknown error'
      },
      400
    );
  }
});

const streamSessionRoute = createRoute({
  method: 'get',
  path: '/{sessionId}/stream',
  request: {
    params: z.object({
      sessionId: z.string().min(1)
    }),
    query: StreamQuerySchema
  },
  responses: {
    200: {
      description: 'SSE stream of Claude responses',
      content: {
        'text/event-stream': {
          schema: {} as any
        }
      }
    },
    404: {
      description: 'Session not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

liveSessionsRouter.openapi(streamSessionRoute, async (c) => {
  const { sessionId } = c.req.valid('param');
  const { projectPath } = c.req.valid('query');

  return streamSSE(c, async (stream) => {
    await startStream(sessionId, '', projectPath, stream, false);
  });
});

const sendMessageRoute = createRoute({
  method: 'post',
  path: '/{sessionId}/messages',
  request: {
    params: z.object({
      sessionId: z.string().min(1)
    }),
    body: {
      content: {
        'application/json': {
          schema: SendMessageRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Message sent successfully',
      content: {
        'application/json': {
          schema: SendMessageResponseSchema
        }
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    },
    404: {
      description: 'Session not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

liveSessionsRouter.openapi(sendMessageRoute, async (c) => {
  const { sessionId } = c.req.valid('param');
  const { message, imagePaths, projectPath } = c.req.valid('json');

  if (sessionId === 'new') {
    if (!projectPath) {
      return c.json({ error: 'projectPath required for new sessions' }, 400);
    }

    const tempSessionId = sessionManager.createSession(projectPath);
    const messageId = generateUuid();
    sessionManager.addMessage(tempSessionId, { id: messageId, role: 'user', content: message, imagePaths });

    return c.json({ success: true, pending: true, tempSessionId }, 200);
  }

  const result = sendMessage(sessionId, message, imagePaths, projectPath);

  if (!result.success) {
    console.error(`[Router] Failed to send message to ${sessionId}:`, result.error);
    return c.json({ error: result.error || 'Failed to send message' }, 404);
  }

  return c.json({ success: true }, 200);
});

const cancelSessionRoute = createRoute({
  method: 'post',
  path: '/{sessionId}/cancel',
  request: {
    params: z.object({
      sessionId: z.string().min(1)
    })
  },
  responses: {
    200: {
      description: 'Session cancelled successfully',
      content: {
        'application/json': {
          schema: CancelSessionResponseSchema
        }
      }
    },
    404: {
      description: 'Session not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

liveSessionsRouter.openapi(cancelSessionRoute, async (c) => {
  const { sessionId } = c.req.valid('param');

  const result = cancelSession(sessionId);

  if (!result.success) {
    return c.json({ error: result.message }, 404);
  }

  return c.json(result, 200);
});

const approvePermissionsRoute = createRoute({
  method: 'post',
  path: '/{sessionId}/permissions',
  request: {
    params: z.object({
      sessionId: z.string().min(1)
    }),
    body: {
      content: {
        'application/json': {
          schema: ApprovePermissionsRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Permissions processed successfully',
      content: {
        'application/json': {
          schema: ApprovePermissionsResponseSchema
        }
      }
    },
    404: {
      description: 'Session not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

liveSessionsRouter.openapi(approvePermissionsRoute, async (c) => {
  const { sessionId } = c.req.valid('param');
  const { permissions } = c.req.valid('json');

  const result = approvePermissions(sessionId, permissions);

  if (!result.success) {
    return c.json({ error: result.error || 'Failed to process permissions' }, 404);
  }

  return c.json(
    {
      success: true,
      processedCount: result.processedCount
    },
    200
  );
});

const getActiveSessionsRoute = createRoute({
  method: 'get',
  path: '/active',
  responses: {
    200: {
      description: 'List of active sessions',
      content: {
        'application/json': {
          schema: ActiveSessionsResponseSchema
        }
      }
    }
  }
});

liveSessionsRouter.openapi(getActiveSessionsRoute, async (c) => {
  const result = listActiveSessions();
  return c.json(result, 200);
});

const getSessionStatusRoute = createRoute({
  method: 'get',
  path: '/{sessionId}/status',
  request: {
    params: z.object({
      sessionId: z.string().min(1)
    })
  },
  responses: {
    200: {
      description: 'Session status',
      content: {
        'application/json': {
          schema: SessionStatusResponseSchema
        }
      }
    },
    404: {
      description: 'Session not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

liveSessionsRouter.openapi(getSessionStatusRoute, async (c) => {
  const { sessionId } = c.req.valid('param');

  const result = getSessionStatus(sessionId);

  if (!result) {
    return c.json({ error: 'Session not found' }, 404);
  }

  return c.json(result, 200);
});
