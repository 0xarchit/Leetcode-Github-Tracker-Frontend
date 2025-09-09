interface CacheItem<T> {
  data: T;
  timestamp: number; // epoch ms
  expiresIn: number; // ms
}

class CacheService {
  private readonly HOUR_IN_MS = 60 * 60 * 1000;
  private readonly PREFIX = "cache:";

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

  set<T>(key: string, data: T, expiresInMs: number = this.HOUR_IN_MS): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: expiresInMs,
    };

    if (this.hasStorage()) {
      try {
        window.localStorage.setItem(this.k(key), JSON.stringify(item));
      } catch {
        // If storage is full or blocked, silently ignore
      }
    }
  }

  get<T>(key: string): T | null {
    if (!this.hasStorage()) return null;
    try {
      const raw = window.localStorage.getItem(this.k(key));
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
      // Corrupt entry, remove it
      try {
        window.localStorage.removeItem(this.k(key));
      } catch {}
      return null;
    }
  }

  clear(): void {
    if (!this.hasStorage()) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(this.PREFIX)) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }

  remove(key: string): void {
    if (!this.hasStorage()) return;
    try {
      window.localStorage.removeItem(this.k(key));
    } catch {
      // ignore
    }
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
    } catch {
      // ignore
    }
  }

  // We only want to refresh when admin presses "Force Update", not on browser reloads.
  // Keep method for backward compatibility but always return false.
  isForceRefresh(): boolean {
    return false;
  }
}

export const cacheService = new CacheService();
