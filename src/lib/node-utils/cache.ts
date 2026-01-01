import { FileIOHelper, NodePathHelper } from '@/common/utils/helpers/node-helper';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl?: number;
};

export class JsonFileCache {
  private cacheDir: string;
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
  }

  private getCachePath(key: string): string {
    return NodePathHelper.join(this.cacheDir, `${key}.json`);
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
      const content = await FileIOHelper.readFileAsync(filePath);
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
    await FileIOHelper.mkdirAsync(NodePathHelper.dirname(filePath), { recursive: true });
    await FileIOHelper.writeFileAsync(filePath, JSON.stringify(entry));
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await FileIOHelper.unlinkAsync(this.getCachePath(key));
    } catch {}
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      await FileIOHelper.rmAsync(this.cacheDir, { recursive: true, force: true });
    } catch {}
  }
}
