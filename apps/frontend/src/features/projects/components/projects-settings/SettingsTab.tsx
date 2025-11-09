import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getGetApiProjectsQueryKey, usePatchApiSettings } from '@/api';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { queryClient } from '@/lib/tanstack-query';
import { useProjectUIStore } from '@/stores/project-ui-store';
import { useSettingsStore } from '@/stores/settings-store';

type SettingsFormData = {
  groupBy: 'date' | 'label' | 'session-count';
  showSessionCount: boolean;
  showCurrentBranch: boolean;
  showActionButtons: boolean;
};

export const SettingsTab = () => {
  const settingsData = useSettingsStore((state) => state.settings);
  const { mutate: updateSettings } = usePatchApiSettings();
  const { groupBy, setGroupBy } = useProjectUIStore();

  const settings = settingsData?.projects;

  const form = useForm<SettingsFormData>({
    defaultValues: {
      groupBy,
      showSessionCount: settings?.display.showSessionCount ?? true,
      showCurrentBranch: settings?.display.showCurrentBranch ?? true,
      showActionButtons: settings?.display.showActionButtons ?? true
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        groupBy,
        showSessionCount: settings.display.showSessionCount,
        showCurrentBranch: settings.display.showCurrentBranch,
        showActionButtons: settings.display.showActionButtons
      });
    }
  }, [settings, form, groupBy]);

  const handleGroupByChange = (value: 'date' | 'label' | 'session-count') => {
    setGroupBy(value);
    queryClient.invalidateQueries({ queryKey: getGetApiProjectsQueryKey() });
  };

  const handleDisplayChange = (field: keyof Omit<SettingsFormData, 'groupBy'>, value: boolean) => {
    if (!settings) return;

    updateSettings({
      data: {
        projects: {
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
                      handleGroupByChange(value as 'date' | 'label' | 'session-count');
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
                      <SelectItem value="label">Labels</SelectItem>
                      <SelectItem value="session-count">Session Count</SelectItem>
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
              name="showSessionCount"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleDisplayChange('showSessionCount', checked as boolean);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Show session count</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showCurrentBranch"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleDisplayChange('showCurrentBranch', checked as boolean);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Show current branch</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showActionButtons"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleDisplayChange('showActionButtons', checked as boolean);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Show action buttons</FormLabel>
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
