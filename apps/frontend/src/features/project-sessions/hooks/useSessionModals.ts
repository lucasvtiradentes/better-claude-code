import { useEffect, useState } from 'react';
import type { GetApiSessionsProjectNameSessionId200ImagesItem } from '@/api';

export function useSessionModals(
  imageIndex?: number,
  urlFolderPath?: string,
  urlFilePath?: string,
  images?: GetApiSessionsProjectNameSessionId200ImagesItem[]
) {
  const [imageModalIndex, setImageModalIndex] = useState<number | null>(null);
  const [fileModalPath, setFileModalPath] = useState<string | null>(null);
  const [folderModalPath, setFolderModalPath] = useState<string | null>(null);

  useEffect(() => {
    if (imageIndex !== undefined && images) {
      if (imageIndex >= 0 && imageIndex < images.length) {
        setImageModalIndex(imageIndex);
      }
    }
  }, [imageIndex, images]);

  useEffect(() => {
    if (urlFolderPath) {
      setFolderModalPath(urlFolderPath);
    }
    if (urlFilePath) {
      setFileModalPath(urlFilePath);
    }
  }, [urlFolderPath, urlFilePath]);

  return {
    imageModalIndex,
    setImageModalIndex,
    fileModalPath,
    setFileModalPath,
    folderModalPath,
    setFolderModalPath
  };
}
