import { type RefObject, useEffect } from 'react';

export function useScrollPersistence(
  contentRef: RefObject<HTMLDivElement | null>,
  selectedProject?: string,
  sessionId?: string
) {
  const scrollKey = selectedProject && sessionId ? `scroll-${selectedProject}-${sessionId}` : '';

  useEffect(() => {
    if (!scrollKey || !contentRef.current) return;

    const savedScroll = localStorage.getItem(scrollKey);
    if (savedScroll) {
      contentRef.current.scrollTop = Number(savedScroll);
    }

    const handleScroll = () => {
      if (contentRef.current) {
        localStorage.setItem(scrollKey, String(contentRef.current.scrollTop));
      }
    };

    const ref = contentRef.current;
    ref?.addEventListener('scroll', handleScroll);
    return () => ref?.removeEventListener('scroll', handleScroll);
  }, [scrollKey, contentRef]);
}
