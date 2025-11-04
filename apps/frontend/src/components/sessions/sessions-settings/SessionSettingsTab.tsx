import type { SessionsConfig } from '@better-claude-code/shared';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSessionsStore } from '../../../stores/sessions-store';

type SettingsFormData = {
  groupBy: SessionsConfig['groupBy'];
  showTokenPercentage: boolean;
  showAttachments: boolean;
};

export const SessionSettingsTab = () => {
  const { settings, updateSettings } = useSessionsStore();

  const form = useForm<SettingsFormData>({
    defaultValues: {
      groupBy: settings?.groupBy || 'date',
      showTokenPercentage: settings?.display.showTokenPercentage ?? true,
      showAttachments: settings?.display.showAttachments ?? false
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        groupBy: settings.groupBy,
        showTokenPercentage: settings.display.showTokenPercentage,
        showAttachments: settings.display.showAttachments
      });
    }
  }, [settings, form]);

  const handleChange = (field: keyof SettingsFormData, value: boolean | string) => {
    if (!settings) return;

    if (field === 'groupBy') {
      updateSettings({ groupBy: value as SessionsConfig['groupBy'] });
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
                      handleChange('groupBy', value);
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
                        handleChange('showTokenPercentage', checked as boolean);
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
                        handleChange('showAttachments', checked as boolean);
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
