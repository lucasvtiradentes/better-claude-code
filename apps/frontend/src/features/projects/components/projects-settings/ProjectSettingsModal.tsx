import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectSettingsLabelsTab } from './ProjectSettingsLabelsTab';
import { ProjectSettingsTab } from './ProjectSettingsTab';

type ProjectSettingsModalProps = {
  onClose: () => void;
};

export const ProjectSettingsModal = ({ onClose }: ProjectSettingsModalProps) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="labels">Labels</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-4">
            <ProjectSettingsTab />
          </TabsContent>

          <TabsContent value="labels" className="mt-4">
            <ProjectSettingsLabelsTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
