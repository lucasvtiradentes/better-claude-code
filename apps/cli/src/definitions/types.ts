export interface CommandArgument {
  name: string;
  description: string;
  type: 'string' | 'number';
  required?: boolean;
}

export interface CommandFlag {
  name: string;
  alias?: string;
  description: string;
  type: 'string' | 'boolean' | 'number';
  required?: boolean;
  choices?: string[];
}

export interface SubCommand {
  name: string;
  aliases?: string[];
  description: string;
  arguments?: CommandArgument[];
  flags?: CommandFlag[];
  examples?: string[];
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  subcommands?: SubCommand[];
  flags?: CommandFlag[];
  examples?: string[];
}

export const CommandNames = {
  HELLO: 'hello',
  UPDATE: 'update',
  COMPLETION: 'completion',
  COMPACT: 'compact',
  SERVER: 'server'
} as const;

export const SubCommandNames = {
  COMPLETION_INSTALL: 'install'
} as const;
