import type { RefObject } from 'react';
import type {
  GetApiSessionsProjectName200ItemsItem,
  GetApiSessionsProjectNameSessionId200,
  GetApiSessionsProjectNameSessionId200MessagesItem
} from '@/api/_generated/schemas';
import { SessionChatHeader } from '../session-detail/SessionChatHeader';
import { SessionChatMessages } from '../session-detail/SessionChatMessages';
import { SessionChatModals } from '../session-detail/SessionChatModals';
import { SearchNavigation } from './SearchNavigation';
import { SessionMessageInput } from './SessionMessageInput';

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
  messageInputPlaceholder: string;
  onSendMessage?: (message: string) => void;
  messageInputDisabled?: boolean;
  isStreaming?: boolean;
}

export function SessionChat({
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
  onFolderModalFileClick,
  onSendMessage,
  messageInputPlaceholder,
  messageInputDisabled = false,
  isStreaming = false
}: ProjectsContentProps) {
  return (
    <div className="flex h-full flex-col">
      <SessionChatHeader session={currentSession} />

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

      <SessionChatMessages
        contentRef={contentRef}
        filteredMessages={filteredMessages}
        pathValidation={pathValidation}
        searchQuery={searchQuery}
        searchMatches={searchMatches}
        sessionData={sessionData}
        onImageClick={onImageClick}
        onPathClick={onPathClick}
      />

      {onSendMessage && (
        <SessionMessageInput
          onSend={onSendMessage}
          disabled={messageInputDisabled}
          placeholder={messageInputPlaceholder}
          isStreaming={isStreaming}
        />
      )}

      <SessionChatModals
        imageModalIndex={imageModalIndex}
        fileModalPath={fileModalPath}
        folderModalPath={folderModalPath}
        selectedProject={selectedProject}
        sessionId={sessionId}
        sessionData={sessionData}
        onImageModalClose={onImageModalClose}
        onImageModalNext={onImageModalNext}
        onImageModalPrev={onImageModalPrev}
        onFileModalClose={onFileModalClose}
        onFolderModalClose={onFolderModalClose}
        onFolderModalFileClick={onFolderModalFileClick}
      />
    </div>
  );
}
