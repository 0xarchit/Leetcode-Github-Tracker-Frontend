import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiService, type Student } from "@/services/api";
import TopNavigation from "@/components/dashboard/TopNavigation";
import SettingsModal from "@/components/dashboard/SettingsModal";
import CompareStudentsModal from "@/components/dashboard/CompareStudentsModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  Github,
  GitBranch,
  Layers,
  Loader2,
  Search,
  Users,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Zap,
  Trophy,
  Flame,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  HISTORY_WINDOW_DAYS,
  computeStudentMetricsWithClass,
  type SortMetric,
  type StudentMetrics,
} from "@/components/stats/utils";

const CLASS_STORAGE_KEY = "student-tracker:stats:selected-class";
const TOP_N_STORAGE_KEY = "student-tracker:stats:top-n";
const ALL_CLASSES_KEY = "__all_classes__";


const generateUniqueColors = (count: number): string[] => {
  
  const baseColors = [
    "hsl(var(--primary))",   
    "hsl(217 91% 60%)",      
    "hsl(142 71% 45%)",      
    "hsl(271 91% 65%)",      
    "hsl(25 95% 53%)",       
    "hsl(0 84% 60%)",        
    "hsl(189 94% 43%)",      
    "hsl(330 81% 60%)",      
    "hsl(45 93% 47%)",       
    "hsl(173 80% 40%)",      
    "hsl(239 84% 67%)",      
    "hsl(84 81% 44%)",       
    "hsl(350 89% 60%)",      
    "hsl(258 90% 66%)",      
    "hsl(38 92% 50%)",       
  ];
  
  
  return baseColors.slice(0, Math.min(count, baseColors.length));
};

const palette = [
  "hsl(var(--primary))",
  "hsl(210 98% 56%)",
  "hsl(140 70% 45%)",
  "hsl(280 80% 60%)",
  "hsl(32 88% 55%)",
  "hsl(350 78% 55%)",
];

const metricMeta: Record<SortMetric, { label: string; description: string; icon: JSX.Element }> = {
  combinedScore: {
    label: "Combined",
    description: "Balanced GitHub & LeetCode score (0-100 range)",
    icon: <Layers className="h-4 w-4" />,
  },
  githubScore: {
    label: "GitHub",
    description: "Recent contributions, followers, repo activity (0-100)",
    icon: <Github className="h-4 w-4" />,
  },
  leetcodeScore: {
    label: "LeetCode",
    description: "Solves, submissions, streaks (0-100)",
    icon: <GitBranch className="h-4 w-4" />,
  },
  contributions30: {
    label: "30d GitHub",
    description: "Total contributions over the past 30 days",
    icon: <Github className="h-4 w-4" />,
  },
  submissions30: {
    label: "30d LeetCode",
    description: "Accepted submissions in the past 30 days",
    icon: <GitBranch className="h-4 w-4" />,
  },
  totalSolved: {
    label: "Total Solved",
    description: "Total problems solved on LeetCode (all time)",
    icon: <Target className="h-4 w-4" />,
  },
  currentStreak: {
    label: "Current Streak",
    description: "Active daily streak on LeetCode",
    icon: <Flame className="h-4 w-4" />,
  },
  totalBadges: {
    label: "Total Badges",
    description: "Combined badges from GitHub and LeetCode",
    icon: <Award className="h-4 w-4" />,
  },
  totalSubmissions: {
    label: "Total Submissions",
    description: "All-time submission count on LeetCode",
    icon: <Zap className="h-4 w-4" />,
  },
};

type TableMetricKey =
  | "combinedScore"
  | "githubScore"
  | "leetcodeScore"
  | "contributions30"
  | "submissions30"
  | "totalSubmissions"
  | "acceptanceRate"
  | "followers"
  | "publicRepos"
  | "authoredRepos"
  | "originalRepos"
  | "lastCommitDays"
  | "totalSolved"
  | "easySolved"
  | "mediumSolved"
  | "hardSolved"
  | "currentStreak"
  | "totalBadges";

