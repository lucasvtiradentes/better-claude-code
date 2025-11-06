import { ClaudeHelper, generateUuid } from '@better-claude-code/node-utils';
import { CLAUDE_CODE_SESSION_COMPACTION_ID } from '@better-claude-code/shared';
import { existsSync, readdirSync, readFileSync, unlinkSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { executePromptNonInteractively } from '../claude.js';
import { getGitRepoRoot } from '../git.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function compactSession(parsedFile: string, outputFile: string) {
  const cleanupUuid = generateUuid();

  const promptTemplatePath = join(__dirname, '../../prompts/session-compation.prompt.md');
  let promptTemplate = readFileSync(promptTemplatePath, 'utf-8');

  promptTemplate = `${CLAUDE_CODE_SESSION_COMPACTION_ID}: ${cleanupUuid}\n\n${promptTemplate}`;
  promptTemplate = promptTemplate.replace('___FILE_TO_COMPACT___', `@${basename(parsedFile)}`);
  promptTemplate = promptTemplate.replaceAll('___OUTPUT_FILE_PATH___', outputFile);

  const prompt = promptTemplate;

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

  const normalized = ClaudeHelper.normalizePathForClaudeProjects(currentDir);
  const projectDir = join(ClaudeHelper.getProjectsDir(), normalized);

  if (!existsSync(projectDir)) {
    return;
  }

  const compactionSessions = readdirSync(projectDir)
    .filter((file) => file.endsWith('.jsonl'))
    .map((file) => join(projectDir, file))
    .filter((file) => {
      try {
        const content = readFileSync(file, 'utf-8');
        return content.includes(`${CLAUDE_CODE_SESSION_COMPACTION_ID}: ${cleanupUuid}`);
      } catch {
        return false;
      }
    });

  for (const session of compactionSessions) {
    unlinkSync(session);
  }
}
