import { ImagePlus, Loader2, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type LiveMessageInputProps = {
  onSend: (message: string, imagePaths?: string[]) => void;
  disabled?: boolean;
  placeholder: string;
  isStreaming?: boolean;
};

export const SessionMessageInput = ({
  onSend,
  placeholder,
  disabled = false,
  isStreaming = false
}: LiveMessageInputProps) => {
  const [message, setMessage] = useState('');
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: none
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '60px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 60), 200)}px`;
    }
  }, [message]);

  const handleRemoveImage = (path: string) => {
    setImagePaths((prev) => prev.filter((p) => p !== path));
    setImagePreview((prev) => {
      const updated = { ...prev };
      delete updated[path];
      return updated;
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

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
          console.error('Failed to save image:', error);
        }
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
                  alt={`Img ${index + 1}`}
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
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            className="resize-none overflow-y-auto"
            style={{ height: '60px' }}
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSend}
              disabled={disabled || (!message.trim() && imagePaths.length === 0)}
              size="icon"
              className="shrink-0"
            >
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              size="icon"
              variant="outline"
              className="shrink-0"
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