const tableMetrics: { key: TableMetricKey; label: string; suffix?: string; precision?: number }[] = [
  { key: "combinedScore", label: "Combined Score (0-100)" },
  { key: "githubScore", label: "GitHub Score (0-100)" },
  { key: "leetcodeScore", label: "LeetCode Score (0-100)" },
  { key: "contributions30", label: "GitHub Activity · 30d" },
  { key: "submissions30", label: "LeetCode Accepted · 30d" },
  { key: "totalSubmissions", label: "Total Submissions" },
  { key: "acceptanceRate", label: "Acceptance Rate", suffix: "%", precision: 1 },
  { key: "followers", label: "Followers" },
  { key: "publicRepos", label: "Public Repos" },
  { key: "authoredRepos", label: "Authored Repos" },
  { key: "originalRepos", label: "Original Repos" },
  { key: "lastCommitDays", label: "Days Since Commit", suffix: "d" },
  { key: "totalSolved", label: "Total Solved" },
  { key: "easySolved", label: "Easy" },
  { key: "mediumSolved", label: "Medium" },
  { key: "hardSolved", label: "Hard" },
  { key: "currentStreak", label: "Current Streak", suffix: "d" },
  { key: "totalBadges", label: "Total Badges" },
];

const tableMetricLookup = tableMetrics.reduce(
  (acc, metric) => {
    acc[metric.key] = metric;
    return acc;
  },
  {} as Record<TableMetricKey, (typeof tableMetrics)[number]>,
);

const mobileSummaryMetrics: TableMetricKey[] = [
  "combinedScore",
  "githubScore",
  "leetcodeScore",
  "totalSolved",
  "totalSubmissions",
  "acceptanceRate",
  "currentStreak",
  "contributions30",
  "submissions30",
  "totalBadges",
];

const radarMetrics = [
  { key: "combinedScore", label: "Combined" },
  { key: "githubScore", label: "GitHub" },
  { key: "leetcodeScore", label: "LeetCode" },
  { key: "contributions30", label: "GH 30d" },
  { key: "submissions30", label: "LC 30d" },
  { key: "totalBadges", label: "Badges" },
] as const satisfies ReadonlyArray<{ key: keyof StudentMetrics; label: string }>;

type RadarMetricKey = (typeof radarMetrics)[number]["key"];

const formatTableValue = (metrics: StudentMetrics, key: TableMetricKey, precision = 0, suffix = "") => {
  const raw = metrics[key] as number | null | undefined;
  if (raw === null || raw === undefined) return "—";
  const formatPrecision = precision ?? 0;
  const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: formatPrecision,
    minimumFractionDigits: formatPrecision,
  });
  const value = Number.isFinite(raw) ? formatter.format(raw as number) : "—";
  return suffix && value !== "—" ? `${value}${suffix}` : value;
};

const StatsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [topN, setTopN] = useState<number>(() => {
    if (typeof window === "undefined") return 5;
    const cached = window.localStorage.getItem(TOP_N_STORAGE_KEY);
    const parsed = cached ? Number(cached) : NaN;
    if (Number.isFinite(parsed)) {
      return Math.min(15, Math.max(2, parsed));
    }
    return 5;
  });
  const [sortMetric, setSortMetric] = useState<SortMetric>("combinedScore");
  
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  useEffect(() => {
    document.title = "Class Stats | Student Tracker";
    return () => {
      document.title = "Student Tracker";
    };
  }, []);

  useEffect(() => {
    const loadClasses = async () => {
      setIsLoadingClasses(true);
      setError(null);
      try {
        const response = await apiService.getAvailableTables();
        const tables = response.tables ?? [];
        setAvailableClasses(tables);
        if (tables.length === 0) {
          setSelectedClass(null);
          return;
        }
        let preferred: string | null = null;
        try {
          const cached = window.localStorage.getItem(CLASS_STORAGE_KEY);
          if (cached) {
            
            if (cached === ALL_CLASSES_KEY || tables.includes(cached)) {
              preferred = cached;
            }
          }
        } catch {
          preferred = null;
        }
        setSelectedClass((prev) => {
          if (prev && (prev === ALL_CLASSES_KEY || tables.includes(prev))) return prev;
          if (preferred) return preferred;
          return tables[0];
        });
      } catch (err) {
        console.error("Failed to load classes", err);
        setError("Unable to load classes. Please try again later.");
        toast({
          variant: "destructive",
          title: "Failed to load classes",
          description: "Check your network connection and retry.",
        });
      } finally {
        setIsLoadingClasses(false);
      }
    };

    loadClasses();
  }, [toast]);

  const fetchStudents = useCallback(
    async (table: string, options?: { skipCacheValidation?: boolean }) => {
      setIsLoadingStudents(true);
      setError(null);
      
      
      if (table === ALL_CLASSES_KEY) {
        try {
          
          const allStudentsData: Student[] = [];
          const classesToFetch: string[] = [];
          
          
          for (const className of availableClasses) {
            try {
              const cachedData = await apiService.getStudentData(className, {
                cacheOnly: true,
                skipCacheValidation: true,
              });
              if (cachedData && cachedData.length > 0) {
                
                const dataWithSection = cachedData.map(student => ({
                  ...student,
                  section: className.replace(/_/g, " "),
                }));
                allStudentsData.push(...dataWithSection);
              } else {
                classesToFetch.push(className);
              }
            } catch {
              classesToFetch.push(className);
            }
          }
          
          
          if (classesToFetch.length > 0) {
            const fetchPromises = classesToFetch.map(className =>
              apiService.getStudentData(className, {
                skipCacheValidation: options?.skipCacheValidation,
                useCachedLastUpdate: true,
              }).then(data => ({
                className,
                data: data || [],
              })).catch(() => ({
                className,
                data: [] as Student[],
              }))
            );
            
            const fetchedResults = await Promise.all(fetchPromises);
            fetchedResults.forEach(({ className, data }) => {
              if (data && data.length > 0) {
                
                const dataWithSection = data.map(student => ({
                  ...student,
                  section: className.replace(/_/g, " "),
                }));
                allStudentsData.push(...dataWithSection);
              }
            });
          }
          
          setStudents(allStudentsData);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(CLASS_STORAGE_KEY, ALL_CLASSES_KEY);
          }
          return true;
        } catch (err) {
          console.error("Failed to load all classes", err);
          setError(`Unable to load data for all classes.`);
          toast({
            variant: "destructive",
            title: "Student data unavailable",
            description: "We couldn't fetch the latest stats for all classes.",
          });
          setStudents([]);
          return false;
        } finally {
          setIsLoadingStudents(false);
        }
      }
      
      
      try {
        
        const cachedData = await apiService.getStudentData(table, {
          cacheOnly: true,
          skipCacheValidation: true,
        });
        
        if (cachedData && cachedData.length > 0) {
          setStudents(cachedData);
          setIsLoadingStudents(false);
          
          
          apiService.getStudentData(table, {
            skipCacheValidation: options?.skipCacheValidation,
            useCachedLastUpdate: true,
          }).then(freshData => {
            if (freshData && freshData.length > 0) {
              setStudents(freshData);
            }
          }).catch(() => {
            
          });
        } else {
          
          const data = await apiService.getStudentData(table, {
            skipCacheValidation: options?.skipCacheValidation,
            useCachedLastUpdate: true,
          });
          setStudents(data);
          setIsLoadingStudents(false);
        }
        
        if (typeof window !== "undefined") {
          window.localStorage.setItem(CLASS_STORAGE_KEY, table);
        }
        return true;
      } catch (err) {
        console.error("Failed to load students", err);
        setError(`Unable to load data for ${table.replace(/_/g, " ")}.`);
        toast({
          variant: "destructive",
          title: "Student data unavailable",
          description: "We couldn't fetch the latest stats for this class.",
        });
        setStudents([]);
        setIsLoadingStudents(false);
        return false;
      }
    },
    [toast, availableClasses],
  );

  useEffect(() => {
    if (!selectedClass) return;
    fetchStudents(selectedClass).catch(() => undefined);
  }, [selectedClass, fetchStudents]);

  const enrichedStudents = useMemo(() => computeStudentMetricsWithClass(students), [students]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return enrichedStudents;
    const q = search.trim().toLowerCase();
    return enrichedStudents.filter((metric) => {
      const targets = [
        metric.base.name,
        String(metric.base.roll_number),
        metric.base.github_username,
        metric.base.leetcode_username,
      ].filter(Boolean);
      return targets.some((item) => String(item).toLowerCase().includes(q));
    });
  }, [enrichedStudents, search]);

  const metricAccessor: Record<SortMetric, (student: StudentMetrics) => number> = useMemo(
    () => ({
      combinedScore: (s) => s.combinedScore,
      githubScore: (s) => s.githubScore,
      leetcodeScore: (s) => s.leetcodeScore,
      contributions30: (s) => s.contributions30,
      submissions30: (s) => s.submissions30,
      totalSolved: (s) => s.totalSolved,
      currentStreak: (s) => s.currentStreak,
      totalBadges: (s) => s.totalBadges,
      totalSubmissions: (s) => s.totalSubmissions,
    }),
    [],
  );

  const sortedStudents = useMemo(() => {
    const accessor = metricAccessor[sortMetric];
    return [...filteredStudents].sort((a, b) => accessor(b) - accessor(a));
  }, [filteredStudents, metricAccessor, sortMetric]);

  const effectiveTopN = useMemo(() => {
    const capped = Math.min(15, Math.max(2, topN));
    if (sortedStudents.length === 0) return capped;
    return Math.min(capped, Math.max(1, sortedStudents.length));
  }, [sortedStudents.length, topN]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOP_N_STORAGE_KEY, String(topN));
  }, [topN]);

  const topStudents = useMemo(() => sortedStudents.slice(0, effectiveTopN), [sortedStudents, effectiveTopN]);

  const chartLabels = useMemo(
    () =>
      topStudents.map((student) => {
        const name = student.base.name || "Student";
        const firstName = name.split(" ")[0];
        return `${firstName}`;
      }),
    [topStudents],
  );

  const githubChartData = useMemo(
    () =>
      topStudents.map((student, index) => ({
        name: chartLabels[index],
        contributions: student.contributions30,
        followers: student.followers,
        publicRepos: student.publicRepos,
      })),
    [topStudents, chartLabels],
  );

  const leetcodeChartData = useMemo(
    () =>
      topStudents.map((student, index) => ({
        name: chartLabels[index],
        submissions: student.totalSubmissions,
        solved: student.totalSolved,
        streak: student.currentStreak,
      })),
    [topStudents, chartLabels],
  );

  
  const difficultyChartData = useMemo(
    () =>
      topStudents.map((student, index) => ({
        name: chartLabels[index],
        easy: student.easySolved,
        medium: student.mediumSolved,
        hard: student.hardSolved,
      })),
    [topStudents, chartLabels],
  );

  
  const scoreDistributionData = useMemo(
    () =>
      topStudents.map((student, index) => ({
        name: chartLabels[index],
        github: student.githubScore,
        leetcode: student.leetcodeScore,
        combined: student.combinedScore,
      })),
    [topStudents, chartLabels],
  );

  
  const submissionInsightsData = useMemo(
    () =>
      topStudents.map((student, index) => ({
        name: chartLabels[index],
        totalSubmissions: student.totalSubmissions,
        totalSolved: student.totalSolved,
        acceptanceRate: Number(student.acceptanceRate.toFixed(1)),
      })),
    [topStudents, chartLabels],
  );

  
  const classOverview = useMemo(() => {
    if (enrichedStudents.length === 0) return null;
    
    const activeStudents = enrichedStudents.filter(s => s.contributions30 > 0 || s.submissions30 > 0).length;
    const studentsWithStreaks = enrichedStudents.filter(s => s.currentStreak > 0).length;
    const avgAcceptanceRate = enrichedStudents
      .filter(s => s.totalSubmissions > 0)
      .reduce((sum, s) => sum + s.acceptanceRate, 0) / Math.max(enrichedStudents.filter(s => s.totalSubmissions > 0).length, 1);
    
    
    const topPerformer = enrichedStudents.reduce((max, student) => 
      student.combinedScore > max.combinedScore ? student : max
    , enrichedStudents[0]);
    
    
    const highPerformers = enrichedStudents.filter(s => s.combinedScore >= 50).length;
    
    return {
      activeStudents,
      totalStudents: enrichedStudents.length,
      activityRate: ((activeStudents / enrichedStudents.length) * 100).toFixed(1),
      studentsWithStreaks,
      streakRate: ((studentsWithStreaks / enrichedStudents.length) * 100).toFixed(1),
      avgAcceptanceRate: avgAcceptanceRate.toFixed(1),
      topPerformer: topPerformer.base.name.split(' ')[0],
      topPerformerScore: topPerformer.combinedScore,
      highPerformers,
      highPerformerRate: ((highPerformers / enrichedStudents.length) * 100).toFixed(1),
    };
  }, [enrichedStudents]);

  const radarConfig = useMemo(() => {
    const entries: Record<string, { label: string; color: string; index: number }> = {};
    const uniqueColors = generateUniqueColors(topStudents.length);
    topStudents.forEach((student, index) => {
      const label = `${student.base.name.split(" ")[0]}`;
      entries[`student_${student.base.roll_number}`] = {
        label,
        color: uniqueColors[index],
        index, 
      };
    });
    return entries;
  }, [topStudents]);

  const radarData = useMemo(() => {
    if (!topStudents.length) return [];

    const maxPerKey = radarMetrics.reduce<Record<RadarMetricKey, number>>((acc, metric) => {
      acc[metric.key] = Math.max(
        ...topStudents.map((student) => {
          const value = student[metric.key];
          return typeof value === "number" && Number.isFinite(value) ? value : 0;
        }),
        0,
      );
      return acc;
    }, {} as Record<RadarMetricKey, number>);

    return radarMetrics.map((metric) => {
      const entry: Record<string, string | number> = {
        metric: metric.label,
      };
      topStudents.forEach((student) => {
        const key = `student_${student.base.roll_number}`;
        const max = maxPerKey[metric.key] || 1;
        const rawValue = student[metric.key];
        const numericValue = typeof rawValue === "number" && Number.isFinite(rawValue) ? rawValue : 0;
        entry[key] = max === 0 ? 0 : Number(((numericValue / max) * 100).toFixed(1));
      });
      return entry;
    });
  }, [topStudents]);

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSearch("");
  };

  if (authLoading || isLoadingClasses) {
    return (
      <div className="min-h-screen bg-dashboard-content flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading stats workspace...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const noClasses = !availableClasses.length;
  const noStudents = !isLoadingStudents && topStudents.length === 0;

  return (
    <div className="min-h-screen bg-dashboard-content">
      {}
      <TopNavigation
        availableTables={availableClasses}
        selectedTable={selectedClass}
        onTableSelect={handleClassChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
      />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-primary" />
                  {selectedClass === ALL_CLASSES_KEY ? "All Classes" : "Class"} performance analytics
                </CardTitle>
                <CardDescription>
                  Compare top {effectiveTopN} students {selectedClass === ALL_CLASSES_KEY ? "from all classes" : ""} over the last {HISTORY_WINDOW_DAYS} days across GitHub and
                  LeetCode metrics.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Class</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedClass === ALL_CLASSES_KEY 
                      ? "All Classes" 
                      : selectedClass 
                        ? selectedClass.replace(/_/g, " ") 
                        : "None"}
                  </Badge>
                </div>
                <Select value={selectedClass ?? ""} onValueChange={handleClassChange} disabled={noClasses}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={noClasses ? "No classes" : "Select class"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CLASSES_KEY}>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-semibold">All Classes</span>
                      </div>
                    </SelectItem>
                    {availableClasses.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Top students</span>
                  <Badge variant="secondary" className="text-xs">
                    {effectiveTopN} selected
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Slider
                    value={[effectiveTopN]}
                    min={2}
                    max={15}
                    step={1}
                    onValueChange={([value]) => setTopN(value)}
                    aria-label="Top N students"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>2</span>
                    <span>15</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-medium text-muted-foreground">Quick search</span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Filter by name, roll, or handle"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Rank by</span>
              <ToggleGroup
                type="single"
                value={sortMetric}
                onValueChange={(value) => value && setSortMetric(value as SortMetric)}
                className="flex flex-wrap gap-2"
              >
                {(Object.keys(metricMeta) as SortMetric[]).map((metric) => (
                  <ToggleGroupItem
                    key={metric}
                    value={metric}
                    className="px-3 py-2 text-sm"
                    aria-label={`Sort by ${metricMeta[metric].label}`}
                  >
                    <div className="flex items-center gap-2">
                      {metricMeta[metric].icon}
                      <span>{metricMeta[metric].label}</span>
                    </div>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                {metricMeta[sortMetric].description}
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader className="flex flex-row items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <CardTitle className="text-base">We're having trouble fetching data</CardTitle>
                <CardDescription>{error}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        )}

        {noClasses && (
          <Card className="border-dashed border-muted-foreground/50 bg-transparent">
            <CardHeader>
              <CardTitle>No classes available</CardTitle>
              <CardDescription>
                Connect your data source in the dashboard settings to start tracking class performance.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!noClasses && !isLoadingStudents && classOverview && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activity Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classOverview.activityRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {classOverview.activeStudents} of {classOverview.totalStudents} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Streak Consistency</CardTitle>
                <Flame className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classOverview.streakRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {classOverview.studentsWithStreaks} students with active streaks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classOverview.topPerformer}</div>
                <p className="text-xs text-muted-foreground">
                  Score: {classOverview.topPerformerScore}/100
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Performers</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classOverview.highPerformerRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {classOverview.highPerformers} students with score ≥50
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!noClasses && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Top performers overview</CardTitle>
              <CardDescription>
                Side-by-side comparison across 16 key indicators. Values are scoped to the last {HISTORY_WINDOW_DAYS}
                days where applicable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStudents ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading student metrics...
                </div>
              ) : noStudents ? (
                <div className="text-center py-12 text-muted-foreground">
                  No students matched your criteria. Try expanding the top-N range or clearing the search filter.
                </div>
              ) : (
                <>
                  <div className="hidden md:block rounded-lg border border-table-border overflow-hidden">
                    <div className="overflow-auto relative max-h-[calc(100vh-400px)]">
                      <table className="w-full caption-bottom text-sm min-w-full">
                        <thead className="sticky top-0 z-20 bg-background border-b border-table-border shadow-sm">
                          <tr className="bg-background hover:bg-background border-b">
                            <th className="h-12 px-4 min-w-[4rem] text-left text-xs font-semibold uppercase tracking-wide sticky left-0 z-30 border-r border-table-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ backgroundColor: 'hsl(var(--background))' }}>Rank</th>
                            <th className="h-12 px-4 min-w-[9rem] text-left text-xs font-semibold uppercase tracking-wide sticky left-16 z-30 border-r border-table-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ backgroundColor: 'hsl(var(--background))' }}>
                              Student
                            </th>
                            {selectedClass === ALL_CLASSES_KEY && (
                              <th className="h-12 px-4 min-w-[8rem] text-left text-xs font-semibold uppercase tracking-wide bg-background">
                                Section
                              </th>
                            )}
                            <th className="h-12 px-4 min-w-[4.5rem] text-left text-xs font-semibold uppercase tracking-wide bg-background">
                              Roll
                            </th>
                          {tableMetrics.map((metric) => (
                            <th
                              key={metric.key}
                              className="h-12 px-4 whitespace-nowrap text-right text-xs font-medium leading-tight uppercase tracking-wide bg-background"
                            >
                              {metric.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {topStudents.map((student, index) => {
                          const isEvenRow = index % 2 === 0;
                          const bgColor = isEvenRow ? 'hsl(var(--background))' : 'hsl(var(--muted))';
                          return (
                          <tr key={`${student.base.roll_number}-${index}`} className="text-xs border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle sticky left-0 z-10 border-r border-table-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" style={{ backgroundColor: bgColor }}>
                              <Badge variant={index === 0 ? "default" : "outline"}>#{index + 1}</Badge>
                            </td>
                            <td className="p-4 align-middle font-medium sticky left-16 z-10 border-r border-table-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" style={{ backgroundColor: bgColor }}>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-sm font-semibold leading-tight">{student.base.name}</span>
                                <div className="flex items-center gap-1">
                                  {student.base.github_username && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      asChild
                                    >
                                      <a
                                        href={`https://github.com/${student.base.github_username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1"
                                        aria-label={`View ${student.base.name}'s GitHub profile`}
                                      >
                                        <Github className="h-3 w-3" />
                                        <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    </Button>
                                  )}
                                  {student.base.leetcode_username && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      asChild
                                    >
                                      <a
                                        href={`https://leetcode.com/${student.base.leetcode_username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1"
                                        aria-label={`View ${student.base.name}'s LeetCode profile`}
                                      >
                                        <GitBranch className="h-3 w-3" />
                                        <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </td>
                            {selectedClass === ALL_CLASSES_KEY && (
                              <td className="p-4 align-middle text-sm">
                                <Badge variant="secondary" className="text-xs">
                                  {student.base.section || "Unknown"}
                                </Badge>
                              </td>
                            )}
                            <td className="p-4 align-middle text-sm font-medium">{student.base.roll_number}</td>
                            {tableMetrics.map((metric) => (
                              <td key={metric.key} className="p-4 align-middle whitespace-nowrap text-right text-xs font-medium tabular-nums">
                                {formatTableValue(student, metric.key, metric.precision, metric.suffix)}
                              </td>
                            ))}
                          </tr>
                        );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>

                  <div className="space-y-3 md:hidden max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                    {topStudents.map((student, index) => (
                      <div
                        key={`${student.base.roll_number}-${index}`}
                        className="rounded-lg border border-border/60 bg-gradient-to-br from-background to-muted/30 p-4 shadow-md backdrop-blur"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs shrink-0">
                                #{index + 1}
                              </Badge>
                              <p className="text-base font-bold leading-tight truncate">{student.base.name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">Roll: {student.base.roll_number}</p>
                            {selectedClass === ALL_CLASSES_KEY && student.base.section && (
                              <p className="text-xs text-muted-foreground">
                                Section: <Badge variant="outline" className="text-[0.65rem]">{student.base.section}</Badge>
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-1.5">
                              {student.base.github_username && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  asChild
                                >
                                  <a
                                    href={`https://github.com/${student.base.github_username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                  >
                                    <Github className="h-3.5 w-3.5" />
                                    <span>GitHub</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                </Button>
                              )}
                              {student.base.leetcode_username && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  asChild
                                >
                                  <a
                                    href={`https://leetcode.com/${student.base.leetcode_username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                  >
                                    <GitBranch className="h-3.5 w-3.5" />
                                    <span>LeetCode</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {}
                        <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-border/50">
                          <div className="text-center bg-primary/10 rounded-md p-2">
                            <div className="text-lg font-bold text-primary">{student.combinedScore.toFixed(0)}</div>
                            <div className="text-[0.65rem] text-muted-foreground">Combined</div>
                          </div>
                          <div className="text-center bg-blue-500/10 rounded-md p-2">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{student.githubScore.toFixed(0)}</div>
                            <div className="text-[0.65rem] text-muted-foreground">GitHub</div>
                          </div>
                          <div className="text-center bg-orange-500/10 rounded-md p-2">
                            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{student.leetcodeScore.toFixed(0)}</div>
                            <div className="text-[0.65rem] text-muted-foreground">LeetCode</div>
                          </div>
                        </div>
                        
                        {}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[0.7rem]">
                          {mobileSummaryMetrics.slice(3).map((metric) => {
                            const meta = tableMetricLookup[metric];
                            return (
                              <div key={metric} className="flex items-center justify-between gap-2 py-1">
                                <span className="text-muted-foreground text-left truncate">{meta?.label ?? metric}</span>
                                <span className="font-semibold text-right shrink-0">
                                  {formatTableValue(student, metric, meta?.precision, meta?.suffix)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {!noClasses && !noStudents && (
          <>
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Problem Difficulty Breakdown
                  </CardTitle>
                  <CardDescription>
                    Stacked view of Easy, Medium, and Hard problems solved by top students.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      easy: { label: "Easy", color: "hsl(140 70% 45%)" },
                      medium: { label: "Medium", color: "hsl(32 88% 55%)" },
                      hard: { label: "Hard", color: "hsl(350 78% 55%)" },
                    }}
                    className="aspect-auto h-[350px] w-full overflow-hidden rounded-xl border border-border/40 bg-background/70 p-4"
                  >
                    <BarChart data={difficultyChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="easy" stackId="a" fill="var(--color-easy)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="medium" stackId="a" fill="var(--color-medium)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="hard" stackId="a" fill="var(--color-hard)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Score Distribution
                  </CardTitle>
                  <CardDescription>
                    Comparative view of GitHub, LeetCode, and combined scores.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      github: { label: "GitHub Score", color: "hsl(210 98% 56%)" },
                      leetcode: { label: "LeetCode Score", color: "hsl(32 88% 55%)" },
                      combined: { label: "Combined Score", color: "hsl(var(--primary))" },
                    }}
                    className="aspect-auto h-[350px] w-full overflow-hidden rounded-xl border border-border/40 bg-background/70 p-4"
                  >
                    <LineChart data={scoreDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="github" stroke="var(--color-github)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="leetcode" stroke="var(--color-leetcode)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="combined" stroke="var(--color-combined)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Submission Analysis
                  </CardTitle>
                  <CardDescription>
                    Total submissions vs. solved problems with acceptance rate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      totalSubmissions: { label: "Total Submissions", color: "hsl(280 80% 60%)" },
                      totalSolved: { label: "Problems Solved", color: "hsl(140 70% 45%)" },
                    }}
                    className="aspect-auto h-[350px] w-full overflow-hidden rounded-xl border border-border/40 bg-background/70 p-4"
                  >
                    <BarChart data={submissionInsightsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value: any, name: string, props: any) => {
                          if (name === "totalSubmissions" || name === "totalSolved") {
                            return [value, name === "totalSubmissions" ? "Total Submissions" : "Problems Solved"];
                          }
                          return [value, name];
                        }}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="totalSubmissions" fill="var(--color-totalSubmissions)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="totalSolved" fill="var(--color-totalSolved)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    {submissionInsightsData.slice(0, 3).map((student, idx) => (
                      <div key={idx} className="rounded-lg bg-muted/50 p-2">
                        <div className="font-semibold text-xs text-muted-foreground">{student.name}</div>
                        <div className="text-lg font-bold text-primary">{student.acceptanceRate}%</div>
                        <div className="text-xs text-muted-foreground">Acceptance</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Holistic impact</CardTitle>
                  <CardDescription>
                    Radar chart normalised per metric for the top {effectiveTopN} students.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ChartContainer
                    config={radarConfig}
                    className="aspect-auto h-[350px] w-full rounded-xl border border-border/40 bg-background/70 p-4"
                  >
                    <RadarChart data={radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      {topStudents.map((student) => {
                        const dataKey = `student_${student.base.roll_number}`;
                        return (
                          <Radar
                            key={dataKey}
                            name={radarConfig[dataKey]?.label ?? dataKey}
                            dataKey={dataKey}
                            stroke={`var(--color-${dataKey})`}
                            fill={`var(--color-${dataKey})`}
                            fillOpacity={0.18}
                            strokeWidth={2}
                          />
                        );
                      })}
                    </RadarChart>
                  </ChartContainer>
                  
                  {}
                  <div className="flex flex-wrap gap-3 justify-center items-center pt-2 border-t border-border/40">
                    {topStudents.map((student, index) => {
                      const dataKey = `student_${student.base.roll_number}`;
                      
                      
                      const colorClasses = [
                        "bg-primary",        
                        "bg-blue-500",       
                        "bg-green-500",      
                        "bg-purple-500",     
                        "bg-orange-500",     
                        "bg-red-500",        
                        "bg-cyan-500",       
                        "bg-pink-500",       
                        "bg-yellow-500",     
                        "bg-teal-500",       
                        "bg-indigo-500",     
                        "bg-lime-500",       
                        "bg-rose-500",       
                        "bg-violet-500",     
                        "bg-amber-500",      
                      ];
                      
                      const colorClass = colorClasses[index % colorClasses.length];
                      
                      return (
                        <div
                          key={dataKey}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div
                            className={`w-3 h-3 rounded-sm shrink-0 ${colorClass}`}
                          />
                          <span className="text-xs font-medium whitespace-nowrap">
                            {radarConfig[dataKey]?.label ?? student.base.name.split(" ")[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">GitHub momentum</CardTitle>
                  <CardDescription>
                    Contributions, followers, and public repos in the past {HISTORY_WINDOW_DAYS} days.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      contributions: { label: "Contributions", color: "hsl(var(--primary))" },
                      followers: { label: "Followers", color: "hsl(210 98% 56%)" },
                      publicRepos: { label: "Public Repos", color: "hsl(140 70% 45%)" },
                    }}
                    className="aspect-auto h-[300px] w-full overflow-hidden rounded-xl border border-border/40 bg-background/70 p-4"
                  >
                    <BarChart data={githubChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="contributions" fill="var(--color-contributions)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="followers" fill="var(--color-followers)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="publicRepos" fill="var(--color-publicRepos)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">LeetCode grind</CardTitle>
                  <CardDescription>
                    Total submissions (all-time), problems solved, and active streaks.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      submissions: { label: "Total Submissions", color: "hsl(var(--warning))" },
                      solved: { label: "Solved", color: "hsl(32 88% 55%)" },
                      streak: { label: "Current Streak", color: "hsl(350 78% 55%)" },
                    }}
                    className="aspect-auto h-[300px] w-full overflow-hidden rounded-xl border border-border/40 bg-background/70 p-4"
                  >
                    <BarChart data={leetcodeChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="submissions" fill="var(--color-submissions)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="solved" fill="var(--color-solved)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="streak" fill="var(--color-streak)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
        </div>
      </div>
      
      {}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedTable={selectedClass || ''}
      />
      
      <CompareStudentsModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        students={students}
      />
    </div>
  );
};

export default StatsPage;
