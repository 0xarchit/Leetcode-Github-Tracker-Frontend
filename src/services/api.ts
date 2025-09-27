import { cacheService } from "./cacheService";

// Guard to avoid multiple reloads in the same tick when multiple calls detect staleness
let __staleReloadScheduled = false;

const API_BASE_URL = (() => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) {
    throw new Error(
      "VITE_API_BASE_URL is not defined. Add it to your .env and restart the dev server."
    );
  }
  return url as string;
})();

export interface Student {
  name: string;
  roll_number: number;
  github_username: string;
  leetcode_username: string;
  git_followers: number;
  git_following: number;
  git_public_repo: number;
  git_original_repo: number;
  git_authored_repo: number;
  last_commit_date: string;
  git_badges: string;
  lc_total_solved: number;
  lc_easy: number;
  lc_medium: number;
  lc_hard: number;
  lc_ranking: number;
  lc_lastsubmission: string;
  lc_lastacceptedsubmission: string;
  lc_cur_streak: number;
  lc_max_streak: number;
  lc_badges: string;
  lc_language: string;
  gh_contribution_history?: Record<string, number>;
  lc_submission_history?: Record<string, number>;
  last_commit_day: string;
}

export interface Notification {
  name: string;
  rollnumber: number;
  table_name: string;
  reason: string;
}

export interface AvailableTablesResponse {
  tables: string[];
}

export interface HealthResponse {
  ok: boolean;
}

export interface UpdateResponse {
  source_table: string;
  target_table: string;
  updated: number;
  errors: string[];
}

export interface RemoveNotificationResponse {
  ok: boolean;
  removed: number;
}

export interface LastUpdateEntry {
  table_name: string;
  changed_at: string; // ISO-like string from backend
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }

  async getAvailableTables(): Promise<AvailableTablesResponse> {
    const cacheKey = "available_tables";
    const cached = cacheService.get<AvailableTablesResponse>(cacheKey);

    if (cached && !cacheService.isForceRefresh()) {
      return cached;
    }

    const result = await this.request<AvailableTablesResponse>("/available");
    cacheService.set(cacheKey, result);
    return result;
  }

  async getStudentData(
    tableName: string,
    options?: {
      useCachedLastUpdate?: boolean;
      skipCacheValidation?: boolean;
      cacheOnly?: boolean;
    }
  ): Promise<Student[]> {
    const cacheKey = `student_data_${tableName}`;
    const cached = cacheService.get<Student[]>(cacheKey);
    if (cached && !cacheService.isForceRefresh()) {
      // If caller wants to skip any validation, just return cached data
      if (options?.skipCacheValidation) {
        return cached;
      }
      // Before trusting cache, compare with last update time for this table
      try {
        const lastUpdates = options?.useCachedLastUpdate
          ? await this.getLastUpdatesCached()
          : await this.getLastUpdates();
        const base = tableName.toLowerCase().replace(/_data$/i, "");
        // Consider both the base table and the _Data variant
        const candidates = lastUpdates.filter((e) => {
          const t = e.table_name.toLowerCase();
          return t === base || t === `${base}_data`;
        });

        if (candidates.length > 0) {
          // Use the most recent changed_at among candidates
          const latestChangedAt = candidates
            .map((e) => new Date(e.changed_at).getTime())
            .filter((t) => !Number.isNaN(t))
            .reduce((max, t) => Math.max(max, t), 0);

          const cacheTs = cacheService.getTimestamp(cacheKey) ?? 0;
          if (latestChangedAt > 0 && cacheTs < latestChangedAt) {
            // Invalidate stale cache and reload site to ensure fresh data is loaded
            cacheService.remove(cacheKey);
            if (typeof window !== "undefined" && !__staleReloadScheduled) {
              __staleReloadScheduled = true;
              setTimeout(() => window.location.reload(), 50);
            }
          } else {
            return cached;
          }
        } else {
          // If no entry found, assume cache is fine
          return cached;
        }
      } catch {
        // If lastUpdate fails, fall back to cached data
        return cached;
      }
    }

    // If caller explicitly wants cache-only behavior, avoid network and return empty when absent
    if (options?.cacheOnly) {
      return [];
    }

    const result = await this.request<Student[]>("/data", {
      method: "POST",
      body: JSON.stringify({ table_name: tableName }),
    });
    cacheService.set(cacheKey, result);
    return result;
  }

  async updateDatabase(tableName: string): Promise<UpdateResponse> {
    const result = await this.request<UpdateResponse>("/update", {
      method: "POST",
      body: JSON.stringify({ table_name: tableName }),
    });
    // Clear related caches after force update (target table and available tables)
    try {
      cacheService.remove(`student_data_${tableName}`);
      cacheService.remove("available_tables");
    } catch {}

    return result;
  }

  async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>("/showNotif");
  }

  async removeNotification(
    tableName: string,
    rollNumber: number
  ): Promise<RemoveNotificationResponse> {
    return this.request<RemoveNotificationResponse>("/removeNotif", {
      method: "POST",
      body: JSON.stringify({
        table_name: tableName,
        roll_number: rollNumber,
      }),
    });
  }

  async getLastUpdates(): Promise<LastUpdateEntry[]> {
    // Always fetch fresh to ensure prompt cache invalidation when server data changes
    return this.request<LastUpdateEntry[]>("/lastUpdate");
  }

  // Cached variant for public/non-auth pages to avoid repeated calls
  async getLastUpdatesCached(
    ttlMs: number = 5 * 60 * 1000
  ): Promise<LastUpdateEntry[]> {
    const cacheKey = "last_update_entries";
    const cached = cacheService.get<LastUpdateEntry[]>(cacheKey);
    if (cached) return cached;
    const fresh = await this.request<LastUpdateEntry[]>("/lastUpdate");
    cacheService.set(cacheKey, fresh, ttlMs);
    return fresh;
  }
}

export const apiService = new ApiService();
