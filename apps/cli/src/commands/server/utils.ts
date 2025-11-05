import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

const PID_FILE = join(os.tmpdir(), 'bcc-server.pid');

function getPidFilePath(): string {
  return PID_FILE;
}

export function savePid(pid: number, port: number): void {
  const pidData = JSON.stringify({ pid, port });
  writeFileSync(getPidFilePath(), pidData, 'utf-8');
}

export function loadPid(): { pid: number; port: number } | null {
  const pidFilePath = getPidFilePath();
  if (!existsSync(pidFilePath)) {
    return null;
  }

  try {
    const pidData = readFileSync(pidFilePath, 'utf-8');
    return JSON.parse(pidData);
  } catch {
    return null;
  }
}

export function removePidFile(): void {
  const pidFilePath = getPidFilePath();
  if (existsSync(pidFilePath)) {
    unlinkSync(pidFilePath);
  }
}

export function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
