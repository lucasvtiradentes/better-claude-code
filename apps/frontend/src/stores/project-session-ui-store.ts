import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ProjectSessionUIState = {
  groupBy: 'date' | 'token-percentage' | 'label';
  search: string;
  _hasHydrated: boolean;
  setGroupBy: (groupBy: 'date' | 'token-percentage' | 'label') => void;
  setSearch: (search: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useProjectSessionUIStore = create<ProjectSessionUIState>()(
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
      name: 'project-session-ui',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
