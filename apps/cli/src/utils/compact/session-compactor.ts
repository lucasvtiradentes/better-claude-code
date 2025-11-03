import { randomUUID } from 'crypto';
import { existsSync, readdirSync, readFileSync, unlinkSync } from 'fs';
import { homedir } from 'os';
import { basename, join } from 'path';

import { buildSessionCompactionPrompt } from '../../prompts/session-compaction.prompt.js';
import { executePromptNonInteractively } from '../claude.js';
import { getGitRepoRoot } from '../git.js';

export async function compactSession(parsedFile: string, outputFile: string): Promise<void> {
  const cleanupUuid = randomUUID();

  const prompt = buildSessionCompactionPrompt({
    parsedFileName: basename(parsedFile),
    outputFilePath: outputFile,
    cleanupId: cleanupUuid
  });

  await executePromptNonInteractively(prompt);

  if (!existsSync(outputFile)) {
    throw new Error(`Summary file was not created at ${outputFile}`);
  }

  let currentDir: string;
  try {
    currentDir = await getGitRepoRoot();
  } catch {
    currentDir = process.cwd();
  }

  const claudeDir = join(homedir(), '.claude');
  const projectDir = join(claudeDir, 'projects', currentDir.replace(/\/_/g, '--').replace(/\//g, '-'));

  if (!existsSync(projectDir)) {
    return;
  }

  const compactionSessions = readdirSync(projectDir)
    .filter((file) => file.endsWith('.jsonl'))
    .map((file) => join(projectDir, file))
    .filter((file) => {
      try {
        const content = readFileSync(file, 'utf-8');
        return content.includes(`CLAUDE_CODE_SESSION_COMPACTION_ID: ${cleanupUuid}`);
      } catch {
        return false;
      }
    });

  for (const session of compactionSessions) {
    unlinkSync(session);
  }
}
