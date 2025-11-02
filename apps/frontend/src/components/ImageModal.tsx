import { useEffect } from 'react';

type ImageModalProps = {
  images: Array<{ index: number; data: string }>;
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export const ImageModal = ({ images, currentIndex, onClose, onNext, onPrev }: ImageModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  const currentImage = images.find((img) => img.index === currentIndex);

  if (!currentImage) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 text-white text-4xl hover:text-text-accent transition-colors"
      >
        ×
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-4 text-white text-4xl hover:text-text-accent transition-colors"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 text-white text-4xl hover:text-text-accent transition-colors"
          >
            ›
          </button>
        </>
      )}

      <div className="max-w-5xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <img
          src={`data:image/png;base64,${currentImage.data}`}
          alt={`Image ${currentIndex}`}
          className="w-full h-auto"
        />
      </div>

      <div className="absolute bottom-4 text-white text-sm">
        Image {currentIndex} of {images[images.length - 1].index}
      </div>
    </div>
  );
};
