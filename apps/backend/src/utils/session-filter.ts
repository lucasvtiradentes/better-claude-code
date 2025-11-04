const CLAUDE_CODE_SESSION_COMPACTION_ID = 'CLAUDE_CODE_SESSION_COMPACTION_ID';

export function isCompactionSession(lines: string[]): boolean {
  try {
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'user') {
          const messageContent = parsed.message?.content;

          let textContent = '';
          if (typeof messageContent === 'string') {
            textContent = messageContent;
          } else if (Array.isArray(messageContent)) {
            const textPart = messageContent.find((item: any) => item.type === 'text');
            if (textPart?.text) {
              textContent = textPart.text;
            }
          }

          if (textContent && textContent !== 'Warmup' && !textContent.includes('Caveat:')) {
            return textContent.startsWith(CLAUDE_CODE_SESSION_COMPACTION_ID);
          }
        }
      } catch {}
    }

    return false;
  } catch {
    return false;
  }
}
