import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getGetApiSessionsProjectNameQueryKey, usePatchApiSettings } from '@/api';
import { Checkbox } from '@/common/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/common/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/common/components/ui/select';
import { queryClient } from '@/common/lib/tanstack-query';
import { useProjectSessionUIStore } from '@/common/stores/project-session-ui-store';
import { useSettingsStore } from '@/common/stores/settings-store';

type SettingsFormData = {
  groupBy: 'date' | 'token-percentage' | 'label';
  showTokenPercentage: boolean;
  showAttachments: boolean;
};

export const SessionSettingsTab = () => {
  const settingsData = useSettingsStore((state) => state.settings);
  const { mutate: updateSettings } = usePatchApiSettings();
  const { groupBy, setGroupBy } = useProjectSessionUIStore();

  const settings = settingsData?.sessions;

  const form = useForm<SettingsFormData>({
    defaultValues: {
      groupBy,
      showTokenPercentage: settings?.display.showTokenPercentage ?? true,
      showAttachments: settings?.display.showAttachments ?? false
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        groupBy,
        showTokenPercentage: settings.display.showTokenPercentage,
        showAttachments: settings.display.showAttachments
      });
    }
  }, [settings, form, groupBy]);

  const handleGroupByChange = (value: 'date' | 'token-percentage' | 'label') => {
    setGroupBy(value);
    queryClient.invalidateQueries({ queryKey: getGetApiSessionsProjectNameQueryKey() });
  };

  const handleDisplayChange = (field: keyof Omit<SettingsFormData, 'groupBy'>, value: boolean) => {
    if (!settings) return;

    updateSettings({
      data: {
        sessions: {
          ...settings,
          display: {
            ...settings.display,
            [field]: value
          }
        }
      }
    });
  };

  if (!settings) return null;

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="grid grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="groupBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group By</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleGroupByChange(value as 'date' | 'token-percentage' | 'label');
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select grouping" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="date">Date Range</SelectItem>
                      <SelectItem value="token-percentage">Token Percentage</SelectItem>
                      <SelectItem value="label">Labels</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Display Options</h3>

            <FormField
              control={form.control}
              name="showTokenPercentage"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleDisplayChange('showTokenPercentage', checked as boolean);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Show token percentage</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showAttachments"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleDisplayChange('showAttachments', checked as boolean);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Show attachments count</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
};
