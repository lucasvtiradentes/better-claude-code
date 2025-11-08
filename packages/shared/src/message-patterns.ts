export const MESSAGE_PATTERNS = {
  FILE_OR_FOLDER_AT: /(^|\s)@([a-zA-Z.][\w\-.]*(?:\/[\w\-./]+)*(?:#L\d+(?:-\d+)?)?)/g,
  FILE_OR_FOLDER_SLASH: /\/([\w\-./]+)/g,
  TOOL_WITH_PATH: /\[Tool: ([^\]]+)\] (\/[^\s<>,]+)/g,
  PATH_PROPERTY: /path: (\/[^\s<>,]+)/g,
  PATTERN_PROPERTY: /pattern: "([^"]+)"/g,
  TOOL_WITH_QUOTE: /\[Tool: ([^\]]+)\] "([^"]+)"/g,
  IMAGE_TAG: /\[Image #(\d+)\]/g,
  ULTRATHINK: /ultrathink/gi,
  COMMAND_FORMAT: /<command-name>\/?([^<]+)<\/command-name>/,
  COMMAND_ARGS: /<command-args>([^<]+)<\/command-args>/,
  COMMAND_WORDS:
    /^(add|update|fix|refactor|improve|create|delete|remove|modify|change|implement|build|test|debug|optimize|enhance|cleanup|migrate|upgrade|downgrade|install|uninstall|configure|setup|deploy|publish|release|merge|rebase|cherry-pick|squash|revert)\s+/i,
  SLASH_COMMAND: /^\/[\w-]+/
} as const;

export function extractPathsFromText(text: string): string[] {
  const paths = new Set<string>();

  const slashMatches = text.match(MESSAGE_PATTERNS.FILE_OR_FOLDER_SLASH);
  if (slashMatches) {
    for (const match of slashMatches) {
      paths.add(match);
    }
  }

  const atRegex = new RegExp(MESSAGE_PATTERNS.FILE_OR_FOLDER_AT.source, 'g');
  const atMatches = text.matchAll(atRegex);
  for (const match of atMatches) {
    const cleanMatch = match[0].trim().substring(1);
    paths.add(cleanMatch);
  }

  return Array.from(paths);
}
