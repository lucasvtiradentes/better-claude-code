export const MESSAGE_PATTERNS = {
  FILE_OR_FOLDER_AT: /(^|\s)@([a-zA-Z.][\w\-.]*(?:\/[\w\-./]+)*(?:#L\d+(?:-\d+)?)?)/g,
  FILE_OR_FOLDER_SLASH: /\/([\w\-./]+)/g,
  TOOL_WITH_PATH: /\[Tool: ([^\]]+)\] (\/[^\s<>,]+)/g,
  PATH_PROPERTY: /path: (\/[^\s<>,]+)/g,
  PATTERN_PROPERTY: /pattern: "([^"]+)"/g,
  TOOL_WITH_QUOTE: /\[Tool: ([^\]]+)\] "([^"]+)"/g,
  IMAGE_TAG: /\[Image #(\d+)\]/g,
  ULTRATHINK: /ultrathink/gi,
  URL: /https?:\/\/[^\s<>,]+/g,
  FLAG: /(^|\s)(--[a-z]{2,})/g,
  COMMAND_FORMAT: /<command-name>\/?([^<]+)<\/command-name>/,
  COMMAND_ARGS: /<command-args>([^<]+)<\/command-args>/,
  COMMAND_WORDS:
    /^(add|update|fix|refactor|improve|create|delete|remove|modify|change|implement|build|test|debug|optimize|enhance|cleanup|migrate|upgrade|downgrade|install|uninstall|configure|setup|deploy|publish|release|merge|rebase|cherry-pick|squash|revert)\s+/i,
  SLASH_COMMAND: /^\/[\w-]+/
} as const;
