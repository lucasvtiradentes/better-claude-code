export enum MemoryType {
  Global = 'global',
  Project = 'project',
  Local = 'local'
}

export type MemoryInfo = {
  name: string;
  filePath: string;
  memoryType: MemoryType;
};
