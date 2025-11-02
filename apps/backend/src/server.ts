import express, { type Express } from 'express';
import path from 'path';
import { reposRouter } from './routes/repos.js';
import { sessionsRouter } from './routes/sessions.js';

export type ServerOptions = {
  port: number;
  staticPath?: string;
};

export const createServer = (options: ServerOptions): Express => {
  const app = express();

  if (options.staticPath) {
    app.use(express.static(options.staticPath));
  }

  app.use('/api/repos', reposRouter);
  app.use('/api/sessions', sessionsRouter);

  if (options.staticPath) {
    app.get('*', (_req, res) => {
      res.sendFile(path.join(options.staticPath as string, 'index.html'));
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
  startServer({ port });
  console.log(`Backend server running on http://localhost:${port}`);
}
