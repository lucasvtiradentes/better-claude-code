import { MessageSource } from '@/lib/shared';

export function isUserMessage(message: string) {
  return message === MessageSource.USER;
}

export function isCCMessage(message: string) {
  return message === MessageSource.CC;
}
