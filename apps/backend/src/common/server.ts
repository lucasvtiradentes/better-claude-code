import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NodeEnv } from '@better-claude-code/node-utils';
import {
  API_PREFIX,
  APP_DESCRIPTION,
  APP_NAME,
  createLocalHostLink,
  FRONTEND_PORT,
  OPENAPI_SPEC_PATH,
  SWAGGER_UI_PATH
} from '@better-claude-code/shared';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { ENV } from '../env.js';
import { filesRouter } from '../files/router.js';
import { projectsRouter } from '../projects/router.js';
import { sessionsRouter } from '../sessions/router.js';
import { settingsRouter } from '../settings/router.js';

function proxyToFrontendDevServer(app: OpenAPIHono) {
  app.use('/*', async (c, next) => {
    const url = new URL(c.req.url);
    if (
      !url.pathname.startsWith(API_PREFIX) &&
      !url.pathname.startsWith(SWAGGER_UI_PATH) &&
      !url.pathname.startsWith(OPENAPI_SPEC_PATH)
    ) {
      try {
        const frontendUrl = `${createLocalHostLink(FRONTEND_PORT)}${url.pathname}${url.search}`;
        const res = await fetch(frontendUrl);
        return new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers
        });
      } catch (err) {
        console.error(`Failed to proxy to frontend: ${(err as Error).message}`);
        return c.text('Frontend dev server not available', 502);
      }
    }
    await next();
  });
}

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
  app.doc(OPENAPI_SPEC_PATH, getSwaggerConfig(port));

  app.get(
    SWAGGER_UI_PATH,
    swaggerUI({
      url: OPENAPI_SPEC_PATH
    })
  );
}

const startTime = Date.now();

function setupHealthRoute(app: OpenAPIHono) {
  app.get(`${API_PREFIX}`, (c) => {
    const uptime = Date.now() - startTime;
    return c.json({
      name: `${APP_NAME} API`,
      uptime: `${Math.floor(uptime / 1000)}s`,
      environment: ENV.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });
}

export const getSwaggerConfig = (port: number) => ({
  openapi: '3.1.0',
  info: {
    title: `${APP_NAME} API`,
    description: APP_DESCRIPTION,
    version: '1.0.0'
  },
  servers: [
    {
      url: createLocalHostLink(port),
      description: 'Local development server'
    }
  ]
});

export const createServer = (port: number, staticPath?: string) => {
  const app = new OpenAPIHono();

  app.use('*', cors());

  setupHealthRoute(app);

  app.route(`${API_PREFIX}/files`, filesRouter);
  app.route(`${API_PREFIX}/projects`, projectsRouter);
  app.route(`${API_PREFIX}/sessions`, sessionsRouter);
  app.route(`${API_PREFIX}/settings`, settingsRouter);

  if (ENV.NODE_ENV === NodeEnv.DEVELOPMENT) {
    setupSwagger(app, port);
    proxyToFrontendDevServer(app);
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
