import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

export const LOG_FILE = join(os.tmpdir(), 'bcc-server.log');
export const PID_FILE = join(os.tmpdir(), 'bcc-server.pid');

export function savePid(pid: number, port: number) {
  const pidData = JSON.stringify({ pid, port });
  writeFileSync(PID_FILE, pidData, 'utf-8');
}

export function loadPid(): { pid: number; port: number } | null {
  const pidFilePath = PID_FILE;
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

export function removePidFile() {
  const pidFilePath = PID_FILE;
  if (existsSync(pidFilePath)) {
    unlinkSync(pidFilePath);
  }
}

export function isProcessRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
