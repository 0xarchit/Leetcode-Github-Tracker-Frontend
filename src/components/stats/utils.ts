import type { Student } from "@/services/api";

export const HISTORY_WINDOW_DAYS = 30;
const DAY_IN_MS = 86_400_000;

export type SortMetric =
  | "combinedScore"
  | "githubScore"
  | "leetcodeScore"
  | "contributions30"
  | "submissions30"
  | "totalSolved"
  | "currentStreak"
  | "totalBadges"
  | "totalSubmissions";

export interface StudentMetrics {
  base: Student;
  contributions30: number;
  submissions30: number;
  totalSubmissions: number;
  githubScore: number;
  leetcodeScore: number;
  combinedScore: number;
  followers: number;
  publicRepos: number;
  authoredRepos: number;
  originalRepos: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  currentStreak: number;
  maxStreak: number;
  githubBadges: number;
  leetcodeBadges: number;
  totalBadges: number;
  lastCommitDays: number | null;
  acceptanceRate: number;
}

interface ClassStats {
  maxTotalSolved: number;
  maxTotalSubmissions: number;
  maxWeightedSolved: number;
  maxCurrentStreak: number;
  maxMaxStreak: number;
  bestRanking: number;
  maxLeetcodeBadges: number;
  maxContributions30: number;
  maxFollowers: number;
  maxRepoFootprint: number;
  maxGithubBadges: number;
}

export const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const sumHistoryEntries = (
  history: Record<string, number> | undefined,
  days: number = HISTORY_WINDOW_DAYS
): number => {
  if (!history || days <= 0) return 0;

  const now = Date.now();
  const threshold = now - days * DAY_IN_MS;

  return Object.entries(history).reduce((total, [dateKey, value]) => {
    const date = new Date(dateKey);
    if (!Number.isFinite(date.getTime())) return total;
    if (date.getTime() < threshold) return total;
    const numericValue = toNumber(value, 0);
    return numericValue >= 0 ? total + numericValue : total;
  }, 0);
};

export const countBadges = (raw?: string | null): number => {
  if (!raw) return 0;
  const trimmed = raw.trim();
  if (
    !trimmed ||
    /^0+$/.test(trimmed) ||
    /^(?:n\/?a|null|undefined|-|—)$/i.test(trimmed)
  ) {
    return 0;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean).length;
    }
    if (parsed && typeof parsed === "object") {
      const values = Object.values(parsed)
        .map((v) => toNumber(v, 0))
        .filter((n) => n >= 0);
      if (values.length) {
        return values.reduce((acc, val) => acc + val, 0);
      }
    }
  } catch {}

  if (/badge/i.test(trimmed)) {
    const zeroBadgeMention = /\b0\s*badge/i.test(trimmed);
    if (zeroBadgeMention) return 0;
    const mentions = trimmed.match(/badge/gi);
    if (mentions) return mentions.length;
  }

  const digitMatches = trimmed.match(/\d+/g);
  if (digitMatches && digitMatches.length) {
    const numbers = digitMatches.map((token) => toNumber(token, 0));
    if (numbers.every((n) => n >= 0)) {
      const sum = numbers.reduce((acc, val) => acc + val, 0);
      if (sum > 0) return sum;
    }
  }

  const tokens = trimmed
    .split(/[|,;\n]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  return tokens.length;
};

export const daysSince = (dateString?: string | null): number | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (!Number.isFinite(date.getTime())) return null;

  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diff = today.getTime() - date.getTime();
  if (!Number.isFinite(diff) || diff < 0) {
    return 0;
  }

  return Math.floor(diff / DAY_IN_MS);
};

