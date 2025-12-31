import { MessageSource } from '@/lib/shared';

export function isUserMessage(message: string) {
  return message === MessageSource.USER;
}
