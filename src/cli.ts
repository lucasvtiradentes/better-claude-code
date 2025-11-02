#!/usr/bin/env node

import { Command } from 'commander';

import { createCompletionCommand } from './commands/completion.js';
import { displayHelpText } from './commands/help-text.js';
import { createHelloCommand } from './commands/hello.js';
import { createUpdateCommand } from './commands/update.js';
import { APP_INFO } from './config/constants.js';

const program = new Command();

program
  .name('bcc')
  .description('Better Claude Code - CLI auxiliary tools for Claude Code')
  .version(APP_INFO.version);

program.addCommand(createHelloCommand());
program.addCommand(createUpdateCommand());
program.addCommand(createCompletionCommand());

program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => cmd.name()
});

program.on('--help', () => {
  displayHelpText();
});

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