const computeClassStats = (students: Student[]): ClassStats => {
  const stats: ClassStats = {
    maxTotalSolved: 0,
    maxTotalSubmissions: 0,
    maxWeightedSolved: 0,
    maxCurrentStreak: 0,
    maxMaxStreak: 0,
    bestRanking: 5000000,
    maxLeetcodeBadges: 0,
    maxContributions30: 0,
    maxFollowers: 0,
    maxRepoFootprint: 0,
    maxGithubBadges: 0,
  };

  students.forEach((student) => {
    const totalSolved = toNumber(student.lc_total_solved, 0);
    const easySolved = toNumber(student.lc_easy, 0);
    const mediumSolved = toNumber(student.lc_medium, 0);
    const hardSolved = toNumber(student.lc_hard, 0);
    const currentStreak = toNumber(student.lc_cur_streak, 0);
    const maxStreak = Math.max(
      currentStreak,
      toNumber(student.lc_max_streak, 0)
    );
    const ranking = toNumber(student.lc_ranking, 0);
    const leetcodeBadges = countBadges(student.lc_badges);

    const totalSubmissions = student.lc_submission_history
      ? Object.values(student.lc_submission_history).reduce(
          (sum, val) => sum + toNumber(val, 0),
          0
        )
      : 0;

    const weightedSolved = easySolved * 1 + mediumSolved * 2 + hardSolved * 4;
    const contributions30 = sumHistoryEntries(
      student.gh_contribution_history,
      HISTORY_WINDOW_DAYS
    );
    const followers = toNumber(student.git_followers, 0);
    const publicRepos = toNumber(student.git_public_repo, 0);
    const authoredRepos = toNumber(student.git_authored_repo, 0);
    const originalRepos = toNumber(student.git_original_repo, 0);
    const repoFootprint =
      publicRepos * 0.5 + authoredRepos * 1.2 + originalRepos * 1.5;
    const githubBadges = countBadges(student.git_badges);

    stats.maxTotalSolved = Math.max(stats.maxTotalSolved, totalSolved);
    stats.maxTotalSubmissions = Math.max(
      stats.maxTotalSubmissions,
      totalSubmissions
    );
    stats.maxWeightedSolved = Math.max(stats.maxWeightedSolved, weightedSolved);
    stats.maxCurrentStreak = Math.max(stats.maxCurrentStreak, currentStreak);
    stats.maxMaxStreak = Math.max(stats.maxMaxStreak, maxStreak);
    stats.maxLeetcodeBadges = Math.max(stats.maxLeetcodeBadges, leetcodeBadges);
    stats.maxContributions30 = Math.max(
      stats.maxContributions30,
      contributions30
    );
    stats.maxFollowers = Math.max(stats.maxFollowers, followers);
    stats.maxRepoFootprint = Math.max(stats.maxRepoFootprint, repoFootprint);
    stats.maxGithubBadges = Math.max(stats.maxGithubBadges, githubBadges);

    if (ranking > 0 && ranking < stats.bestRanking) {
      stats.bestRanking = ranking;
    }
  });

  return stats;
};

export const computeStudentMetricsWithClass = (
  students: Student[]
): StudentMetrics[] => {
  const classStats = computeClassStats(students);
  return students.map((student) =>
    computeSingleStudentMetrics(student, classStats)
  );
};

