#!/usr/bin/env node

import { Command } from 'commander';

import { createCompactCommand } from './commands/compact.js';
import { createCompletionCommand } from './commands/completion.js';
import { createHelloCommand } from './commands/hello.js';
import { displayHelpText } from './commands/help-text.js';
import { createServerCommand } from './commands/server.js';
import { createUpdateCommand } from './commands/update.js';
import { APP_INFO } from './config/constants.js';

const program = new Command();

program.name('bcc').description('Better Claude Code - CLI auxiliary tools for Claude Code').version(APP_INFO.version);

program.addCommand(createHelloCommand());
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
