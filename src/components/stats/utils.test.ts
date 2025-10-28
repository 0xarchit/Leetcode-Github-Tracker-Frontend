import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import type { Student } from "@/services/api";
import {
  computeStudentMetrics,
  countBadges,
  sumHistoryEntries,
  toNumber,
} from "./utils";

const DAY_IN_MS = 86_400_000;

const freezeTime = (iso: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
};

describe("stats utils", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("toNumber", () => {
    it("converts string numbers and strips commas", () => {
      expect(toNumber("1,234")).toBe(1234);
      expect(toNumber("42")).toBe(42);
    });

    it("falls back to default when invalid", () => {
      expect(toNumber("abc", 7)).toBe(7);
      expect(toNumber(undefined, 3)).toBe(3);
    });
  });

  describe("sumHistoryEntries", () => {
    beforeEach(() => {
      freezeTime("2025-02-01T00:00:00.000Z");
    });

    it("sums only entries within the desired window", () => {
      const history = {
        "2025-01-30": 4,
        "2025-01-10": 2,
        "2024-12-20": 10,
      } satisfies Record<string, number>;

      expect(sumHistoryEntries(history, 30)).toBe(6);
      expect(sumHistoryEntries(history, 7)).toBe(4);
    });

    it("returns zero for empty or stale history", () => {
      expect(sumHistoryEntries(undefined, 30)).toBe(0);
      expect(sumHistoryEntries({ "2024-10-01": 9 }, 30)).toBe(0);
    });
  });

  describe("countBadges", () => {
    it("counts array and object representations", () => {
      expect(countBadges('["star", "pull-shark", ""]')).toBe(2);
      expect(countBadges('{"gold":2,"silver":1,"bronze":0}')).toBe(3);
    });

    it("handles shorthand strings and zero-like values", () => {
      expect(countBadges("0")).toBe(0);
      expect(countBadges("badge,badge, badge")).toBe(3);
    });

    it("falls back to token counting when mixed", () => {
      expect(countBadges("alpha | beta | gamma")).toBe(3);
    });
  });

  describe("computeStudentMetrics", () => {
    beforeEach(() => {
      freezeTime("2025-02-01T00:00:00.000Z");
    });

    const buildStudent = (): Student => {
      const now = Date.now();
      const withinWindow = new Date(now - 5 * DAY_IN_MS).toISOString();
      const earlier = new Date(now - 45 * DAY_IN_MS).toISOString();

      return {
        name: "Alice Smith",
        roll_number: 101,
        github_username: "alice",
        leetcode_username: "alice_lc",
        git_followers: 50,
        git_following: 12,
        git_public_repo: 8,
        git_original_repo: 3,
        git_authored_repo: 5,
        last_commit_date: withinWindow,
        git_badges: '["star", "pull-shark"]',
        lc_total_solved: 320,
        lc_easy: 150,
        lc_medium: 130,
        lc_hard: 40,
        lc_ranking: 4800,
        lc_lastsubmission: withinWindow,
        lc_lastacceptedsubmission: withinWindow,
        lc_cur_streak: 18,
        lc_max_streak: 40,
        lc_badges: '{"gold":2,"silver":1}',
        lc_language: "TypeScript, C++",
        gh_contribution_history: {
          [withinWindow.slice(0, 10)]: 6,
          [earlier.slice(0, 10)]: 20,
        },
        lc_submission_history: {
          [withinWindow.slice(0, 10)]: 9,
          [earlier.slice(0, 10)]: 50,
        },
        last_commit_day: withinWindow,
      } as Student;
    };

    it("calculates contributions, submissions, and badge counts", () => {
      const student = buildStudent();
      const metrics = computeStudentMetrics(student);

      expect(metrics.contributions30).toBe(6);
      expect(metrics.submissions30).toBe(9);
      expect(metrics.githubBadges).toBe(2);
      expect(metrics.leetcodeBadges).toBe(3);
      expect(metrics.totalBadges).toBe(5);
      expect(metrics.lastCommitDays).toBe(5);
      expect(metrics.githubScore).toBeGreaterThanOrEqual(0);
      expect(metrics.leetcodeScore).toBeGreaterThanOrEqual(0);
      expect(metrics.combinedScore).toBeGreaterThanOrEqual(0);
      expect(metrics.githubScore).toBeLessThanOrEqual(100);
      expect(metrics.leetcodeScore).toBeLessThanOrEqual(100);
      expect(metrics.combinedScore).toBeLessThanOrEqual(100);
    });

    it("handles students with missing histories", () => {
      const student = buildStudent();
      delete student.gh_contribution_history;
      delete student.lc_submission_history;
      student.git_badges = "0";
      student.lc_badges = "[]";

      const metrics = computeStudentMetrics(student);
      expect(metrics.contributions30).toBe(0);
      expect(metrics.submissions30).toBe(0);
      expect(metrics.totalBadges).toBe(0);
    });

    it("rewards higher recent activity and problem solving", () => {
      const baseStudent = buildStudent();
      const highPerformer: Student = {
        ...baseStudent,
        gh_contribution_history: {
          [baseStudent.last_commit_date!.slice(0, 10)]: 45,
        },
        lc_submission_history: {
          [baseStudent.last_commit_date!.slice(0, 10)]: 120,
        },
        lc_total_solved: 980,
        lc_easy: 320,
        lc_medium: 420,
        lc_hard: 240,
        lc_cur_streak: 48,
        lc_max_streak: 120,
        git_followers: 160,
        git_public_repo: 24,
        git_authored_repo: 16,
        git_original_repo: 11,
      };

      const baseMetrics = computeStudentMetrics(baseStudent);
      const highMetrics = computeStudentMetrics(highPerformer);

      expect(highMetrics.githubScore).toBeGreaterThan(baseMetrics.githubScore);
      expect(highMetrics.leetcodeScore).toBeGreaterThan(
        baseMetrics.leetcodeScore
      );
      expect(highMetrics.combinedScore).toBeGreaterThan(
        baseMetrics.combinedScore
      );
    });

    it("prioritises deeper solved counts when activity is equal", () => {
      const baseStudent = buildStudent();
      const specialist: Student = {
        ...baseStudent,
        lc_total_solved: baseStudent.lc_total_solved + 60,
        lc_easy: baseStudent.lc_easy + 20,
        lc_medium: baseStudent.lc_medium + 26,
        lc_hard: baseStudent.lc_hard + 14,
      };

      const baseMetrics = computeStudentMetrics(baseStudent);
      const specialistMetrics = computeStudentMetrics(specialist);

      expect(specialistMetrics.leetcodeScore).toBeGreaterThan(
        baseMetrics.leetcodeScore
      );
      expect(specialistMetrics.combinedScore).toBeGreaterThanOrEqual(
        baseMetrics.combinedScore
      );
    });
  });
});
