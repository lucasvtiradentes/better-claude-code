import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';
import { projectsRouter } from './routes/projects.js';
import { sessionsRouter } from './routes/sessions.js';
import { settingsRouter } from './routes/settings.js';

export type ServerOptions = {
  port: number;
  staticPath?: string;
};

export const createServer = (options: ServerOptions): Express => {
  const app = express();

  app.use(express.json());

  if (options.staticPath) {
    app.use(express.static(options.staticPath));
  }

  app.use('/api/projects', projectsRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/settings', settingsRouter);

  if (options.staticPath) {
    app.use((_req, res) => {
      const indexPath = path.resolve(options.staticPath as string, 'index.html');
      try {
        const content = fs.readFileSync(indexPath, 'utf8');
        res.type('html').send(content);
      } catch (err) {
        console.error(`Failed to serve index.html: ${(err as Error).message}`);
        res.status(500).send('Error loading page');
      }
    });
  }

  return app;
};

export const startServer = (options: ServerOptions) => {
  const app = createServer(options);
  return app.listen(options.port);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT) || 3001;
  const staticPath = process.env.STATIC_PATH;
  startServer({ port, staticPath });
  console.log(`Backend server running on http://localhost:${port}`);
  if (staticPath) {
    console.log(`Serving static files from: ${staticPath}`);
  }
}
