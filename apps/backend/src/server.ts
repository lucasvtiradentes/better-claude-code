import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { filesRouter } from './files/router.js';
import { projectsRouter } from './projects/router.js';
import { sessionsRouter } from './sessions/router.js';
import { settingsRouter } from './settings/router.js';

export type ServerOptions = {
  port: number;
  staticPath?: string;
};

export const createServer = (options: ServerOptions) => {
  const app = new OpenAPIHono();

  app.use('*', cors());

  app.route('/api/files', filesRouter);
  app.route('/api/projects', projectsRouter);
  app.route('/api/sessions', sessionsRouter);
  app.route('/api/settings', settingsRouter);

  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Better Claude Code API',
      description: 'API for managing Claude projects, sessions, and settings'
    },
    servers: [
      {
        url: `http://localhost:${options.port}`,
        description: 'Local development server'
      }
    ]
  });

  app.get(
    '/swagger',
    swaggerUI({
      url: '/openapi.json'
    })
  );

  if (options.staticPath) {
    app.use('/*', serveStatic({ root: options.staticPath }));

    app.get('*', (c) => {
      const indexPath = resolve(options.staticPath as string, 'index.html');
      try {
        const content = readFileSync(indexPath, 'utf8');
        return c.html(content);
      } catch (err) {
        console.error(`Failed to serve index.html: ${(err as Error).message}`);
        return c.text('Error loading page', 500);
      }
    });
  }

  return app;
};

export const startServer = (options: ServerOptions) => {
  const app = createServer(options);
  return serve({
    fetch: app.fetch,
    port: options.port
  });
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT) || 3001;
  const staticPath = process.env.STATIC_PATH;
  startServer({ port, staticPath });
  console.log(`Backend server running on http://localhost:${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/swagger`);
  console.log(`OpenAPI spec available at http://localhost:${port}/openapi.json`);
  if (staticPath) {
    console.log(`Serving static files from: ${staticPath}`);
  }
}
