import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type FilterState = {
  showUserMessages: boolean;
  showAssistantMessages: boolean;
  showToolCalls: boolean;
  toggleUserMessages: () => void;
  toggleAssistantMessages: () => void;
  toggleToolCalls: () => void;
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      showUserMessages: true,
      showAssistantMessages: true,
      showToolCalls: true,
      toggleUserMessages: () => set((state) => ({ showUserMessages: !state.showUserMessages })),
      toggleAssistantMessages: () => set((state) => ({ showAssistantMessages: !state.showAssistantMessages })),
      toggleToolCalls: () => set((state) => ({ showToolCalls: !state.showToolCalls }))
    }),
    {
      name: 'filter-storage'
    }
  )
);
