import { BackendEnvSchema, backendEnvSchema, NodeEnv } from '@better-claude-code/node-utils';
import { BACKEND_PORT } from '@better-claude-code/shared';

const backendEnvDefaultValues: BackendEnvSchema = {
  NODE_ENV: NodeEnv.DEVELOPMENT,
  SERVER_PORT: BACKEND_PORT
  // FRONTEND_STATIC_PATH,
  // SHELL
};

export const ENV = backendEnvSchema.parse({ ...backendEnvDefaultValues, ...process.env });
