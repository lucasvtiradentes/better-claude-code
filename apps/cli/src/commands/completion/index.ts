import { Command } from 'commander';
import { createCommandFromSchema } from '../../definitions/command-builder.js';
import { CommandNames } from '../../definitions/types.js';
import { createInstallCommand } from './install.js';

export function createCompletionCommand(): Command {
  const completion = createCommandFromSchema(CommandNames.COMPLETION);
  completion.addCommand(createInstallCommand());
  return completion;
}

export { detectShell } from './install.js';
export { reinstallCompletionSilently } from './utils.js';
