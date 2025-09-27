import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Code2, 
  Trophy, 
  Target, 
  Flame,
  Calendar,
  Award,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { Student } from '@/services/api';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Calendar as RangeCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DateRange } from "react-day-picker";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface LeetcodeDetailsModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const LeetcodeDetailsModal: React.FC<LeetcodeDetailsModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  if (!student) return null;
  // Chart data prep
  type RangeKey = '7d' | '30d' | '365d' | 'all' | 'custom';
  const [range, setRange] = useState<RangeKey>('30d');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const isMobile = useIsMobile();

  const formatRangeLabel = (r?: DateRange) => {
    if (!r?.from && !r?.to) return 'Select dates';
    const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const from = r?.from ? r.from.toLocaleDateString(undefined, opts) : '';
    const to = r?.to ? r.to.toLocaleDateString(undefined, opts) : from;
    return from && to ? `${from} — ${to}` : from || 'Select dates';
  };

  const lcData = useMemo(() => {
    const DAY_MS = 86400000;
    const src = student.lc_submission_history || {};
    const parsed = Object.entries(src)
      .map(([k, v]) => {
        const d = new Date(k);
        return [new Date(d.getFullYear(), d.getMonth(), d.getDate()), Number(v)] as const;
      })
      .filter(([d, v]) => Number.isFinite(d.getTime()) && Number.isFinite(v))
      .sort((a, b) => a[0].getTime() - b[0].getTime());

    // Build a map for fast lookup by YYYY-MM-DD
    const valueByDate = new Map<string, number>();
    for (const [d, v] of parsed) {
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
      valueByDate.set(key, v);
    }

    // Determine range
    const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start: Date | null = null;
    let end: Date | null = null;

    if (range === '7d') {
      start = new Date(today.getTime() - 7 * DAY_MS);
      end = today;
    } else if (range === '30d') {
      start = new Date(today.getTime() - 30 * DAY_MS);
      end = today;
    } else if (range === '365d') {
      start = new Date(today.getTime() - 365 * DAY_MS);
      end = today;
    } else if (range === 'custom') {
      // Default to last 7 days if no selection
      if (!customRange?.from && !customRange?.to) {
        end = today;
        start = new Date(today.getTime() - 6 * DAY_MS);
      } else {
        const s = customRange?.from ? new Date(customRange.from) : null;
        const e = customRange?.to ? new Date(customRange.to) : (customRange?.from ? new Date(customRange.from) : null);
        start = s ? new Date(s.getFullYear(), s.getMonth(), s.getDate()) : null;
        end = e ? new Date(e.getFullYear(), e.getMonth(), e.getDate()) : null;
      }
      // Clamp to today (no future dates)
      if (end && end > today) end = today;
      if (start && start > today) start = today;
    } else if (range === 'all') {
      if (parsed.length) {
        start = parsed[0][0];
        end = parsed[parsed.length - 1][0];
      } else {
        return [] as { date: string; count: number }[];
      }
    }

    if (!start || !end) return [] as { date: string; count: number }[];

    // Build continuous daily series, fill missing dates with 0
    const out: { date: string; count: number }[] = [];
    for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
      const d = new Date(t);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, count: valueByDate.get(key) ?? 0 });
    }
    return out;
  }, [student.lc_submission_history, range, customRange]);

  const languages = student.lc_language ? student.lc_language.split(',').map(lang => lang.trim()) : [];
  const badges = student.lc_badges && student.lc_badges !== '0' ? student.lc_badges.split(',').filter(badge => badge.trim()) : [];

  const toNumber = (val: unknown): number | null => {
    if (val === null || val === undefined) return null;
    const n = typeof val === 'number' ? val : Number(val);
    return Number.isFinite(n) ? n : null;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysAgo = (dateString?: string | null): number | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date();
    // Set both dates to start of day to get accurate day difference
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success';
      case 'medium': return 'bg-warning';
      case 'hard': return 'bg-destructive';
      default: return 'bg-primary';
    }
  };

  const formatRanking = (ranking: unknown) => {
    const n = toNumber(ranking);
    return n === null ? 'N/A' : n.toLocaleString();
  };

  const totalSolved = toNumber(student.lc_total_solved) ?? 0;
  const easy = Math.max(0, toNumber(student.lc_easy) ?? 0);
  const medium = Math.max(0, toNumber(student.lc_medium) ?? 0);
  const hard = Math.max(0, toNumber(student.lc_hard) ?? 0);
  const easyPct = totalSolved > 0 ? (easy / totalSolved) * 100 : 0;
  const mediumPct = totalSolved > 0 ? (medium / totalSolved) * 100 : 0;
  const hardPct = totalSolved > 0 ? (hard / totalSolved) * 100 : 0;
  const hasUsername = !!student.leetcode_username;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="w-[90vw] max-w-[90vw] sm:w-full sm:max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 sm:gap-3 sm:pr-10 flex-wrap">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center shrink-0">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span>LeetCode Profile</span>
              <p className="text-sm font-normal text-muted-foreground mt-1 truncate">
                {student.name}
                {hasUsername ? (
                  <>
                    {' '}
                    • @{student.leetcode_username}
                  </>
                ) : (
                  <>
                    {' '}
                    • No LeetCode handle
                  </>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mx-auto w-full sm:w-auto justify-center mt-2 sm:mt-0"
              onClick={() => hasUsername && window.open(`https://leetcode.com/u/${student.leetcode_username}`, '_blank')}
              disabled={!hasUsername}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submissions Chart */}
          <Card className="bg-gradient-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">LeetCode Submissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={range} onValueChange={(v: RangeKey) => setRange(v)}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="365d">Last 1 year</SelectItem>
                    <SelectItem value="all">Overall</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {range === 'custom' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button aria-label="Pick custom date range" variant="outline" size="sm" className="whitespace-nowrap max-w-full sm:max-w-none overflow-hidden text-ellipsis">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatRangeLabel(customRange)}
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
              <ChartContainer
                config={{ submissions: { label: 'Submissions', color: 'hsl(var(--warning))' } }}
                className="h-[160px] sm:h-[220px] w-full overflow-hidden rounded-md"
              >
                <LineChart data={lcData} margin={{ left: 12, right: 12, top: 6 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-submissions)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-gradient-card">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">{totalSolved}</span>
                </div>
                <p className="text-sm text-muted-foreground">Total Solved</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  <span className="text-2xl font-bold text-warning">{formatRanking(student.lc_ranking)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Ranking</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Flame className="h-5 w-5 text-destructive" />
                  <span className="text-2xl font-bold text-destructive">{toNumber(student.lc_cur_streak) ?? 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <span className="text-2xl font-bold text-accent">{toNumber(student.lc_max_streak) ?? 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">Max Streak</p>
              </CardContent>
            </Card>
          </div>

          {/* Problem Difficulty Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Target className="h-5 w-5" />
                <span>Problems Solved by Difficulty</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-success">Easy</span>
                    <Badge variant="outline" className="text-success border-success">
                      {easy}
                    </Badge>
                  </div>
                  <Progress 
                    value={easyPct} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-warning">Medium</span>
                    <Badge variant="outline" className="text-warning border-warning">
                      {medium}
                    </Badge>
                  </div>
                  <Progress 
                    value={mediumPct} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-destructive">Hard</span>
                    <Badge variant="outline" className="text-destructive border-destructive">
                      {hard}
                    </Badge>
                  </div>
                  <Progress 
                    value={hardPct} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity & Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Calendar className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Submission:</p>
                  <p className="font-medium">{formatDate(student.lc_lastsubmission)}</p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const d = getDaysAgo(student.lc_lastsubmission);
                      return d === null ? 'No recent activity' : `${d} days ago`;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Accepted:</p>
                  <p className="font-medium">{formatDate(student.lc_lastacceptedsubmission)}</p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const d = getDaysAgo(student.lc_lastacceptedsubmission);
                      return d === null ? 'No recent activity' : `${d} days ago`;
                    })()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Code2 className="h-5 w-5" />
                  <span>Programming Languages</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {languages.map((language, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200"
                      >
                        {language}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No languages specified</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Award className="h-5 w-5" />
                  <span>LeetCode Badges</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border-orange-200"
                    >
                      {badge.trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeetcodeDetailsModal;