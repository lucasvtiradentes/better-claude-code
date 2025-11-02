import express, { type Application } from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { reposRouter } from './routes/repos.js';
import { sessionsRouter } from './routes/sessions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createServer(_port = 3000): Application {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', join(__dirname, 'views'));

  app.use(express.static(join(__dirname, 'public')));
  app.use(express.json());

  app.use('/api/repos', reposRouter);
  app.use('/api/sessions', sessionsRouter);

  app.get('/', (_req, res) => {
    res.render('index');
  });

  return app;
}

export function startServer(port = 3000) {
  const app = createServer(port);

  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  return server;
}
