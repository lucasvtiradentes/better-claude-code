export const MESSAGE_COLORS = {
  // image
  EXISTING_IMAGE_TAG: 'text-chart-4 bg-chart-4/20 border-chart-4/30 hover:bg-chart-4/30',
  NOT_FOUND_IMAGE_TAG: 'text-chart-4/50 bg-chart-4/10 border-chart-4/20 line-through',

  // mentionated file or folder
  EXISTING_FILE_OR_FOLDER: 'text-blue-500 font-semibold',
  NOT_FOUND_FILE_OR_FOLDER: 'text-blue-500/50 font-semibold line-through',

  // command
  COMMAND: 'text-green-500 font-semibold',

  // ultrathink
  ULTRATHINK: 'bg-gradient-to-r from-destructive via-primary to-chart-4 bg-clip-text text-transparent font-semibold',
  // tokens
  TOKEN_HIGH: 'text-red-500',
  TOKEN_MEDIUM: 'text-primary',
  TOKEN_LOW: 'text-muted-foreground',

  // label
  LABEL_ACTIVE: 'text-primary',

  // other
  PATTERN: 'text-primary font-semibold',
  SEARCH_HIGHLIGHT: 'bg-primary/30 font-semibold'
} as const;
