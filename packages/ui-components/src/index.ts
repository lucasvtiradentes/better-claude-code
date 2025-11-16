export { CodeBlock } from './components/CodeBlock';
export { IconWithBadge } from './components/IconWithBadge';
export { SessionBadges } from './components/SessionBadges';
export { SessionCard } from './components/SessionCard';
export { SessionMessage } from './components/SessionMessage';

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from './components/ui/dropdown-menu';

export type { Theme } from './hooks/use-theme';
export { useTheme } from './hooks/use-theme';

export { cn } from './lib/utils';

export type {
  PathValidation,
  SessionCardData,
  SessionImage,
  SessionLabel,
  SessionMessage as SessionMessageType
} from './types/session';

export { MESSAGE_COLORS } from './utils/message-colors';
export {
  type CodeBlock as CodeBlockType,
  FormatterSource,
  formatMessageContent
} from './utils/message-formatter';
export {
  detectCommand,
  formatCommand,
  formatFileOrFolderMention,
  formatFlag,
  formatImageTag,
  formatPathProperty,
  formatPattern,
  formatSearchHighlight,
  formatToolPath,
  formatToolWithQuote,
  formatUltrathink,
  formatUrl,
  getCommandInTitleColor,
  getFileInTitleColor,
  getFlagColor,
  getImageColor,
  getLabelActiveColor,
  getTokenColor,
  getUltrathinkColor,
  getUrlColor,
  parseTitle
} from './utils/message-patterns';
export { isCCMessage, isUserMessage } from './utils/message-utils';
