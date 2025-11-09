import { create } from 'zustand';
import type { GetApiSettings200 } from '@/api';

interface SettingsStore {
  settings: GetApiSettings200 | null;
  setSettings: (settings: GetApiSettings200) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  setSettings: (settings) => set({ settings })
}));
