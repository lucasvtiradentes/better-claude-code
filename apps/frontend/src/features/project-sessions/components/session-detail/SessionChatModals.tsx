import type { GetApiSessionsProjectNameSessionId200 } from '@/api';
import { FileModal } from '@/features/projects/components/modals/FileModal';
import { FolderModal } from '@/features/projects/components/modals/FolderModal';
import { ImageModal } from '@/features/projects/components/modals/ImageModal';

interface SessionChatModalsProps {
  imageModalIndex: number | null;
  fileModalPath: string | null;
  folderModalPath: string | null;
  selectedProject: string;
  sessionId: string;
  sessionData: GetApiSessionsProjectNameSessionId200;
  onImageModalClose: () => void;
  onImageModalNext: () => void;
  onImageModalPrev: () => void;
  onFileModalClose: () => void;
  onFolderModalClose: () => void;
  onFolderModalFileClick: (path: string) => void;
}

export function SessionChatModals({
  imageModalIndex,
  fileModalPath,
  folderModalPath,
  selectedProject,
  sessionId,
  sessionData,
  onImageModalClose,
  onImageModalNext,
  onImageModalPrev,
  onFileModalClose,
  onFolderModalClose,
  onFolderModalFileClick
}: SessionChatModalsProps) {
  return (
    <>
      {imageModalIndex !== null && sessionData?.images && (
        <ImageModal
          images={sessionData.images}
          currentIndex={imageModalIndex}
          onClose={onImageModalClose}
          onNext={onImageModalNext}
          onPrev={onImageModalPrev}
        />
      )}

      {fileModalPath && (
        <FileModal
          projectId={selectedProject}
          sessionId={sessionId}
          filePath={fileModalPath}
          onClose={onFileModalClose}
        />
      )}

      {folderModalPath && (
        <FolderModal
          projectId={selectedProject}
          sessionId={sessionId}
          folderPath={folderModalPath}
          onClose={onFolderModalClose}
          onFileClick={onFolderModalFileClick}
        />
      )}
    </>
  );
}
