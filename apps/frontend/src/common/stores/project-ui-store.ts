import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ProjectUIState = {
  groupBy: 'date' | 'label' | 'session-count';
  search: string;
  _hasHydrated: boolean;
  setGroupBy: (groupBy: 'date' | 'label' | 'session-count') => void;
  setSearch: (search: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useProjectUIStore = create<ProjectUIState>()(
  persist(
    (set) => ({
      groupBy: 'date',
      search: '',
      _hasHydrated: false,
      setGroupBy: (groupBy) => set({ groupBy }),
      setSearch: (search) => set({ search }),
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated })
    }),
    {
      name: 'project-ui',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
