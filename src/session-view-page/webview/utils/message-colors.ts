export const MESSAGE_COLORS = {
  EXISTING_IMAGE_TAG: 'text-chart-4 bg-chart-4/20 border-chart-4/30',
  NOT_FOUND_IMAGE_TAG: 'text-chart-4/50 bg-chart-4/10 border-chart-4/20 line-through',
  EXISTING_FILE_OR_FOLDER: 'text-blue-500 font-semibold',
  NOT_FOUND_FILE_OR_FOLDER: 'text-blue-500/50 font-semibold line-through',
  COMMAND: 'text-green-500 font-semibold',
  ULTRATHINK: 'rainbow-text font-semibold',
  URL: 'text-purple-500 font-semibold',
  FLAG: 'text-red-500 font-semibold',
  TOKEN_HIGH: 'text-red-500',
  TOKEN_MEDIUM: 'text-primary',
  TOKEN_LOW: 'text-muted-foreground',
  LABEL_ACTIVE: 'text-primary',
  PATTERN: 'text-primary font-semibold',
  SEARCH_HIGHLIGHT: 'bg-primary/30 font-semibold'
} as const;
