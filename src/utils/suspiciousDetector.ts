import { Student, SuspiciousActivity } from "@/services/api";

interface SuspiciousStudent {
  student: Student;
  activities: SuspiciousActivity[];
}

/**
 * Detects suspicious activities for a student based on their data
 */
export function detectSuspiciousActivities(
  student: Student
): SuspiciousActivity[] {
  const activities: SuspiciousActivity[] = [];
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Check LeetCode submissions in last 24 hours (threshold: >35)
  if (student.lc_submission_history) {
    const recentSubmissions = Object.entries(student.lc_submission_history)
      .filter(([date]) => {
        const d = new Date(date);
        return d >= yesterday && d <= now;
      })
      .reduce((sum, [, count]) => sum + count, 0);

    if (recentSubmissions > 35) {
      activities.push({
        type: "leetcode_submissions",
        reason: `${recentSubmissions} LeetCode submissions in last 24h`,
        value: recentSubmissions,
        threshold: 35,
      });
    }
  }

  // Check LeetCode problem count hike in last 24 hours (threshold: >8)
  if (student.lc_progress_history && student.lc_progress_history.length >= 2) {
    // Sort by timestamp
    const sorted = [...student.lc_progress_history].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Get entries from last 24 hours
    const recent = sorted.filter((entry) => {
      const d = new Date(entry.timestamp);
      return d >= yesterday && d <= now;
    });

    if (recent.length >= 2) {
      // Calculate max increase in last 24h
      const counts = recent.map((r) => r.count).sort((a, b) => a - b);
      const increase = counts[counts.length - 1] - counts[0];

      if (increase > 8) {
        activities.push({
          type: "leetcode_progress",
          reason: `+${increase} problems solved in last 24h`,
          value: increase,
          threshold: 8,
        });
      }
    } else if (recent.length === 1 && sorted.length > 1) {
      // Compare with the most recent entry before 24h ago
      const older = sorted.find((entry) => {
        const d = new Date(entry.timestamp);
        return d < yesterday;
      });

      if (older) {
        const increase = recent[0].count - older.count;
        if (increase > 8) {
          activities.push({
            type: "leetcode_progress",
            reason: `+${increase} problems solved since last update`,
            value: increase,
            threshold: 8,
          });
        }
      }
    }
  }

  // Check GitHub commits in last 24 hours (threshold: >50)
  if (student.gh_contribution_history) {
    const recentCommits = Object.entries(student.gh_contribution_history)
      .filter(([date]) => {
        const d = new Date(date);
        return d >= yesterday && d <= now;
      })
      .reduce((sum, [, count]) => sum + count, 0);

    if (recentCommits > 50) {
      activities.push({
        type: "github_commits",
        reason: `${recentCommits} GitHub commits in last 24h`,
        value: recentCommits,
        threshold: 50,
      });
    }
  }

  return activities;
}

/**
 * Get all students with suspicious activities
 */
export function getSuspiciousStudents(
  students: Student[]
): SuspiciousStudent[] {
  return students
    .map((student) => ({
      student,
      activities: detectSuspiciousActivities(student),
    }))
    .filter((item) => item.activities.length > 0)
    .sort((a, b) => b.activities.length - a.activities.length);
}

/**
 * Format suspicious activities for display
 */
export function formatSuspiciousReason(
  activities: SuspiciousActivity[]
): string {
  if (activities.length === 0) return "";
  if (activities.length === 1) return activities[0].reason;

  return activities.map((a) => a.reason).join(" • ");
}
