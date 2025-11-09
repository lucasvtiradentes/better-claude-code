import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionLabelsTab } from './SessionLabelsTab';
import { SessionSettingsTab } from './SessionSettingsTab';

type SessionSettingsModalProps = {
  onClose: () => void;
  projectName?: string;
};

export const SessionSettingsModal = ({ onClose, projectName }: SessionSettingsModalProps) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="labels">Labels</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-4">
            <SessionSettingsTab projectName={projectName} />
          </TabsContent>

          <TabsContent value="labels" className="mt-4">
            <SessionLabelsTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
