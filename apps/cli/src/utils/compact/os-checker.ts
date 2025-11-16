import { USER_PLATFORM } from '@better-claude-code/node-utils';

export function isSupportedOS() {
  const currentPlatform = USER_PLATFORM;
  return currentPlatform === 'darwin' || currentPlatform === 'linux';
}

export function validateOS() {
  if (!isSupportedOS()) {
    throw new Error('This command only works on macOS and Linux');
  }
}

export function getOSName() {
  const currentPlatform = USER_PLATFORM;
  switch (currentPlatform) {
    case 'darwin':
      return 'macOS';
    case 'linux':
      return 'Linux';
    case 'win32':
      return 'Windows';
    default:
      return currentPlatform;
  }
}
