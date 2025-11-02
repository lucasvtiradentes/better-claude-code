import { execAsync } from './exec.js';

export async function getGitRepoRoot(): Promise<string> {
  const { stdout } = await execAsync('git rev-parse --show-toplevel');
  return stdout.trim();
}

export async function isInGitRepo(): Promise<boolean> {
  try {
    await execAsync('git rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}
