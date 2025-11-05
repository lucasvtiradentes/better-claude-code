import { NodeEnv } from '@better-claude-code/node-utils';
import { ENV } from './env.js';
import { startServer } from './server.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = ENV.SERVER_PORT;
  const staticPath = ENV.FRONTEND_STATIC_PATH;

  startServer({ port, staticPath });

  if (ENV.NODE_ENV === NodeEnv.DEVELOPMENT) {
    console.log(`Backend server running on http://localhost:${port}`);
    console.log(`Swagger UI available at http://localhost:${port}/swagger`);
    console.log(`OpenAPI spec available at http://localhost:${port}/openapi.json`);

    if (staticPath) {
      console.log(`Serving static files from: ${staticPath}`);
    }
  }

  if (ENV.NODE_ENV === NodeEnv.PRODUCTION) {
    console.log(`App running on http://localhost:${port}`);
  }
}
