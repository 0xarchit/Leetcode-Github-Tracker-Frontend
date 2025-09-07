import { cacheService } from "./cacheService";

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

  async getStudentData(tableName: string): Promise<Student[]> {
    const cacheKey = `student_data_${tableName}`;
    const cached = cacheService.get<Student[]>(cacheKey);

    if (cached && !cacheService.isForceRefresh()) {
      return cached;
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

    // Clear related cache after force update
    cacheService.clear();

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
}

export const apiService = new ApiService();
