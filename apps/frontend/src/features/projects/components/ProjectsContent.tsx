import type { RefObject } from 'react';
import type {
  GetApiSessionsProjectName200ItemsItem,
  GetApiSessionsProjectNameSessionId200,
  GetApiSessionsProjectNameSessionId200MessagesItem
} from '@/api/_generated/schemas';
import { FilterButtons } from './FilterButtons';
import { FileModal } from './modals/FileModal';
import { FolderModal } from './modals/FolderModal';
import { ImageModal } from './modals/ImageModal';
import { SearchNavigation } from './sessions-chat/SearchNavigation';
import { SessionMessage } from './sessions-chat/SessionMessage';
import { SessionBadges } from './sessions-sidebar/SessionBadges';

interface ProjectsContentProps {
  contentRef: RefObject<HTMLDivElement | null>;
  currentSession?: GetApiSessionsProjectName200ItemsItem;
  filteredMessages: GetApiSessionsProjectNameSessionId200MessagesItem[];
  pathValidation?: Array<{ path: string; exists: boolean }>;
  searchQuery?: string;
  searchMatches: number[];
  searchMatchIndex: number;
  imageModalIndex: number | null;
  fileModalPath: string | null;
  folderModalPath: string | null;
  selectedProject: string;
  sessionId: string;
  sessionData: GetApiSessionsProjectNameSessionId200;
  onNextMatch: () => void;
  onPreviousMatch: () => void;
  onCloseSearch: () => void;
  onImageClick: (index: number) => void;
  onPathClick: (path: string) => void;
  onImageModalClose: () => void;
  onImageModalNext: () => void;
  onImageModalPrev: () => void;
  onFileModalClose: () => void;
  onFolderModalClose: () => void;
  onFolderModalFileClick: (path: string) => void;
  onFolderModalFolderClick: (path: string) => void;
}

export function ProjectsContent({
  contentRef,
  currentSession,
  filteredMessages,
  pathValidation,
  searchQuery,
  searchMatches,
  searchMatchIndex,
  imageModalIndex,
  fileModalPath,
  folderModalPath,
  selectedProject,
  sessionId,
  sessionData,
  onNextMatch,
  onPreviousMatch,
  onCloseSearch,
  onImageClick,
  onPathClick,
  onImageModalClose,
  onImageModalNext,
  onImageModalPrev,
  onFileModalClose,
  onFolderModalClose,
  onFolderModalFileClick
}: ProjectsContentProps) {
  return (
    <>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            {currentSession && <SessionBadges session={currentSession} showSearch />}
          </div>
        </div>
        <FilterButtons />
      </div>
      {searchQuery && searchMatches.length > 0 && (
        <SearchNavigation
          searchTerm={searchQuery}
          currentIndex={searchMatchIndex}
          totalMatches={searchMatches.length}
          onNext={onNextMatch}
          onPrevious={onPreviousMatch}
          onClose={onCloseSearch}
        />
      )}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
        {filteredMessages.map((message, msgIdx) => (
          <div key={`${message.type}-${msgIdx}`} data-message-index={msgIdx}>
            <SessionMessage
              message={message}
              imageOffset={0}
              onImageClick={onImageClick}
              onPathClick={onPathClick}
              pathValidation={pathValidation}
              searchTerm={searchQuery}
              isSearchMatch={searchMatches.includes(msgIdx)}
              availableImages={sessionData.images.map((img) => img.index)}
            />
          </div>
        ))}
      </div>

      {imageModalIndex !== null && (
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
