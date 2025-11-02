import type { ProjectsConfig } from '@bcc/shared';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectsStore } from '../../stores/projects-store';

type SettingsFormData = {
  groupBy: ProjectsConfig['groupBy'];
  hideNonGitProjects: boolean;
  hidePathInCards: boolean;
  showSessionCount: boolean;
  showCurrentBranch: boolean;
  showActionButtons: boolean;
  showProjectLabel: boolean;
};

export const SettingsTab = () => {
  const { settings, updateSettings } = useProjectsStore();

  const form = useForm<SettingsFormData>({
    defaultValues: {
      groupBy: settings?.groupBy || 'date',
      hideNonGitProjects: settings?.filters.hideNonGitProjects || false,
      hidePathInCards: settings?.filters.hidePathInCards || false,
      showSessionCount: settings?.display.showSessionCount ?? true,
      showCurrentBranch: settings?.display.showCurrentBranch ?? true,
      showActionButtons: settings?.display.showActionButtons ?? true,
      showProjectLabel: settings?.display.showProjectLabel ?? true
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        groupBy: settings.groupBy,
        hideNonGitProjects: settings.filters.hideNonGitProjects,
        hidePathInCards: settings.filters.hidePathInCards,
        showSessionCount: settings.display.showSessionCount,
        showCurrentBranch: settings.display.showCurrentBranch,
        showActionButtons: settings.display.showActionButtons,
        showProjectLabel: settings.display.showProjectLabel
      });
    }
  }, [settings, form]);

  const handleChange = (field: keyof SettingsFormData, value: boolean | string) => {
    if (!settings) return;

    if (field === 'groupBy') {
      updateSettings({ groupBy: value as ProjectsConfig['groupBy'] });
    } else if (field === 'hideNonGitProjects' || field === 'hidePathInCards') {
      updateSettings({
        filters: {
          ...settings.filters,
          [field]: value
        }
      });
    } else {
      updateSettings({
        display: {
          ...settings.display,
          [field]: value
        }
      });
    }
  };

  if (!settings) return null;

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="groupBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group By</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleChange('groupBy', value);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grouping" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="date">Date Range</SelectItem>
                  <SelectItem value="label">Labels</SelectItem>
                  <SelectItem value="session-count">Session Count</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Choose how to group your projects</FormDescription>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Filters</h3>

          <FormField
            control={form.control}
            name="hideNonGitProjects"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      handleChange('hideNonGitProjects', checked as boolean);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Hide non-git projects</FormLabel>
                  <FormDescription>Only show projects that are Git repositories</FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hidePathInCards"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      handleChange('hidePathInCards', checked as boolean);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Hide path in cards</FormLabel>
                  <FormDescription>Hide the full path tooltip from project cards</FormDescription>
                </div>
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
                      handleChange('showSessionCount', checked as boolean);
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
                      handleChange('showCurrentBranch', checked as boolean);
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
                      handleChange('showActionButtons', checked as boolean);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Show action buttons</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showProjectLabel"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      handleChange('showProjectLabel', checked as boolean);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Show project labels</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
};
