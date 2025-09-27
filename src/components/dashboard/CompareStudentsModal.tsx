import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Student, apiService } from "@/services/api";
import { Users, GitBranch, Star, Folder, Target, Trophy, Flame, Calendar, Github, Code2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar as RangeCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DateRange } from "react-day-picker";

interface CompareStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
}

type WithHist = Pick<
  Student,
  | "name"
  | "roll_number"
  | "github_username"
  | "leetcode_username"
  | "git_followers"
  | "git_public_repo"
  | "git_authored_repo"
  | "lc_total_solved"
  | "lc_ranking"
  | "lc_cur_streak"
  | "lc_max_streak"
  | "gh_contribution_history"
  | "lc_submission_history"
>;

type StudentWithClass = WithHist & { table_name: string };

type RangeKey = '7d' | '14d' | '30d' | '365d' | 'all' | 'custom';

const computeSeries = (
  hist: Record<string, number> | undefined,
  range: RangeKey,
  customRange?: DateRange,
) => {
  const DAY_MS = 86400000;
  const today = new Date();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const map = new Map<string, number>();
  if (hist) {
    for (const [k, v] of Object.entries(hist)) {
      const d = new Date(k);
      if (!Number.isNaN(d.getTime())) {
        const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
        const n = Number(v);
        if (Number.isFinite(n)) map.set(key, n);
      }
    }
  }

  // Determine range
  let start: Date | null = null;
  let end: Date | null = null;

  if (range === '7d') {
    start = new Date(endOfToday.getTime() - 6 * DAY_MS);
    end = endOfToday;
  } else if (range === '14d') {
    start = new Date(endOfToday.getTime() - 13 * DAY_MS);
    end = endOfToday;
  } else if (range === '30d') {
    start = new Date(endOfToday.getTime() - 29 * DAY_MS);
    end = endOfToday;
  } else if (range === '365d') {
    start = new Date(endOfToday.getTime() - 364 * DAY_MS);
    end = endOfToday;
  } else if (range === 'custom') {
    if (!customRange?.from && !customRange?.to) {
      // default last 7 days
      start = new Date(endOfToday.getTime() - 6 * DAY_MS);
      end = endOfToday;
    } else {
      const s = customRange?.from ? new Date(customRange.from) : null;
      const e = customRange?.to ? new Date(customRange.to) : (customRange?.from ? new Date(customRange.from) : null);
      start = s ? new Date(s.getFullYear(), s.getMonth(), s.getDate()) : null;
      end = e ? new Date(e.getFullYear(), e.getMonth(), e.getDate()) : null;
    }
    // Clamp to today
    if (end && end > endOfToday) end = endOfToday;
    if (start && start > endOfToday) start = endOfToday;
  } else if (range === 'all') {
    // overall from first date to last date in hist
    const keys = [...map.keys()].sort();
    if (keys.length) {
      start = new Date(keys[0]);
      end = new Date(keys[keys.length - 1]);
    } else {
      return [] as { date: string; count: number }[];
    }
  }

  if (!start || !end) return [] as { date: string; count: number }[];

  const out: { date: string; count: number }[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const d = new Date(t);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: map.get(key) ?? 0 });
  }
  return out;
};

