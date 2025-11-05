import { APP_CLI_NAME } from '@better-claude-code/shared';
import { type Command, CommandNames } from '../types.js';

export const updateCommandDefinition: Command = {
  name: CommandNames.UPDATE,
  description: `Update ${APP_CLI_NAME} to latest version`,
  examples: [`${APP_CLI_NAME} update`]
};
