import { join } from 'node:path';
import { ClaudeHelper, compactSession, parseSessionToMarkdown } from '@better-claude-code/node-utils';
import { logger } from '../utils/logger.js';

const PROMPT_TEMPLATE = `You are analyzing a parsed Claude Code session to extract important information.

Read the file: ___FILE_TO_COMPACT___

Based on the content, generate a structured markdown summary with these sections:

# Session Summary

## Overview
Brief 2-3 sentence description of what the conversation was about

## Conversation Timeline
Extract the key conversation flow showing what user requested and what CC did. Focus on major requests/implementations, not every single message:
- User: requested to fix bug on login page
- CC: Fixed bug, issue was incorrect validation on email field
- User: asked to add dark mode
- CC: Implemented dark mode with theme toggle in header
- User: requested performance optimization
- CC: Added memoization and reduced re-renders by 60%

## Important Files and Folders
List absolute paths to files/folders that are critical to understand this work:
- /absolute/path/to/file1.ts
- /absolute/path/to/folder/

## Todo List
Extract what was accomplished and what remains:
- [x] Completed task 1
- [x] Completed task 2
- [ ] Pending task 1
- [ ] Pending task 2

## Key Learnings
Document discoveries, insights, or important findings from this session:
- Discovered that X approach works better than Y for performance
- Found that Z library has compatibility issues
- Learned important pattern or technique

## Notes
Document complexities, non-trivial issues, architectural decisions, blockers:
- Complex issue: explanation
- Technical consideration: important decision
- Blocker: unresolved dependency

## Commands to Reproduce
List key commands that were executed (if relevant to reproduce the work):
1. \`npm install package-name\`
2. \`npm run build\`
3. \`npm test\`

## External Resources
List any external resources referenced (docs, Stack Overflow, GitHub issues):
- https://docs.example.com/api
- Stack Overflow: https://stackoverflow.com/questions/123

## Key Messages

### Initial Messages

<user_message>
[paste first user message]
</user_message>

<cc_message>
[paste first CC response - truncate if very long]
</cc_message>

### Final Messages

Extract and paste the LAST 3 exchanges between user and CC using this exact format:

----

<user_message>
[message content]
</user_message>

<cc_message>
[message content]
</cc_message>

----

<user_message>
[message content]
</user_message>

<cc_message>
[message content]
</cc_message>

----

<user_message type="final">
[message content]
</user_message>

<cc_message type="final">
[message content]
</cc_message>

IMPORTANT:
1. Use the Write tool to save the complete markdown summary to: ___OUTPUT_FILE_PATH___
2. Do NOT output the summary as text - only use Write tool
3. After saving, confirm with: "✓ Summary saved to: ___OUTPUT_FILE_PATH___"`;

export class CompactService {
  async compactSession(sessionId: string, workspacePath: string): Promise<string> {
    try {
      logger.info(`Compacting session ${sessionId} for workspace ${workspacePath}`);

      const shortId = sessionId.slice(0, 12);
      const normalizedPath = ClaudeHelper.normalizePathForClaudeProjects(workspacePath);
      const sessionFile = ClaudeHelper.getSessionPath(normalizedPath, sessionId);
      const parsedFile = join(workspacePath, `cc-session-parsed-${shortId}.md`);
      const summaryFile = join(workspacePath, `cc-session-summary-${shortId}.md`);

      logger.info('Step 1/2: Parsing session to markdown...');
      await parseSessionToMarkdown(sessionFile, parsedFile, workspacePath);
      logger.info(`Parsed to: ${parsedFile}`);

      logger.info('Step 2/2: Compacting via Claude Code...');
      await compactSession(parsedFile, summaryFile, PROMPT_TEMPLATE, workspacePath);
      logger.info(`Summary saved to: ${summaryFile}`);

      return summaryFile;
    } catch (error) {
      logger.error('Failed to compact session', error as Error);
      throw error;
    }
  }
}
