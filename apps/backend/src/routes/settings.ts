// @ts-nocheck
import { dirname, join } from 'node:path';
import type { AppSettings, ProjectLabel } from '@better-claude-code/shared';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import os from 'os';
import { z } from 'zod';
import { AppSettingsSchema, ErrorSchema, ProjectLabelSchema, ProjectSettingSchema, SuccessSchema } from '../schemas.js';

export const settingsRouter = new OpenAPIHono();

const SETTINGS_PATH = join(os.homedir(), '.config', 'bcc', 'settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  projects: {
    groupBy: 'date',
    filters: {
      selectedLabels: [] as string[]
    },
    display: {
      showSessionCount: true,
      showCurrentBranch: true,
      showActionButtons: true,
      showProjectLabel: true
    },
    search: '',
    labels: [
      { id: 'personal', name: 'Personal', color: '#0e639c' },
      { id: 'work', name: 'Work', color: '#00875a' }
    ],
    projectSettings: {}
  },
  sessions: {
    groupBy: 'date',
    filters: {},
    display: {
      showTokenPercentage: true,
      showAttachments: false
    },
    labels: [{ id: 'important', name: 'Important', color: '#f59e0b' }]
  }
};

async function ensureSettingsFile(): Promise<void> {
  try {
    await fs.mkdir(dirname(SETTINGS_PATH), { recursive: true });
    await fs.access(SETTINGS_PATH);
  } catch {
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  }
}

async function readSettings(): Promise<AppSettings> {
  await ensureSettingsFile();
  const content = await fs.readFile(SETTINGS_PATH, 'utf-8');
  const settings = JSON.parse(content) as Partial<AppSettings>;

  let needsUpdate = false;

  if (!settings.sessions) {
    settings.sessions = DEFAULT_SETTINGS.sessions;
    needsUpdate = true;
  }

  if (!settings.projects) {
    settings.projects = DEFAULT_SETTINGS.projects;
    needsUpdate = true;
  }

  if (needsUpdate) {
    await writeSettings(settings as AppSettings);
  }

  return settings as AppSettings;
}

async function writeSettings(settings: AppSettings): Promise<void> {
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

const getSettingsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Settings'],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: AppSettingsSchema
        }
      },
      description: 'Returns app settings'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to read settings'
    }
  }
});

settingsRouter.openapi(getSettingsRoute, async (c) => {
  try {
    const settings = await readSettings();
    return c.json(settings);
  } catch {
    return c.json({ error: 'Failed to read settings' }, 500);
  }
});

const patchSettingsRoute = createRoute({
  method: 'patch',
  path: '/',
  tags: ['Settings'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: AppSettingsSchema.partial()
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: AppSettingsSchema
        }
      },
      description: 'Returns updated settings'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to update settings'
    }
  }
});

settingsRouter.openapi(patchSettingsRoute, async (c) => {
  try {
    const settings = await readSettings();
    const updates = await c.req.json();

    if (updates.projects) {
      settings.projects = { ...settings.projects, ...updates.projects };
    }

    if (updates.sessions) {
      settings.sessions = { ...settings.sessions, ...updates.sessions };
    }

    await writeSettings(settings);
    return c.json(settings);
  } catch {
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

const patchProjectSettingsRoute = createRoute({
  method: 'patch',
  path: '/projects/{projectId}',
  tags: ['Settings'],
  request: {
    params: z.object({
      projectId: z.string()
    }),
    body: {
      content: {
        'application/json': {
          schema: ProjectSettingSchema.partial()
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ProjectSettingSchema
        }
      },
      description: 'Returns updated project settings'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to update project settings'
    }
  }
});

settingsRouter.openapi(patchProjectSettingsRoute, async (c) => {
  try {
    const { projectId } = c.req.param();
    const settings = await readSettings();

    if (!settings.projects.projectSettings[projectId]) {
      settings.projects.projectSettings[projectId] = {
        labels: [],
        hidden: false
      };
    }

    const updates = await c.req.json();
    if (updates.labels !== undefined) {
      settings.projects.projectSettings[projectId].labels = updates.labels;
    }
    if (updates.hidden !== undefined) {
      settings.projects.projectSettings[projectId].hidden = updates.hidden;
    }

    await writeSettings(settings);
    return c.json(settings.projects.projectSettings[projectId]);
  } catch {
    return c.json({ error: 'Failed to update project settings' }, 500);
  }
});

const createLabelRoute = createRoute({
  method: 'post',
  path: '/labels',
  tags: ['Settings'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: ProjectLabelSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ProjectLabelSchema
        }
      },
      description: 'Returns created label'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Invalid label data'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to create label'
    }
  }
});

settingsRouter.openapi(createLabelRoute, async (c) => {
  try {
    const settings = await readSettings();
    const newLabel: ProjectLabel = await c.req.json();

    if (!newLabel.id || !newLabel.name || !newLabel.color) {
      return c.json({ error: 'Invalid label data' }, 400);
    }

    settings.projects.labels.push(newLabel);
    await writeSettings(settings);
    return c.json(newLabel);
  } catch {
    return c.json({ error: 'Failed to create label' }, 500);
  }
});

