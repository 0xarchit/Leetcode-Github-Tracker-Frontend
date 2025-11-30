import { Student, SuspiciousActivity } from "@/services/api";

interface SuspiciousStudent {
  student: Student;
  activities: SuspiciousActivity[];
}


export function detectSuspiciousActivities(
  student: Student
): SuspiciousActivity[] {
  const activities: SuspiciousActivity[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  
  if (student.lc_submission_history) {
    Object.entries(student.lc_submission_history).forEach(([date, count]) => {
      const d = new Date(date);
      if (d >= thirtyDaysAgo && d <= now) {
        if (count > 35) {
          activities.push({
            type: "leetcode_submissions",
            reason: `${count} LeetCode submissions on ${date}`,
            value: count,
            threshold: 35,
          });
        }
      }
    });
  }

  
  if (student.lc_progress_history && student.lc_progress_history.length >= 2) {
    
    const sorted = [...student.lc_progress_history].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    
    const recent = sorted.filter((entry) => {
      const d = new Date(entry.timestamp);
      return d >= thirtyDaysAgo && d <= now;
    });

    
    for (let i = 0; i < recent.length - 1; i++) {
      const current = recent[i];
      const next = recent[i + 1];
      const increase = current.count - next.count;
      
      
      
      
      
      
      
      
      if (increase > 8) {
         const dateStr = new Date(current.timestamp).toLocaleDateString();
         activities.push({
          type: "leetcode_progress",
          reason: `+${increase} problems detected on ${dateStr}`,
          value: increase,
          threshold: 8,
        });
      }
    }
  }

  
  if (student.gh_contribution_history) {
    Object.entries(student.gh_contribution_history).forEach(([date, count]) => {
      const d = new Date(date);
      if (d >= thirtyDaysAgo && d <= now) {
        if (count > 50) {
          activities.push({
            type: "github_commits",
            reason: `${count} GitHub commits on ${date}`,
            value: count,
            threshold: 50,
          });
        }
      }
    });
  }

  return activities;
}


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


export function formatSuspiciousReason(
  activities: SuspiciousActivity[]
): string {
  if (activities.length === 0) return "";
  if (activities.length === 1) return activities[0].reason;

  return activities.map((a) => a.reason).join(" • ");
}
