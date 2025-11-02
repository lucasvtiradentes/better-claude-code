import * as readline from 'readline';

import { colors } from '../colors.js';
import type { SessionInfo } from './session-finder.js';

function formatTimeAgo(timestampMs: number): string {
  const now = Date.now();
  const diffSeconds = Math.floor((now - timestampMs) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

export function displaySessions(sessions: SessionInfo[]): void {
  console.log('');
  sessions.forEach((session, index) => {
    const timeAgo = formatTimeAgo(session.timestamp);

    let tokenDisplay = '';
    if (session.tokenPercentage !== undefined) {
      const pct = session.tokenPercentage;
      if (pct >= 90) {
        tokenDisplay = ` · ${colors.magenta(`${pct}%`)}`;
      } else if (pct >= 80) {
        tokenDisplay = ` · ${colors.yellow(`${pct}%`)}`;
      } else {
        tokenDisplay = ` · ${pct}%`;
      }
    }

    const line = `${colors.dim(`${index + 1})`.padStart(3))} ${colors.cyan(session.shortId)} · ${timeAgo.padStart(8)} · ${session.userCount.toString().padStart(3)} you · ${session.assistantCount.toString().padStart(3)} cc${tokenDisplay} · ${session.title}`;
    console.log(line);
  });
  console.log('');
}

export async function selectSession(sessions: SessionInfo[]): Promise<SessionInfo | null> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Select session number (or press Enter to exit): ', (answer) => {
      rl.close();

      if (!answer.trim()) {
        resolve(null);
        return;
      }

      const num = parseInt(answer, 10);
      if (Number.isNaN(num) || num < 1 || num > sessions.length) {
        console.log(colors.red(`\nInvalid session number. Please choose between 1 and ${sessions.length}`));
        resolve(null);
        return;
      }

      resolve(sessions[num - 1]);
    });
  });
}

export async function confirmCompaction(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Compact this session? (y/N): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}
