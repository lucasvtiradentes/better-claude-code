import { readFileSync } from 'fs';

export function isCompactionSession(sessionFilePath: string): boolean {
  try {
    const content = readFileSync(sessionFilePath, 'utf-8');
    const lines = content.trim().split('\n');

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'user') {
          const messageContent = parsed.message?.content;

          let textContent = '';
          if (typeof messageContent === 'string') {
            textContent = messageContent;
          } else if (Array.isArray(messageContent)) {
            const textPart = messageContent.find((item) => item.type === 'text');
            if (textPart?.text) {
              textContent = textPart.text;
            }
          }

          if (textContent && textContent !== 'Warmup' && !textContent.includes('Caveat:')) {
            return textContent.startsWith('CLAUDE_CODE_SESSION_COMPACTION_ID');
          }
        }
      } catch {}
    }

    return false;
  } catch {
    return false;
  }
}
