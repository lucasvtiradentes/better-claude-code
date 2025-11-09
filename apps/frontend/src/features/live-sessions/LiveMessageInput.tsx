import { Loader2, Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type LiveMessageInputProps = {
  onSend: (message: string, imagePaths?: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  isStreaming?: boolean;
};

export const LiveMessageInput = ({
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
  isStreaming = false
}: LiveMessageInputProps) => {
  const [message, setMessage] = useState('');
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<Record<string, string>>({});

  const handleSend = () => {
    if ((message.trim() || imagePaths.length > 0) && !disabled) {
      let finalMessage = message.trim();

      if (imagePaths.length > 0) {
        for (let i = 0; i < imagePaths.length; i++) {
          const path = imagePaths[i];
          finalMessage = finalMessage.replace(path, `[Image #${i + 1}]`);
        }

        const hasImageRef = /\[Image #\d+\]/.test(finalMessage);
        if (!hasImageRef) {
          const imageRefs = imagePaths.map((_, i) => `[Image #${i + 1}]`).join(' ');
          finalMessage = finalMessage ? `${finalMessage} ${imageRefs}` : imageRefs;
        }
      }

      onSend(finalMessage, imagePaths.length > 0 ? imagePaths : undefined);
      setMessage('');
      setImagePaths([]);
      setImagePreview({});
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith('image/'));

    if (imageItems.length === 0) return;

    e.preventDefault();

    for (const item of imageItems) {
      const file = item.getAsFile();
      if (!file) continue;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const data = base64.split(',')[1];

        try {
          const response = await fetch('/api/files/clipboard-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data, mediaType: file.type })
          });

          if (!response.ok) throw new Error('Failed to save image');

          const result = await response.json();
          const imagePath = result.path;

          setImagePaths((prev) => {
            const newPaths = [...prev, imagePath];
            const imageRef = `[Image #${newPaths.length}]`;
            setMessage((prevMessage) => (prevMessage ? `${prevMessage} ${imageRef}` : imageRef));
            return newPaths;
          });
          setImagePreview((prev) => ({ ...prev, [imagePath]: base64 }));
        } catch (error) {
          console.error('Failed to save clipboard image:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const detectImagePaths = async () => {
      const imagePathRegex = /(?:^|\s)(\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|bmp|svg))(?:\s|$)/gi;
      const matches = [...message.matchAll(imagePathRegex)];

      for (const match of matches) {
        const path = match[1];
        if (!imagePaths.includes(path) && !imagePreview[path]) {
          try {
            const response = await fetch(`/api/files/image?path=${encodeURIComponent(path)}`);
            if (response.ok) {
              const result = await response.json();
              const newIndex = imagePaths.length + 1;

              setImagePaths((prev) => [...prev, path]);
              setImagePreview((prev) => ({ ...prev, [path]: `data:${result.mediaType};base64,${result.data}` }));

              setMessage((prev) => prev.replace(path, `[Image #${newIndex}]`));
            }
          } catch (error) {
            console.error('Failed to load image:', error);
          }
        }
      }
    };

    if (message) {
      detectImagePaths();
    }
  }, [message, imagePaths, imagePreview]);

  const handleRemoveImage = (path: string) => {
    setImagePaths((prev) => prev.filter((p) => p !== path));
    setImagePreview((prev) => {
      const updated = { ...prev };
      delete updated[path];
      return updated;
    });
  };

  return (
    <div className="border-t bg-card p-4">
      <div className="space-y-2">
        {imagePaths.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imagePaths.map((path, index) => (
              <div key={path} className="relative group">
                <img
                  src={imagePreview[path]}
                  alt={`Image ${index + 1}`}
                  className="h-20 w-20 rounded border object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveImage(path)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[60px] max-h-[200px] resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && imagePaths.length === 0)}
            size="icon"
            className="shrink-0"
          >
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
