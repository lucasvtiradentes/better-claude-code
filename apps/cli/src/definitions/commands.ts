import { compactCommandDefinition } from './commands/compact.definition.js';
import { completionCommandDefinition } from './commands/completion.definition.js';
import { serverCommandDefinition } from './commands/server.definition.js';
import { updateCommandDefinition } from './commands/update.definition.js';
import type { Command, SubCommand } from './types.js';

const COMMANDS_SCHEMA: Command[] = [
  updateCommandDefinition,
  completionCommandDefinition,
  compactCommandDefinition,
  serverCommandDefinition
];

export function getAllCommands(): Command[] {
  return COMMANDS_SCHEMA;
}

export function getCommand(name: string): Command | undefined {
  return COMMANDS_SCHEMA.find((cmd) => cmd.name === name || cmd.aliases?.includes(name));
}

export function getSubCommand(commandName: string, subCommandName: string): SubCommand | undefined {
  const command = getCommand(commandName);
  return command?.subcommands?.find((sub) => sub.name === subCommandName || sub.aliases?.includes(subCommandName));
}