const updateLabelRoute = createRoute({
  method: 'patch',
  path: '/labels/{labelId}',
  tags: ['Settings'],
  request: {
    params: z.object({
      labelId: z.string()
    }),
    body: {
      content: {
        'application/json': {
          schema: ProjectLabelSchema.partial()
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ProjectLabelSchema
        }
      },
      description: 'Returns updated label'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Label not found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to update label'
    }
  }
});

settingsRouter.openapi(updateLabelRoute, async (c) => {
  try {
    const { labelId } = c.req.param();
    const settings = await readSettings();
    const labelIndex = settings.projects.labels.findIndex((l) => l.id === labelId);

    if (labelIndex === -1) {
      return c.json({ error: 'Label not found' }, 404);
    }

    const updates = await c.req.json();
    if (updates.name !== undefined) {
      settings.projects.labels[labelIndex].name = updates.name;
    }
    if (updates.color !== undefined) {
      settings.projects.labels[labelIndex].color = updates.color;
    }

    await writeSettings(settings);
    return c.json(settings.projects.labels[labelIndex]);
  } catch {
    return c.json({ error: 'Failed to update label' }, 500);
  }
});

const deleteLabelRoute = createRoute({
  method: 'delete',
  path: '/labels/{labelId}',
  tags: ['Settings'],
  request: {
    params: z.object({
      labelId: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SuccessSchema
        }
      },
      description: 'Label deleted successfully'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to delete label'
    }
  }
});

settingsRouter.openapi(deleteLabelRoute, async (c) => {
  try {
    const { labelId } = c.req.param();
    const settings = await readSettings();

    settings.projects.labels = settings.projects.labels.filter((l) => l.id !== labelId);

    for (const projectId in settings.projects.projectSettings) {
      settings.projects.projectSettings[projectId].labels = settings.projects.projectSettings[projectId].labels.filter(
        (id) => id !== labelId
      );
    }

    await writeSettings(settings);
    return c.json({ success: true });
  } catch {
    return c.json({ error: 'Failed to delete label' }, 500);
  }
});

const createSessionLabelRoute = createRoute({
  method: 'post',
  path: '/sessions/labels',
  tags: ['Settings'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: ProjectLabelSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ProjectLabelSchema
        }
      },
      description: 'Returns created session label'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Invalid label data'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to create label'
    }
  }
});

settingsRouter.openapi(createSessionLabelRoute, async (c) => {
  try {
    const settings = await readSettings();
    const newLabel: ProjectLabel = await c.req.json();

    if (!newLabel.id || !newLabel.name || !newLabel.color) {
      return c.json({ error: 'Invalid label data' }, 400);
    }

    settings.sessions.labels.push(newLabel);
    await writeSettings(settings);
    return c.json(newLabel);
  } catch {
    return c.json({ error: 'Failed to create label' }, 500);
  }
});

const updateSessionLabelRoute = createRoute({
  method: 'patch',
  path: '/sessions/labels/{labelId}',
  tags: ['Settings'],
  request: {
    params: z.object({
      labelId: z.string()
    }),
    body: {
      content: {
        'application/json': {
          schema: ProjectLabelSchema.partial()
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ProjectLabelSchema
        }
      },
      description: 'Returns updated session label'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Label not found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to update label'
    }
  }
});

settingsRouter.openapi(updateSessionLabelRoute, async (c) => {
  try {
    const { labelId } = c.req.param();
    const settings = await readSettings();
    const labelIndex = settings.sessions.labels.findIndex((l) => l.id === labelId);

    if (labelIndex === -1) {
      return c.json({ error: 'Label not found' }, 404);
    }

    const updates = await c.req.json();
    if (updates.name !== undefined) {
      settings.sessions.labels[labelIndex].name = updates.name;
    }
    if (updates.color !== undefined) {
      settings.sessions.labels[labelIndex].color = updates.color;
    }

    await writeSettings(settings);
    return c.json(settings.sessions.labels[labelIndex]);
  } catch {
    return c.json({ error: 'Failed to update label' }, 500);
  }
});

const deleteSessionLabelRoute = createRoute({
  method: 'delete',
  path: '/sessions/labels/{labelId}',
  tags: ['Settings'],
  request: {
    params: z.object({
      labelId: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SuccessSchema
        }
      },
      description: 'Session label deleted successfully'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to delete label'
    }
  }
});

settingsRouter.openapi(deleteSessionLabelRoute, async (c) => {
  try {
    const { labelId } = c.req.param();
    const settings = await readSettings();

    settings.sessions.labels = settings.sessions.labels.filter((l) => l.id !== labelId);

    await writeSettings(settings);
    return c.json({ success: true });
  } catch {
    return c.json({ error: 'Failed to delete label' }, 500);
  }
});
