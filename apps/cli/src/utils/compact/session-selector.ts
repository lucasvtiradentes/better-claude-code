import * as readline from 'node:readline';

import { colors } from '../colors.js';
import type { SessionInfo } from './session-finder.js';

function formatTimeAgo(timestampMs: number) {
  const now = Date.now();
  const diffSeconds = Math.floor((now - timestampMs) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

export function displaySessions(sessions: SessionInfo[]) {
  const maxFiles = Math.max(...sessions.map((s) => s.filesOrFoldersCount || 0));
  const maxImages = Math.max(...sessions.map((s) => s.imageCount || 0));
  const maxToken = Math.max(...sessions.map((s) => s.tokenPercentage || 0));

  const filesPadding = Math.max(maxFiles.toString().length, 1);
  const imagesPadding = Math.max(maxImages.toString().length, 1);
  const tokenPadding = Math.max(maxToken.toString().length, 1);

  console.log('');
  sessions.forEach((session, index) => {
    const timeAgo = formatTimeAgo(session.timestamp);

    const fileCount = session.filesOrFoldersCount || 0;
    const imageCount = session.imageCount || 0;

    const filesDisplay = `${fileCount.toString().padStart(filesPadding)} files`;
    const imagesDisplay = `${imageCount.toString().padStart(imagesPadding)} images`;
    const attachmentsDisplay = ` · ${filesDisplay} · ${imagesDisplay}`;

    let tokenDisplay = '';
    if (session.tokenPercentage !== undefined) {
      const pct = session.tokenPercentage;
      const pctStr = `${pct}%`.padStart(tokenPadding + 1);
      if (pct >= 90) {
        tokenDisplay = ` · ${colors.magenta(pctStr)}`;
      } else if (pct >= 80) {
        tokenDisplay = ` · ${colors.yellow(pctStr)}`;
      } else {
        tokenDisplay = ` · ${pctStr}`;
      }
    }

    const line = `${colors.dim(`${index + 1})`.padStart(3))} ${colors.cyan(session.shortId)} · ${timeAgo.padStart(8)}${attachmentsDisplay}${tokenDisplay} · ${session.title}`;
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

export async function confirmCompaction() {
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
