import { CliEnvSchema, cliEnvSchema, NodeEnv } from '@better-claude-code/node-utils';

const cliEnvDefaultValues: CliEnvSchema = {
  NODE_ENV: NodeEnv.DEVELOPMENT
  // SHELL
};

export const ENV = cliEnvSchema.parse({ ...cliEnvDefaultValues, ...process.env });
