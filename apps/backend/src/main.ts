import { NodeEnv } from '@better-claude-code/node-utils';
import { createLocalHostLink, OPENAPI_SPEC_PATH, SWAGGER_UI_PATH } from '@better-claude-code/shared';
import { startServer } from './common/server.js';
import { ENV } from './env.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = ENV.SERVER_PORT;

  const staticPath = ENV.FRONTEND_STATIC_PATH;
  startServer(port, staticPath);

  console.log(`App running on ${createLocalHostLink(port)}`);

  if (ENV.NODE_ENV === NodeEnv.DEVELOPMENT) {
    console.log(`Swagger UI available at ${createLocalHostLink(port, SWAGGER_UI_PATH)}`);
    console.log(`OpenAPI spec available at ${createLocalHostLink(port, OPENAPI_SPEC_PATH)}`);
  }
}
