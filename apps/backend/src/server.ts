import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NodeEnv } from '@better-claude-code/node-utils';
import { API_PREFIX } from '@better-claude-code/shared';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { ENV } from './env.js';
import { filesRouter } from './files/router.js';
import { projectsRouter } from './projects/router.js';
import { sessionsRouter } from './sessions/router.js';
import { settingsRouter } from './settings/router.js';

type ServerOptions = {
  port: number;
  staticPath?: string;
};

function serveStaticFrontend(app: OpenAPIHono, staticPath: string) {
  app.use('/*', serveStatic({ root: staticPath }));

  app.get('*', (c) => {
    const indexPath = resolve(staticPath as string, 'index.html');
    try {
      const content = readFileSync(indexPath, 'utf8');
      return c.html(content);
    } catch (err) {
      console.error(`Failed to serve index.html: ${(err as Error).message}`);
      return c.text('Error loading page', 500);
    }
  });
}

function setupSwagger(app: OpenAPIHono, port: number) {
  app.doc('/openapi.json', getSwaggerConfig(port));

  app.get(
    '/swagger',
    swaggerUI({
      url: '/openapi.json'
    })
  );
}

export const getSwaggerConfig = (port: number) => ({
  openapi: '3.1.0',
  info: {
    version: '1.0.0',
    title: 'Better Claude Code API',
    description: 'API for managing Claude projects, sessions, and settings'
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: 'Local development server'
    }
  ]
});

export const createServer = (port: number, staticPath?: string) => {
  const app = new OpenAPIHono();

  app.use('*', cors());

  app.route(`${API_PREFIX}/files`, filesRouter);
  app.route(`${API_PREFIX}/projects`, projectsRouter);
  app.route(`${API_PREFIX}/sessions`, sessionsRouter);
  app.route(`${API_PREFIX}/settings`, settingsRouter);

  if (ENV.NODE_ENV === NodeEnv.DEVELOPMENT) {
    setupSwagger(app, port);
  }

  if (staticPath) {
    serveStaticFrontend(app, staticPath);
  }

  return app;
};

export const startServer = (port: number, staticPath?: string) => {
  const app = createServer(port, staticPath);
  return serve({
    fetch: app.fetch,
    port: port
  });
};
