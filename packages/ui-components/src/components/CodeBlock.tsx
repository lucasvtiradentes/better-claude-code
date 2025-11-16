import { Check, Copy } from 'lucide-react';
import { memo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../hooks/use-theme';

type CodeBlockProps = {
  language?: string;
  code: string;
};

export const CodeBlock = memo(({ language, code }: CodeBlockProps) => {
  const { theme } = useTheme();
  const style = theme === 'dark' ? oneDark : oneLight;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-lg border border-border overflow-hidden relative group">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-muted/80 hover:bg-muted hover:scale-110 active:scale-95 transition-all z-10"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check size={16} className="text-green-500 animate-in fade-in zoom-in duration-200" />
        ) : (
          <Copy size={16} className="text-muted-foreground hover:text-foreground transition-colors" />
        )}
      </button>
      <SyntaxHighlighter
        language={language || 'text'}
        style={style}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.875rem',
          background: 'transparent'
        }}
        codeTagProps={{
          style: {
            fontFamily: 'monospace'
          }
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';
