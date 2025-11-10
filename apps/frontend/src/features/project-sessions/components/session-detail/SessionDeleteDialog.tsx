import { ConfirmDialog } from '@/common/components/ConfirmDialog';

interface SessionDeleteDialogProps {
  open: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SessionDeleteDialog({ open, isLoading, onClose, onConfirm }: SessionDeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Session"
      description="Are you sure you want to delete this session? This action cannot be undone and all messages will be permanently removed."
      confirmText="Delete"
      cancelText="Cancel"
      variant="destructive"
      isLoading={isLoading}
    />
  );
}
