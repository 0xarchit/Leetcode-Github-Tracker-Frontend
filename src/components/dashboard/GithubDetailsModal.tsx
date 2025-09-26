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
import { 
  Github, 
  Users, 
  UserPlus, 
  Folder, 
  GitFork, 
  Star,
  Calendar,
  Award,
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

interface GithubDetailsModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const GithubDetailsModal: React.FC<GithubDetailsModalProps> = ({
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

  const ghData = useMemo(() => {
    const src = student.gh_contribution_history || {};
    const entries = Object.entries(src)
      .map(([k, v]) => [new Date(k), Number(v)] as const)
      .filter(([d, v]) => Number.isFinite(d.getTime()) && Number.isFinite(v))
      .sort((a, b) => a[0].getTime() - b[0].getTime());
    if (!entries.length) return [] as { date: string; count: number }[];
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;
    if (range === '7d') start = new Date(now.getTime() - 7 * 86400000);
    else if (range === '30d') start = new Date(now.getTime() - 30 * 86400000);
    else if (range === '365d') start = new Date(now.getTime() - 365 * 86400000);
    else if (range === 'custom') {
      // Default to last 7 days if no selection
      if (!customRange?.from && !customRange?.to) {
        end = new Date();
        start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6);
      } else {
        start = customRange?.from ? new Date(customRange.from) : null;
        end = customRange?.to ? new Date(customRange.to) : (customRange?.from ? new Date(customRange.from) : null);
      }
      // Clamp to today (no future dates)
      if (end && end > now) end = now;
      if (start && start > now) start = now;
    }
    return entries
      .filter(([d]) => (!start || d >= start) && (!end || d <= end || range !== 'custom'))
      .map(([d, v]) => ({ date: d.toISOString().slice(0, 10), count: v }));
  }, [student.gh_contribution_history, range, customRange]);

  const badges = student.git_badges && student.git_badges !== '0'
    ? student.git_badges.split(',').filter(badge => badge.trim())
    : [];

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
      day: 'numeric'
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

  const followers = toNumber(student.git_followers) ?? 0;
  const following = toNumber(student.git_following) ?? 0;
  const publicRepo = toNumber(student.git_public_repo) ?? 0;
  const authoredRepo = toNumber(student.git_authored_repo) ?? 0;
  const originalRepo = toNumber(student.git_original_repo) ?? 0;
  const hasUsername = !!student.github_username;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="w-[90vw] max-w-[90vw] sm:w-full sm:max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 sm:gap-3 sm:pr-10 flex-wrap">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-gray-900 to-gray-700 rounded-lg flex items-center justify-center shrink-0">
              <Github className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span>GitHub Profile</span>
              <p className="text-sm font-normal text-muted-foreground mt-1 truncate">
                {student.name}
                {hasUsername ? (
                  <>
                    {' '}
                    • @{student.github_username}
                  </>
                ) : (
                  <>
                    {' '}
                    • No GitHub handle
                  </>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mx-auto w-full sm:w-auto justify-center mt-2 sm:mt-0"
              onClick={() => hasUsername && window.open(`https://github.com/${student.github_username}`, '_blank')}
              disabled={!hasUsername}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contributions Chart */}
          <Card className="bg-gradient-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">GitHub Contributions</CardTitle>
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
                config={{ contributions: { label: 'Contributions', color: 'hsl(var(--primary))' } }}
                className="h-[160px] sm:h-[220px] w-full overflow-hidden rounded-md"
              >
                <LineChart data={ghData} margin={{ left: 12, right: 12, top: 6 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-contributions)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-gradient-card">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">{followers}</span>
                </div>
                <p className="text-sm text-muted-foreground">Followers</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <UserPlus className="h-5 w-5 text-secondary" />
                  <span className="text-2xl font-bold text-secondary">{following}</span>
                </div>
                <p className="text-sm text-muted-foreground">Following</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Folder className="h-5 w-5 text-accent" />
                  <span className="text-2xl font-bold text-accent">{publicRepo}</span>
                </div>
                <p className="text-sm text-muted-foreground">Public Repos</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-warning" />
                  <span className="text-2xl font-bold text-warning">{authoredRepo}</span>
                </div>
                <p className="text-sm text-muted-foreground">Forked Authored Repos</p>
              </CardContent>
            </Card>
          </div>

          {/* Repository Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <GitFork className="h-5 w-5" />
                  <span>Repository Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Original Repositories:</span>
                  <Badge variant="outline">{originalRepo}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Authored Repositories:</span>
                  <Badge variant="outline">{authoredRepo}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Public:</span>
                  <Badge variant="outline">{publicRepo}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Calendar className="h-5 w-5" />
                  <span>Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Commit Date:</p>
                  <p className="font-medium">{formatDate(student.last_commit_date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const d = getDaysAgo(student.last_commit_date);
                      return d === null ? 'No recent activity' : `${d} days ago`;
                    })()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Award className="h-5 w-5" />
                  <span>GitHub Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200"
                    >
                      {badge.trim().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

export default GithubDetailsModal;