import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useDeleteApiSettingsSessionsLabelsLabelId,
  usePatchApiSettingsSessionsLabelsLabelId,
  usePostApiSettingsSessionsLabels
} from '@/api';
import { useSettingsStore } from '@/stores/settings-store';
import type { GetApiSettings200SessionsLabelsItem } from '@/api/_generated/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

type LabelFormData = {
  name: string;
  color: string;
};

export const SessionLabelsTab = () => {
  const settingsData = useSettingsStore((state) => state.settings);
  const { mutate: addLabel } = usePostApiSettingsSessionsLabels();
  const { mutate: updateLabel } = usePatchApiSettingsSessionsLabelsLabelId();
  const { mutate: deleteLabel } = useDeleteApiSettingsSessionsLabelsLabelId();

  const settings = settingsData?.sessions;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const addForm = useForm<LabelFormData>({
    defaultValues: { name: '', color: '#0e639c' }
  });

  const editForm = useForm<LabelFormData>();

  const onAddLabel = (data: LabelFormData) => {
    const newLabel: GetApiSettings200SessionsLabelsItem = {
      id: data.name.toLowerCase().replace(/\s+/g, '-'),
      name: data.name,
      color: data.color
    };
    addLabel(
      { data: newLabel },
      {
        onSuccess: () => {
          addForm.reset();
          setShowAddForm(false);
        }
      }
    );
  };

  const onEditLabel = (id: string, data: LabelFormData) => {
    updateLabel(
      { labelId: id, data: { name: data.name, color: data.color } },
      {
        onSuccess: () => {
          setEditingId(null);
          editForm.reset();
        }
      }
    );
  };

  const onDeleteLabel = (id: string) => {
    if (window.confirm('Delete this label? It will be removed from all projects.')) {
      deleteLabel({ labelId: id });
    }
  };

  const startEditing = (label: GetApiSettings200SessionsLabelsItem) => {
    setEditingId(label.id);
    editForm.setValue('name', label.name);
    editForm.setValue('color', label.color);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {settings?.labels.map((label) => (
          <div key={label.id} className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border">
            {editingId === label.id ? (
              <Form {...editForm}>
                <form
                  onSubmit={editForm.handleSubmit((data) => onEditLabel(label.id, data))}
                  className="flex items-center gap-2 flex-1"
                >
                  <FormField
                    control={editForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="color" {...field} className="w-12 h-10 cursor-pointer" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...field} placeholder="Label name" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      editForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </form>
              </Form>
            ) : (
              <>
                <div className="w-6 h-6 rounded" style={{ backgroundColor: label.color }} />
                <span className="flex-1 text-sm text-foreground">{label.name}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => startEditing(label)}
                  title="Edit label"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onDeleteLabel(label.id)}
                  className="text-destructive hover:text-destructive/80"
                  title="Delete label"
                >
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      {showAddForm ? (
        <Form {...addForm}>
          <form
            onSubmit={addForm.handleSubmit(onAddLabel)}
            className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border"
          >
            <FormField
              control={addForm.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="color" {...field} className="w-12 h-10 cursor-pointer" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={addForm.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input {...field} placeholder="Label name" />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="sm">
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                addForm.reset();
              }}
            >
              Cancel
            </Button>
          </form>
        </Form>
      ) : (
        <Button type="button" onClick={() => setShowAddForm(true)} variant="outline" className="w-full">
          <Plus size={16} className="mr-2" />
          Add Label
        </Button>
      )}
    </div>
  );
};
