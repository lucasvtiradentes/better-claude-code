export enum MessageCountMode {
  TURN = 'turn',
  EVENT = 'event'
}

export enum TitleMessage {
  FIRST_USER_MESSAGE = 'first_user_message',
  LAST_CC_MESSAGE = 'last_cc_message'
}

export interface BccConfig {
  completion_installed?: boolean;
  messages_count_mode?: MessageCountMode;
}
