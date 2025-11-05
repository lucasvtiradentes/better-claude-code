import { NodeEnv } from '@better-claude-code/node-utils';
import { createLocalHostLink } from '@better-claude-code/shared';
import { ENV } from './env.js';
import { startServer } from './server.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = ENV.SERVER_PORT;
  const staticPath = ENV.FRONTEND_STATIC_PATH;

  startServer(port, staticPath);

  if (ENV.NODE_ENV === NodeEnv.DEVELOPMENT) {
    console.log(`Backend server running on ${createLocalHostLink(port)}`);
    console.log(`Swagger UI available at ${createLocalHostLink(port)}/swagger`);
    console.log(`OpenAPI spec available at ${createLocalHostLink(port)}/openapi.json`);

    if (staticPath) {
      console.log(`Serving static files from: ${staticPath}`);
    }
  }

  if (ENV.NODE_ENV === NodeEnv.PRODUCTION) {
    console.log(`App running on ${createLocalHostLink(port)}`);
  }
}
