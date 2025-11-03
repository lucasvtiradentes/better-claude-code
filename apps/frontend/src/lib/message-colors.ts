export const MESSAGE_COLORS = {
  EXISTING_IMAGE_TAG: 'text-chart-4 bg-chart-4/20 border-chart-4/30 hover:bg-chart-4/30',
  NOT_FOUND_IMAGE_TAG: 'text-chart-4/50 bg-chart-4/10 border-chart-4/20 line-through',
  EXISTING_FILE_OR_FOLDER: 'text-primary font-semibold cursor-pointer',
  NOT_FOUND_FILE_OR_FOLDER: 'text-primary/50 font-semibold line-through',
  COMMAND: 'text-chart-2 font-semibold',
  ULTRATHINK: 'bg-gradient-to-r from-destructive via-primary to-chart-4 bg-clip-text text-transparent font-semibold',
  PATTERN: 'text-primary font-semibold',
  SEARCH_HIGHLIGHT: 'bg-primary/30 font-semibold',
  FILE_IN_TITLE: 'text-primary font-semibold',
  COMMAND_IN_TITLE: 'text-chart-2 font-semibold',
  TOKEN_HIGH: 'text-destructive',
  TOKEN_MEDIUM: 'text-primary',
  TOKEN_LOW: 'text-muted-foreground',
  LABEL_ACTIVE: 'text-primary'
} as const;
