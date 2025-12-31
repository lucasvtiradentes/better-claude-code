import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function findCheckpointedSessions(sessionFiles: string[], sessionsPath: string): Promise<Set<string>> {
  const originalSessionsToHide = new Set<string>();

  const checkPromises = sessionFiles.map(async (file) => {
    const filePath = join(sessionsPath, file);
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());

    const currentSessionId = file.replace('.jsonl', '');
    const referencedSessions = new Set<string>();

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.sessionId && parsed.sessionId !== currentSessionId) {
          referencedSessions.add(parsed.sessionId);
        }
      } catch {}
    }

    return Array.from(referencedSessions);
  });

  const results = await Promise.all(checkPromises);
  results.forEach((sessionIds: string[]) => {
    sessionIds.forEach((sessionId) => {
      originalSessionsToHide.add(sessionId);
    });
  });

  return originalSessionsToHide;
}
