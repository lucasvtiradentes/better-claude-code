import { ClaudeHelper } from '@better-claude-code/node-utils';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { spawn } from 'child_process';
import { z } from 'zod';
import { ErrorSchema } from '../../../common/schemas.js';
import { getRealPathFromSession } from '../utils.js';

const paramsSchema = z.object({
  projectId: z.string(),
  action: z.enum(['openFolder', 'openCodeEditor', 'openTerminal'])
});

const responseSchema = z.object({
  success: z.boolean(),
  action: z.string(),
  path: z.string()
});

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Action executed successfully'
  },
  400: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Invalid action'
  },
  404: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Project path not found'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to execute action'
  }
} as const;

export const route = createRoute({
  method: 'post',
  path: '/{projectId}/action/{action}',
  tags: ['Projects'],
  request: {
    params: paramsSchema
  },
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { projectId, action } = c.req.valid('param');

    if (!['openFolder', 'openCodeEditor', 'openTerminal'].includes(action)) {
      return c.json({ error: 'Invalid action' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    const projectPath = ClaudeHelper.getProjectDir(projectId);
    const realPath = await getRealPathFromSession(projectPath);

    if (!realPath) {
      return c.json({ error: 'Project path not found' } satisfies z.infer<typeof ErrorSchema>, 404);
    }

    const platform = process.platform;

    let command: string;
    let args: string[];

    switch (action) {
      case 'openFolder':
        if (platform === 'darwin') {
          command = 'open';
          args = [realPath];
        } else if (platform === 'win32') {
          command = 'explorer';
          args = [realPath];
        } else {
          command = 'xdg-open';
          args = [realPath];
        }
        break;

      case 'openTerminal':
        if (platform === 'darwin') {
          command = 'open';
          args = ['-a', 'Terminal', realPath];
        } else if (platform === 'win32') {
          command = 'cmd';
          args = ['/c', 'start', 'cmd', '/K', `cd /d "${realPath}"`];
        } else {
          command = 'sh';
          args = [
            '-c',
            `cd "${realPath}" && (gnome-terminal --working-directory="${realPath}" || konsole --workdir "${realPath}" || xfce4-terminal --working-directory="${realPath}" || x-terminal-emulator || xterm)`
          ];
        }
        break;

      case 'openCodeEditor':
        command = 'code';
        args = [realPath];
        break;

      default:
        return c.json({ error: 'Invalid action' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      shell: platform === 'win32'
    }).unref();

    return c.json({ success: true, action, path: realPath } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to execute action' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
