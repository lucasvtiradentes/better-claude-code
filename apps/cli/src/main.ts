#!/usr/bin/env node

import { APP_CLI_NAME, APP_DESCRIPTION } from '@better-claude-code/shared';
import { Command } from 'commander';
import { createCompactCommand } from './commands/compact.js';
import { createCompletionCommand } from './commands/completion/index.js';
import { displayHelpText } from './commands/help-text.js';
import { createServerCommand } from './commands/server/index.js';
import { createUpdateCommand } from './commands/update.js';
import { APP_VERSION } from './utils/version.js';

const program = new Command();

program.name(APP_CLI_NAME).description(APP_DESCRIPTION).version(APP_VERSION);

program.addCommand(createUpdateCommand());
program.addCommand(createCompletionCommand());
program.addCommand(createCompactCommand());
program.addCommand(createServerCommand());

program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => cmd.name()
});

program.on('--help', () => {
  displayHelpText();
});

if (!process.argv.slice(2).length) {
  console.log('');
  displayHelpText();
  process.exit(0);
}

program.parse();
