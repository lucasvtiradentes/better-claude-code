import { useState } from 'react';
import { Check, X, FileText, Terminal, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Permission } from './types';

type PermissionModalProps = {
  permissions: Permission[];
  onApprove: (approvals: { id: string; approved: boolean }[]) => void;
  onClose: () => void;
};

export const PermissionModal = ({ permissions, onApprove, onClose }: PermissionModalProps) => {
  const [selections, setSelections] = useState<Record<string, boolean>>(
    Object.fromEntries(permissions.map((p) => [p.id, true]))
  );

  const handleToggle = (id: string) => {
    setSelections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApproveAll = () => {
    const approvals = permissions.map((p) => ({ id: p.id, approved: selections[p.id] }));
    onApprove(approvals);
  };

  const handleDenyAll = () => {
    const approvals = permissions.map((p) => ({ id: p.id, approved: false }));
    onApprove(approvals);
  };

  const getIcon = (tool: string) => {
    if (tool.toLowerCase().includes('file') || tool.toLowerCase().includes('read') || tool.toLowerCase().includes('write')) {
      return <FileText className="h-5 w-5" />;
    }
    if (tool.toLowerCase().includes('bash') || tool.toLowerCase().includes('command')) {
      return <Terminal className="h-5 w-5" />;
    }
    return <AlertTriangle className="h-5 w-5" />;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permission Requests</DialogTitle>
          <DialogDescription>Claude Code is requesting permission to use the following tools</DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
          {permissions.map((permission) => (
            <div
              key={permission.id}
              className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {getIcon(permission.tool)}
                  <h4 className="font-medium">{permission.tool}</h4>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{permission.description}</p>
                {permission.path && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <strong>Path:</strong> {permission.path}
                  </p>
                )}
                {permission.command && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <strong>Command:</strong> {permission.command}
                  </p>
                )}
              </div>
              <Button
                variant={selections[permission.id] ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleToggle(permission.id)}
              >
                {selections[permission.id] ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleDenyAll}>
            Deny All
          </Button>
          <Button onClick={handleApproveAll}>Approve Selected</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