const computeSingleStudentMetrics = (
  student: Student,
  classStats: ClassStats
): StudentMetrics => {
  const followers = toNumber(student.git_followers, 0);
  const publicRepos = toNumber(student.git_public_repo, 0);
  const authoredRepos = toNumber(student.git_authored_repo, 0);
  const originalRepos = toNumber(student.git_original_repo, 0);

  const contributions30 = sumHistoryEntries(
    student.gh_contribution_history,
    HISTORY_WINDOW_DAYS
  );
  const submissions30 = sumHistoryEntries(
    student.lc_submission_history,
    HISTORY_WINDOW_DAYS
  );

  const totalSubmissions = student.lc_submission_history
    ? Object.values(student.lc_submission_history).reduce(
        (sum, val) => sum + toNumber(val, 0),
        0
      )
    : 0;

  const githubBadges = countBadges(student.git_badges);
  const leetcodeBadges = countBadges(student.lc_badges);
  const totalBadges = githubBadges + leetcodeBadges;

  const lastCommitDays = daysSince(
    student.last_commit_date ?? student.last_commit_day ?? undefined
  );

  const percentile = (value: number, maxValue: number) => {
    if (maxValue <= 0) return 0;
    const ratio = value / maxValue;
    return Math.max(0, Math.min(ratio, 1));
  };

  const totalSolved = Math.max(0, toNumber(student.lc_total_solved, 0));
  const easySolved = Math.max(0, toNumber(student.lc_easy, 0));
  const mediumSolved = Math.max(0, toNumber(student.lc_medium, 0));
  const hardSolved = Math.max(0, toNumber(student.lc_hard, 0));
  const currentStreak = Math.max(0, toNumber(student.lc_cur_streak, 0));
  const maxStreak = Math.max(currentStreak, toNumber(student.lc_max_streak, 0));

  const freshness = (() => {
    if (lastCommitDays === null) return 0.6;
    const ratio =
      1 - Math.min(lastCommitDays, HISTORY_WINDOW_DAYS) / HISTORY_WINDOW_DAYS;
    return Math.max(0, Math.min(ratio, 1));
  })();

  const contributionsNorm = percentile(
    contributions30,
    classStats.maxContributions30
  );
  const followersNorm = percentile(followers, classStats.maxFollowers);
  const repoFootprint =
    publicRepos * 0.5 + authoredRepos * 1.2 + originalRepos * 1.5;
  const repoNorm = percentile(repoFootprint, classStats.maxRepoFootprint);
  const githubBadgeNorm = percentile(githubBadges, classStats.maxGithubBadges);

  const githubScoreRaw =
    contributionsNorm * 0.4 +
    followersNorm * 0.15 +
    repoNorm * 0.15 +
    freshness * 0.05 +
    githubBadgeNorm * 0.25;

  const githubScore = Math.round(githubScoreRaw * 100);

  const totalSubmissionsNorm = percentile(
    totalSubmissions,
    classStats.maxTotalSubmissions
  );
  const weightedSolved = easySolved * 1 + mediumSolved * 2 + hardSolved * 4;
  const weightedSolvedNorm = percentile(
    weightedSolved,
    classStats.maxWeightedSolved
  );
  const totalSolvedNorm = percentile(totalSolved, classStats.maxTotalSolved);
  const currentStreakNorm = percentile(
    currentStreak,
    classStats.maxCurrentStreak
  );
  const maxStreakNorm = percentile(maxStreak, classStats.maxMaxStreak);

  const rankingValue = toNumber(student.lc_ranking, 0);
  const rankingNorm =
    rankingValue > 0 && classStats.bestRanking > 0
      ? Math.max(0, Math.min(1, classStats.bestRanking / rankingValue))
      : 0;

  const leetcodeBadgeNorm = percentile(
    leetcodeBadges,
    classStats.maxLeetcodeBadges
  );

  const acceptanceRate =
    totalSubmissions > 0 ? (totalSolved / totalSubmissions) * 100 : 0;

  const leetcodeScoreRaw =
    totalSubmissionsNorm * 0.15 +
    weightedSolvedNorm * 0.3 +
    currentStreakNorm * 0.1 +
    maxStreakNorm * 0.2 +
    rankingNorm * 0.15 +
    leetcodeBadgeNorm * 0.1;

  const leetcodeScore = Math.round(leetcodeScoreRaw * 100);

  const combinedScore = Math.round((githubScore + leetcodeScore) / 2);

  return {
    base: student,
    contributions30,
    submissions30,
    totalSubmissions,
    githubScore,
    leetcodeScore,
    combinedScore,
    followers,
    publicRepos,
    authoredRepos,
    originalRepos,
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    currentStreak,
    maxStreak,
    githubBadges,
    leetcodeBadges,
    totalBadges,
    lastCommitDays,
    acceptanceRate,
  };
};

export const computeStudentMetrics = (student: Student): StudentMetrics => {
  return computeSingleStudentMetrics(student, computeClassStats([student]));
};
