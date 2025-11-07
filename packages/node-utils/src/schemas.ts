import z from 'zod';

export enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production'
}

export const backendEnvSchema = z.object({
  SERVER_PORT: z.coerce.number(),
  FRONTEND_STATIC_PATH: z.string().optional(),
  //shared
  NODE_ENV: z.enum(NodeEnv),
  SHELL: z.string().optional()
});

export type BackendEnvSchema = z.infer<typeof backendEnvSchema>;

export const cliEnvSchema = z.object({
  //shared
  NODE_ENV: z.enum(NodeEnv),
  SHELL: z.string().optional()
});

export type CliEnvSchema = z.infer<typeof cliEnvSchema>;
