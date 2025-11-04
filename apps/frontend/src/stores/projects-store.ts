import { create } from 'zustand';

type ProjectsStore = {
  search: string;
  setSearch: (search: string) => void;
};

export const useProjectsStore = create<ProjectsStore>((set) => ({
  search: '',
  setSearch: (search) => set({ search })
}));
