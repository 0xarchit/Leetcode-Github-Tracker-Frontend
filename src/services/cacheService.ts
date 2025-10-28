interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheService {
  private readonly HOUR_IN_MS = 60 * 60 * 1000;
  private readonly PREFIX = "cache:";

  private readonly LEGACY_PREFIX = "cache";

  private hasStorage(): boolean {
    try {
      if (typeof window === "undefined" || !("localStorage" in window))
        return false;
      const testKey = `${this.PREFIX}__test__`;
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private k(key: string) {
    return `${this.PREFIX}${key}`;
  }

  private legacyK(key: string) {
    return `${this.LEGACY_PREFIX}${key}`;
  }

  set<T>(key: string, data: T, expiresInMs: number = this.HOUR_IN_MS): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: expiresInMs,
    };

    if (this.hasStorage()) {
      try {
        window.localStorage.setItem(this.k(key), JSON.stringify(item));
      } catch {}
    }
  }

  get<T>(key: string): T | null {
    if (!this.hasStorage()) return null;
    try {
      let raw = window.localStorage.getItem(this.k(key));

      if (!raw) raw = window.localStorage.getItem(this.legacyK(key));
      if (!raw) return null;
      const item = JSON.parse(raw) as CacheItem<T>;
      const now = Date.now();
      if (
        !item ||
        typeof item.timestamp !== "number" ||
        typeof item.expiresIn !== "number"
      ) {
        window.localStorage.removeItem(this.k(key));
        return null;
      }
      if (now - item.timestamp > item.expiresIn) {
        window.localStorage.removeItem(this.k(key));
        return null;
      }
      return item.data as T;
    } catch {
      try {
        window.localStorage.removeItem(this.k(key));
      } catch {}
      return null;
    }
  }

  getTimestamp(key: string): number | null {
    if (!this.hasStorage()) return null;
    try {
      let raw = window.localStorage.getItem(this.k(key));
      if (!raw) raw = window.localStorage.getItem(this.legacyK(key));
      if (!raw) return null;
      const item = JSON.parse(raw) as CacheItem<unknown>;
      if (!item || typeof item.timestamp !== "number") return null;
      return item.timestamp;
    } catch {
      return null;
    }
  }

  clear(): void {
    if (!this.hasStorage()) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        if (k.startsWith(this.PREFIX) || k.startsWith(this.LEGACY_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {}
  }

  remove(key: string): void {
    if (!this.hasStorage()) return;
    try {
      window.localStorage.removeItem(this.k(key));
      window.localStorage.removeItem(this.legacyK(key));
    } catch {}
  }

  clearExpired(): void {
    if (!this.hasStorage()) return;
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k || !k.startsWith(this.PREFIX)) continue;
        const raw = window.localStorage.getItem(k);
        if (!raw) continue;
        try {
          const item = JSON.parse(raw) as CacheItem<unknown>;
          if (now - (item?.timestamp ?? 0) > (item?.expiresIn ?? 0)) {
            keysToRemove.push(k);
          }
        } catch {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {}
  }

  isForceRefresh(): boolean {
    return false;
  }
}

export const cacheService = new CacheService();
