import { platform } from 'node:os';

export function isSupportedOS() {
  const currentPlatform = platform();
  return currentPlatform === 'darwin' || currentPlatform === 'linux';
}

export function validateOS() {
  if (!isSupportedOS()) {
    throw new Error('This command only works on macOS and Linux');
  }
}

export function getOSName() {
  const currentPlatform = platform();
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
