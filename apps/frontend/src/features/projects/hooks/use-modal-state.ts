import { useEffect, useState } from 'react';

export function useModalState(
  urlImageIndex?: number,
  urlFolderPath?: string,
  urlFilePath?: string,
  sessionDataImages?: Array<{ index: number }>
) {
  const [imageModalIndex, setImageModalIndex] = useState<number | null>(null);
  const [fileModalPath, setFileModalPath] = useState<string | null>(null);
  const [folderModalPath, setFolderModalPath] = useState<string | null>(null);

  useEffect(() => {
    if (urlImageIndex !== undefined && sessionDataImages) {
      if (urlImageIndex >= 0 && urlImageIndex < sessionDataImages.length) {
        setImageModalIndex(urlImageIndex);
      }
    }
  }, [urlImageIndex, sessionDataImages]);

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
