import { mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl?: number;
};

export class JsonFileCache {
  private cacheDir: string;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
  }

  private getCachePath(key: string): string {
    return join(this.cacheDir, `${key}.json`);
  }

  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const memoryCached = this.memoryCache.get(key);
    if (memoryCached) {
      if (!memoryCached.ttl || Date.now() - memoryCached.timestamp < memoryCached.ttl) {
        return memoryCached.data as T;
      }
      this.memoryCache.delete(key);
    }

    try {
      const filePath = this.getCachePath(key);
      const content = await readFile(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);

      if (!entry.ttl || Date.now() - entry.timestamp < entry.ttl) {
        this.memoryCache.set(key, entry);
        return entry.data;
      }
    } catch {}

    return defaultValue;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.memoryCache.set(key, entry);

    const filePath = this.getCachePath(key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(entry), 'utf-8');
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await unlink(this.getCachePath(key));
    } catch {}
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      await rm(this.cacheDir, { recursive: true, force: true });
    } catch {}
  }
}
