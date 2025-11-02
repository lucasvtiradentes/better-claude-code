export enum MessageCountMode {
  TURN = 'turn',
  EVENT = 'event'
}

export interface BccConfig {
  completion_installed?: boolean;
  messages_count_mode?: MessageCountMode;
}
