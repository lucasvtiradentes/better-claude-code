import { CliEnvSchema, cliEnvSchema, getDefaultNodeEnv } from '@better-claude-code/node-utils';

const cliEnvDefaultValues: CliEnvSchema = {
  NODE_ENV: getDefaultNodeEnv()
  // SHELL
};

export const ENV = cliEnvSchema.parse({ ...cliEnvDefaultValues, ...process.env });
