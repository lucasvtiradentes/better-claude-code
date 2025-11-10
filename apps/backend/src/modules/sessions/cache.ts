import { homedir } from 'node:os';
import { join } from 'node:path';
import { JsonFileCache } from '../projects/cache.js';

const CACHE_DIR = join(homedir(), '.config', 'bcc', 'cache');

export const sessionsCache = new JsonFileCache(join(CACHE_DIR, 'sessions'));

export interface SessionCacheEntry {
  id: string;
  title: string;
  messageCount: number;
  createdAt: number;
  tokenPercentage: number;
  imageCount?: number;
  filesOrFoldersCount?: number;
  urlCount?: number;
  labels?: string[];
  summary?: string;
  fileMtime: number;
}
