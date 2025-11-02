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
  const currentImageIndex = images.findIndex((img) => img.index === currentIndex);

  if (!currentImage) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-5 right-9 text-[#f1f1f1] text-[40px] font-bold cursor-pointer z-[10000] hover:text-[#bbb] transition-colors"
        aria-label="Close modal"
      >
        ×
      </button>

      <div
        className="absolute top-5 left-1/2 -translate-x-1/2 text-[#f1f1f1] text-lg font-semibold z-[10000]"
        style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
      >
        {currentImageIndex + 1} / {images.length}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/20 text-white border-0 text-[30px] px-[15px] py-5 cursor-pointer rounded transition-all z-[10000] hover:bg-white/40"
            aria-label="Previous image"
          >
            &#10094;
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/20 text-white border-0 text-[30px] px-[15px] py-5 cursor-pointer rounded transition-all z-[10000] hover:bg-white/40"
            aria-label="Next image"
          >
            &#10095;
          </button>
        </>
      )}

      <img
        src={`data:image/png;base64,${currentImage.data}`}
        alt={`${currentImageIndex + 1}`}
        className="max-w-[80%] max-h-[80%] object-contain select-none"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
