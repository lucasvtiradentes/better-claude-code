import { APP_CLI_NAME } from '@better-claude-code/shared';
import { colors } from '../../utils/colors.js';
import { COMMANDS_SCHEMA } from '../commands.js';
import type { Command, SubCommand } from '../types.js';

function formatFlag(flag: { name: string; description?: string; type?: string; required?: boolean }) {
  const requiredMarker = flag.required ? '*' : '';
  const flagName = `${flag.name}${requiredMarker}`;

  if (flag.name.startsWith('--') || flag.name.startsWith('-')) {
    return `      ${flagName.padEnd(26)} ${flag.description || ''}`;
  }
  return `    ${flagName.padEnd(28)} ${flag.description || ''}`;
}

function formatSubCommand(sub: SubCommand, indent = 4) {
  const spaces = ' '.repeat(indent);

  let commandName = sub.name;
  if (sub.arguments && sub.arguments.length > 0) {
    const argStrings = sub.arguments.map((arg) => (arg.required ? `<${arg.name}>` : `[${arg.name}]`));
    commandName = `${sub.name} ${argStrings.join(' ')}`;
  }

  let output = `${spaces}${commandName.padEnd(27 - indent)} ${sub.description}`;

  if (sub.arguments && sub.arguments.length > 1) {
    for (const arg of sub.arguments) {
      output += `\n${formatFlag({ name: arg.name, description: arg.description, type: arg.type })}`;
    }
  }

  if (sub.flags && sub.flags.length > 0) {
    for (const flag of sub.flags) {
      output += `\n${formatFlag(flag)}`;
    }
  }

  return output;
}

function formatCommand(cmd: Command) {
  if (cmd.subcommands && cmd.subcommands.length > 0) {
    let output = `  ${colors.yellow(cmd.name)}\n`;
    for (const sub of cmd.subcommands) {
      output += `${formatSubCommand(sub)}\n`;
    }
    return output;
  } else {
    return `  ${colors.yellow(cmd.name.padEnd(25))} ${cmd.description}\n`;
  }
}

function generateExamplesSection() {
  const examples: string[] = [];

  for (const cmd of COMMANDS_SCHEMA) {
    if (cmd.examples && cmd.examples.length > 0) {
      examples.push(...cmd.examples);
    }

    if (cmd.subcommands) {
      for (const sub of cmd.subcommands) {
        if (sub.examples && sub.examples.length > 0) {
          examples.push(...sub.examples.slice(0, 1));
        }
      }
    }
  }

  const limitedExamples = examples.slice(0, 12);

  return limitedExamples.map((ex) => `  ${colors.cyan(`$ ${ex}`)}`).join('\n');
}

export function generateHelp() {
  const commandsSection = COMMANDS_SCHEMA.map((cmd) => formatCommand(cmd)).join('\n');
  const examplesSection = generateExamplesSection();

  return `
${colors.bold('USAGE')}
  ${colors.cyan(`$ ${APP_CLI_NAME}`)} ${colors.yellow('<command>')} ${colors.gray('[options]')}

${colors.bold('COMMANDS')}
${commandsSection}
${colors.dim('* = required flag')}

${colors.bold('EXAMPLES')}
${examplesSection}
  `;
}
