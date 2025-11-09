import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SessionMessageInput } from '../projects/components/sessions-chat/SessionMessageInput';
import { useClaudeStream } from './hooks/useClaudeStream';
import { LiveMessageList } from './LiveMessageList';
import { PermissionModal } from './PermissionModal';

type LiveSessionViewProps = {
  sessionId: string;
  projectPath: string;
  projectName: string;
};

export const LiveSessionView = ({ sessionId, projectPath, projectName }: LiveSessionViewProps) => {
  const navigate = useNavigate();
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const { messages, images, status, error, pendingPermissions, toolCalls, sendMessage, cancel, approvePermissions } =
    useClaudeStream(sessionId, projectPath, projectName, true);

  console.log('[LiveSessionView] Images state:', images);

  const handleSendMessage = (message: string, imagePaths?: string[]) => {
    sendMessage(message, imagePaths);
  };

  const handleCancel = async () => {
    await cancel();
  };

  const handleApprovePermissions = async (approvals: { id: string; approved: boolean }[]) => {
    await approvePermissions(approvals);
    setShowPermissionModal(false);
  };

  const handleBack = () => {
    navigate({ to: '/projects', search: { project: projectName } });
  };

  const showPermissionButton = pendingPermissions.length > 0 && status === 'pending-permissions';

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Live Session</h2>
              <p className="text-sm text-muted-foreground">{projectName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === 'streaming' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Claude is thinking...</span>
              </div>
            )}

            {showPermissionButton && (
              <Button variant="outline" onClick={() => setShowPermissionModal(true)}>
                Approve Permissions ({pendingPermissions.length})
              </Button>
            )}

            {status === 'streaming' && (
              <Button variant="destructive" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      <LiveMessageList messages={messages} images={images} toolCalls={toolCalls} status={status} />

      {error && (
        <div className="border-t bg-destructive/10 p-3 text-sm text-destructive">
          <strong>Error:</strong> {error}
        </div>
      )}

      <SessionMessageInput
        onSend={handleSendMessage}
        disabled={status === 'streaming' || status === 'pending-permissions'}
        placeholder={status === 'pending-permissions' ? 'Waiting for permission approval...' : 'Type your message...'}
      />

      {showPermissionModal && (
        <PermissionModal
          permissions={pendingPermissions}
          onApprove={handleApprovePermissions}
          onClose={() => setShowPermissionModal(false)}
        />
      )}
    </div>
  );
};
