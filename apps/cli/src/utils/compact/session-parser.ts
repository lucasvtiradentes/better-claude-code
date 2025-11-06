import { readFileSync, writeFileSync } from 'fs';

import { getGitRepoRoot } from '../git.js';

interface MessageBlock {
  type: 'user' | 'assistant';
  content: string;
}

export async function parseSessionToMarkdown(sessionFile: string, outputFile: string) {
  let repoRoot: string;
  try {
    repoRoot = await getGitRepoRoot();
  } catch {
    repoRoot = process.cwd();
  }

  const content = readFileSync(sessionFile, 'utf-8');
  const lines = content.trim().split('\n');

  const messages: MessageBlock[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'user' || parsed.type === 'assistant') {
        const messageContent = parsed.message?.content;

        if (!messageContent) continue;

        if (parsed.type === 'user') {
          if (typeof messageContent === 'string') {
            if (messageContent === 'Warmup' || messageContent.includes('Caveat: The messages below were generated')) {
              continue;
            }
            messages.push({ type: 'user', content: messageContent });
          } else if (Array.isArray(messageContent)) {
            const hasToolResult = messageContent.some((item) => item.type === 'tool_result');
            if (!hasToolResult) {
              const textContent = messageContent
                .filter((item) => item.type === 'text')
                .map((item) => item.text)
                .join('\n');
              if (textContent) {
                messages.push({ type: 'user', content: textContent });
              }
            }
          }
        } else {
          if (Array.isArray(messageContent)) {
            const parts: string[] = [];
            for (const item of messageContent) {
              if (item.type === 'text') {
                parts.push(item.text);
              } else if (item.type === 'tool_use') {
                const toolName = item.name || 'Unknown';
                const toolInput = item.input || {};
                if (toolName === 'Bash') {
                  parts.push(`[tool: Bash] ${toolInput.command || toolInput.description || ''}`);
                } else if (toolName === 'Read') {
                  parts.push(`[tool: Read] ${toolInput.file_path || ''}`);
                } else if (toolName === 'Edit') {
                  parts.push(`[tool: Edit] ${toolInput.file_path || ''}`);
                } else if (toolName === 'Write') {
                  parts.push(`[tool: Write] ${toolInput.file_path || ''}`);
                } else if (toolName === 'Grep') {
                  parts.push(`[tool: Grep] ${toolInput.pattern || ''}`);
                } else if (toolName === 'Glob') {
                  parts.push(`[tool: Glob] ${toolInput.pattern || ''}`);
                } else {
                  parts.push(`[tool: ${toolName}]`);
                }
              }
            }
            if (parts.length > 0) {
              messages.push({ type: 'assistant', content: parts.join('\n') });
            }
          } else if (typeof messageContent === 'string') {
            messages.push({ type: 'assistant', content: messageContent });
          }
        }
      }
    } catch {}
  }

  let markdown = '';

  if (messages.length > 0) {
    const firstUser = messages.find((m) => m.type === 'user');
    const firstAssistant = messages.find((m) => m.type === 'assistant');

    if (firstUser) {
      markdown += '<user_message type="initial">\n';
      markdown += `${firstUser.content}\n`;
      markdown += '</user_message>\n\n';
    }

    if (firstAssistant) {
      markdown += '<cc_message type="initial">\n';
      markdown += `${firstAssistant.content}\n`;
      markdown += '</cc_message>\n\n';
      markdown += '----\n\n';
    }

    const middleMessages = messages.slice(2, -2);
    if (middleMessages.length > 0) {
      for (const msg of middleMessages) {
        if (msg.type === 'user') {
          markdown += `<user_message>${msg.content}</user_message>\n\n`;
        } else {
          markdown += `<cc_message>${msg.content}</cc_message>\n\n`;
        }
      }
      markdown += '----\n\n';
    }

    if (messages.length > 2) {
      const lastUser = messages.filter((m) => m.type === 'user').pop();
      const lastAssistant = messages.filter((m) => m.type === 'assistant').pop();

      if (lastUser && lastUser !== firstUser) {
        markdown += '<user_message type="final">\n';
        markdown += `${lastUser.content}\n`;
        markdown += '</user_message>\n\n';
      }

      if (lastAssistant && lastAssistant !== firstAssistant) {
        markdown += '<cc_message type="final">\n';
        markdown += `${lastAssistant.content}\n`;
        markdown += '</cc_message>\n\n';
      }
    }

    markdown += '----\n\n';
    markdown += 'related info:\n';

    const filePattern = /(?:\/[a-zA-Z0-9/_.-]+\.(ts|js|tsx|jsx|json|md|sh|yaml|yml|env|sql|txt))/g;
    const fileMatches = content.match(filePattern);
    const uniqueFiles = fileMatches
      ? [...new Set(fileMatches)]
          .filter((f) => !f.includes('@') && !f.includes('\\'))
          .map((f) => (f.startsWith(repoRoot) ? f : `${repoRoot}${f}`))
      : [];

    const urlPattern = /https?:\/\/[a-zA-Z0-9./?=_%:-]*/g;
    const urlMatches = content.match(urlPattern);
    const uniqueUrls = urlMatches ? [...new Set(urlMatches)] : [];

    if (uniqueFiles.length > 0) {
      markdown += ' - files:\n';
      for (const file of uniqueFiles) {
        markdown += `   - ${file}\n`;
      }
    }

    if (uniqueUrls.length > 0) {
      markdown += ' - urls:\n';
      for (const url of uniqueUrls) {
        markdown += `   - ${url}\n`;
      }
    }
  }

  writeFileSync(outputFile, markdown, 'utf-8');
}
