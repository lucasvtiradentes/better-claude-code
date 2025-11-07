import { BackendEnvSchema, backendEnvSchema, getDefaultNodeEnv } from '@better-claude-code/node-utils';
import { BACKEND_PORT } from '@better-claude-code/shared';

const backendEnvDefaultValues: BackendEnvSchema = {
  NODE_ENV: getDefaultNodeEnv(),
  SERVER_PORT: BACKEND_PORT
  // FRONTEND_STATIC_PATH,
  // SHELL
};

export const ENV = backendEnvSchema.parse({ ...backendEnvDefaultValues, ...process.env });
