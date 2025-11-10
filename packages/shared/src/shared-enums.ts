export enum FolderEntry {
  FILE = 'file',
  DIRECTORY = 'directory'
}

export enum ProjectAction {
  OPEN_FOLDER = 'openFolder',
  OPEN_EDITOR = 'openCodeEditor',
  OPEN_TERMINAL = 'openTerminal'
}

export enum MessageSource {
  USER = 'user',
  CC = 'assistant'
}

export enum PromptFile {
  SESSION_COMPACTION = 'session-compaction.prompt.md'
}
