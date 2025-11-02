interface SessionCompactionPromptParams {
  parsedFileName: string;
  outputFilePath: string;
  cleanupId: string;
}

export function buildSessionCompactionPrompt(params: SessionCompactionPromptParams): string {
  return `CLAUDE_CODE_SESSION_COMPACTION_ID: ${params.cleanupId}

You are analyzing a parsed Claude Code session to extract important information.

Read the file: @${params.parsedFileName}

Based on the content, generate a structured markdown summary with these sections:

# Session Summary

## Overview
Brief 2-3 sentence description of what the conversation was about

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

## Notes
Document complexities, non-trivial issues, architectural decisions, blockers:
- Complex issue: explanation
- Technical consideration: important decision
- Blocker: unresolved dependency

## Initial and Final Messages

### Initial Request
\`\`\`
[paste first user message]
\`\`\`

### Initial Response
\`\`\`
[paste first CC response - truncate if very long]
\`\`\`

### Final Request
\`\`\`
[paste last user message]
\`\`\`

### Final Response
\`\`\`
[paste last CC response - truncate if very long]
\`\`\`

IMPORTANT:
1. Use the Write tool to save the complete markdown summary to: ${params.outputFilePath}
2. Do NOT output the summary as text - only use Write tool
3. After saving, confirm with: "✓ Summary saved to: ${params.outputFilePath}"`;
}