const CompareStudentsModal: React.FC<CompareStudentsModalProps> = ({ isOpen, onClose, students }) => {
  const [query, setQuery] = useState("");
  // composite ids: `${class}:${roll}` to support All-classes mode
  const [selected, setSelected] = useState<string[]>([]);
  const [range, setRange] = useState<RangeKey>('30d');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const isMobile = useIsMobile();

  // Derive available class names from students; fallback to single 'All' if unknown
  // Available classes are fetched; default to All
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const classNames = useMemo(() => ["All", ...availableClasses], [availableClasses]);

  const [selectedClass, setSelectedClass] = useState<string>("All");

  // Internal data store: class -> students
  const [dataByClass, setDataByClass] = useState<Record<string, StudentWithClass[]>>({});
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Load classes when modal opens
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isOpen) return;
      setLoadingClasses(true);
      try {
        const resp = await apiService.getAvailableTables();
        const classes = resp.tables || [];
        if (!cancelled) setAvailableClasses(classes);
      } finally {
        if (!cancelled) setLoadingClasses(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Load students for selected class or all classes
  useEffect(() => {
    let cancelled = false;
    const loadForClass = async (cls: string) => {
      try {
        const list = await apiService.getStudentData(cls);
        const mapped: StudentWithClass[] = list.map((s) => ({
          name: s.name,
          roll_number: s.roll_number,
          github_username: s.github_username,
          leetcode_username: s.leetcode_username,
          git_followers: s.git_followers,
          git_public_repo: s.git_public_repo,
          git_authored_repo: s.git_authored_repo,
          lc_total_solved: s.lc_total_solved,
          lc_ranking: s.lc_ranking,
          lc_cur_streak: s.lc_cur_streak,
          lc_max_streak: s.lc_max_streak,
          gh_contribution_history: s.gh_contribution_history,
          lc_submission_history: s.lc_submission_history,
          table_name: cls,
        }));
        return mapped;
      } catch {
        return [] as StudentWithClass[];
      }
    };

    const run = async () => {
      if (!isOpen || availableClasses.length === 0) return;
      setLoadingStudents(true);
      try {
        if (selectedClass === 'All') {
          const results = await Promise.all(
            availableClasses.map(async (cls) => {
              if (dataByClass[cls]) return [cls, dataByClass[cls]] as const;
              const data = await loadForClass(cls);
              return [cls, data] as const;
            })
          );
          if (cancelled) return;
          const next: Record<string, StudentWithClass[]> = { ...dataByClass };
          for (const [cls, arr] of results) next[cls] = arr;
          setDataByClass(next);
        } else {
          if (!dataByClass[selectedClass]) {
            const data = await loadForClass(selectedClass);
            if (cancelled) return;
            setDataByClass((prev) => ({ ...prev, [selectedClass]: data }));
          }
        }
      } finally {
        if (!cancelled) setLoadingStudents(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isOpen, selectedClass, availableClasses]);

  // Build groups for UI
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s: StudentWithClass) =>
      [s.name, String(s.roll_number), s.github_username, s.leetcode_username]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));

    if (selectedClass === 'All') {
      return availableClasses.map((cls) => ({
        className: cls,
        items: (dataByClass[cls] || []).filter(match),
      })).filter((g) => g.items.length > 0);
    }
    return [{ className: selectedClass, items: (dataByClass[selectedClass] || []).filter(match) }];
  }, [query, selectedClass, availableClasses, dataByClass]);

  const canCompare = selected.length >= 2 && selected.length <= 3;
  const columnsClass = selected.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";

  const idMap = useMemo(() => {
    const map = new Map<string, StudentWithClass>();
    for (const cls of Object.keys(dataByClass)) {
      for (const s of dataByClass[cls] || []) {
        map.set(`${cls}:${s.roll_number}`, s);
      }
    }
    return map;
  }, [dataByClass]);

  const selectedStudents: StudentWithClass[] = useMemo(
    () => selected.map((id) => idMap.get(id)).filter(Boolean) as StudentWithClass[],
    [idMap, selected]
  );

  const toggle = (cls: string, roll: number) => {
    const id = `${cls}:${roll}`;
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((r) => r !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };

  const formatRangeTag = (r: RangeKey, cr?: DateRange) => {
    switch (r) {
      case '7d':
        return '7d';
      case '14d':
        return '14d';
      case '30d':
        return '30d';
      case '365d':
        return '1y';
      case 'all':
        return 'Overall';
      case 'custom': {
        if (!cr?.from && !cr?.to) return 'Custom';
        const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: '2-digit' };
        const from = cr?.from ? cr.from.toLocaleDateString(undefined, opts) : '';
        const to = cr?.to ? cr.to.toLocaleDateString(undefined, opts) : from;
        return from && to ? `${from} — ${to}` : from || 'Custom';
      }
      default:
        return '';
    }
  };

  // Auto-clear selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelected([]);
      setQuery("");
      setSelectedClass("All");
      setCustomRange(undefined);
      setRange('30d');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto p-3 sm:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Compare Students</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Class Filter + Range Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Class Selector */}
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {classNames.map((c) => (
                  <SelectItem key={c} value={c}>{c === 'All' ? 'All classes' : c.replace(/_/g,' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={range} onValueChange={(v: RangeKey) => setRange(v)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 14 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="365d">Last 1 year</SelectItem>
                <SelectItem value="all">Overall</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {range === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    <Calendar className="h-4 w-4 mr-2" />
                    Pick dates
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" side="bottom" sideOffset={8} className="p-0 w-auto max-w-[90vw] overflow-auto">
                  <RangeCalendar
                    mode="range"
                    selected={customRange}
                    onSelect={setCustomRange}
                    numberOfMonths={isMobile ? 1 : 2}
                    toDate={new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
          {/* Selection Controls */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">Select 2 to 3 students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {selectedStudents.map((s) => (
                  <Badge key={`${s.table_name}:${s.roll_number}`} variant="secondary" className="flex items-center gap-2">
                    <span className="truncate max-w-[10rem]">{s.name}</span>
                    <Button size="sm" variant="ghost" onClick={() => toggle(s.table_name, s.roll_number)} className="h-6 px-2 py-0">✕</Button>
                  </Badge>
                ))}
                {selected.length === 0 && (
                  <span className="text-xs text-muted-foreground">No students selected</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, roll, GitHub, or LeetCode"
                  className="flex-1"
                />
              </div>
              <div className="max-h-[35vh] overflow-y-auto rounded-md border p-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {loadingClasses || loadingStudents ? (
                  <div className="text-sm text-muted-foreground p-2">Loading...</div>
                ) : groups.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">No matches</div>
                ) : (
                  <div className="space-y-3">
                    {groups.map((group) => (
                      <div key={group.className}>
                        {selectedClass === 'All' && (
                          <div className="px-1 py-1 text-xs font-semibold text-muted-foreground/80">
                            {group.className.replace(/_/g, ' ')}
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {group.items.map((s) => {
                            const id = `${s.table_name}:${s.roll_number}`;
                            const checked = selected.includes(id);
                            const disabled = !checked && selected.length >= 3;
                            return (
                              <label
                                key={id}
                                className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer ${
                                  disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
                                }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (!disabled) toggle(s.table_name, s.roll_number);
                                }}
                              >
                                <Checkbox checked={checked} onCheckedChange={() => !disabled && toggle(s.table_name, s.roll_number)} />
                                <div className="min-w-0">
                                  <div className="font-medium text-sm truncate">{s.name} <span className="text-muted-foreground">• {s.roll_number}</span></div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    @{s.github_username || "—"} • @{s.leetcode_username || "—"}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!canCompare && (
                <div className="text-xs text-muted-foreground">Pick 2 to 3 students to compare</div>
              )}
            </CardContent>
          </Card>

          {/* Comparison */}
          {canCompare && (
            <div className={`grid grid-cols-1 ${columnsClass} gap-4`}>
              {selectedStudents.map((s) => {
                const gh30 = computeSeries(s.gh_contribution_history, range, customRange);
                const lc30 = computeSeries(s.lc_submission_history, range, customRange);
                return (
                  <div key={s.roll_number} className="space-y-4">
                    <Card className="bg-gradient-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base truncate">{s.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="text-muted-foreground">Roll: {s.roll_number}</div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!s.github_username}
                            onClick={() => s.github_username && window.open(`https://github.com/${s.github_username}`, '_blank')}
                          >
                            <Github className="h-4 w-4 mr-2 sm:mr-2" />
                            <span className="hidden sm:inline">GitHub Profile</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!s.leetcode_username}
                            onClick={() => s.leetcode_username && window.open(`https://leetcode.com/${s.leetcode_username}`, '_blank')}
                          >
                            <Code2 className="h-4 w-4 mr-2 sm:mr-2" />
                            <span className="hidden sm:inline">LeetCode Profile</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <CardHeader className="pb-1">
                          <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> GitHub</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Followers</span>
                            <span className="font-medium">{s.git_followers ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Public Repos</span>
                            <span className="font-medium">{s.git_public_repo ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Forked Authored</span>
                            <span className="font-medium">{s.git_authored_repo ?? 0}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-1">
                          <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> LeetCode</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Solved</span>
                            <span className="font-medium">{s.lc_total_solved ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Rank</span>
                            <span className="font-medium">{s.lc_ranking ?? "N/A"}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Streak</span>
                            <span className="font-medium">{s.lc_cur_streak ?? 0} / {s.lc_max_streak ?? 0}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-1">
                        <CardTitle className="text-sm flex items-center gap-2"><GitBranch className="h-4 w-4" /> GitHub ({formatRangeTag(range, customRange)})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{ contributions: { label: "Contributions", color: "hsl(var(--primary))" } }}
                          className="h-[120px] sm:h-[160px] w-full overflow-hidden rounded-md"
                        >
                          <LineChart data={gh30} margin={{ left: 12, right: 12, top: 6 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="count" stroke="var(--color-contributions)" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-1">
                        <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> LeetCode ({formatRangeTag(range, customRange)})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{ submissions: { label: "Submissions", color: "hsl(var(--warning))" } }}
                          className="h-[120px] sm:h-[160px] w-full overflow-hidden rounded-md"
                        >
                          <LineChart data={lc30} margin={{ left: 12, right: 12, top: 6 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="count" stroke="var(--color-submissions)" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompareStudentsModal;
