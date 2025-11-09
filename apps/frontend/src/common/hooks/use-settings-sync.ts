import { useEffect } from 'react';
import { useGetApiSettings } from '@/api';
import { useSettingsStore } from '@/common/stores/settings-store';

export function useSettingsSync() {
  const { data: settings } = useGetApiSettings();
  const setSettings = useSettingsStore((state) => state.setSettings);

  useEffect(() => {
    if (settings) {
      setSettings(settings);
    }
  }, [settings, setSettings]);
}
