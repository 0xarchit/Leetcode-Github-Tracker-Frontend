import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Github,
  Code2,
  Search,
  SortAsc,
  SortDesc,
  Trophy,
  GitCommit,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Student } from "@/services/api";
import {
  detectSuspiciousActivities,
  formatSuspiciousReason,
} from "@/utils/suspiciousDetector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StudentTableProps {
  students: Student[];
  onOpenGithubDetails: (student: Student) => void;
  onOpenLeetcodeDetails: (student: Student) => void;
  readOnly?: boolean;
  selectedTable?: string | null;
}

type SortField =
  | "name"
  | "roll_number"
  | "lc_total_solved"
  | "lc_cur_streak"
  | "lc_max_streak"
  | "lc_ranking"
  | "last_commit_date"
  | "lc_lastsubmission"
  | "section";
type SortDirection = "asc" | "desc";

const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onOpenGithubDetails,
  onOpenLeetcodeDetails,
  readOnly = false,
  selectedTable = null,
}) => {
  const ALL_CLASSES_KEY = "__all_classes__";
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterBy, setFilterBy] = useState<"all" | "active" | "inactive">(
    "all"
  );

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.roll_number.toString().includes(searchTerm) ||
        (student.section &&
          student.section.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filterBy === "active") {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      filtered = filtered.filter((student) => {
        const lastSubmission = new Date(student.lc_lastsubmission);
        return lastSubmission >= threeDaysAgo;
      });
    } else if (filterBy === "inactive") {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      filtered = filtered.filter((student) => {
        const lastSubmission = new Date(student.lc_lastsubmission);
        return lastSubmission < threeDaysAgo;
      });
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (
        sortField === "last_commit_date" ||
        sortField === "lc_lastsubmission"
      ) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortField === "lc_ranking") {
        const aNum = Number(aValue);
        const bNum = Number(bValue);
        const aMissing = !Number.isFinite(aNum) || aNum <= 0;
        const bMissing = !Number.isFinite(bNum) || bNum <= 0;
        if (aMissing && bMissing) return 0;
        if (aMissing) return 1;
        if (bMissing) return -1;
        aValue = aNum;
        bValue = bNum;
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [students, searchTerm, sortField, sortDirection, filterBy]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getActivityStatus = (lastSubmission: string) => {
    const daysAgo = getDaysAgo(lastSubmission);
    if (daysAgo <= 1) return { status: "active", color: "success" };
    if (daysAgo <= 3) return { status: "moderate", color: "warning" };
    return { status: "inactive", color: "destructive" };
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <SortAsc className="h-4 w-4 ml-1" />
    ) : (
      <SortDesc className="h-4 w-4 ml-1" />
    );
  };

  return (
    <Card className="bg-gradient-card shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span>Student Performance Dashboard</span>
        </CardTitle>

        {}
        <div className="flex flex-col gap-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Select
              value={filterBy}
              onValueChange={(value: any) => setFilterBy(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="active">Active (≤3 days)</SelectItem>
                <SelectItem value="inactive">Inactive (&gt;3 days)</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sortField}-${sortDirection}`}
              onValueChange={(value: string) => {
                const [field, direction] = value.split("-");
                setSortField(field as SortField);
                setSortDirection(direction as SortDirection);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lc_total_solved-desc">
                  LC Solved (High to Low)
                </SelectItem>
                <SelectItem value="lc_cur_streak-desc">
                  Current Streak (High to Low)
                </SelectItem>
                <SelectItem value="lc_max_streak-desc">
                  Max Streak (High to Low)
                </SelectItem>
                <SelectItem value="lc_ranking-asc">
                  LC Ranking (Best to Worst)
                </SelectItem>
                <SelectItem value="lc_ranking-desc">
                  LC Ranking (Worst to Best)
                </SelectItem>
                <SelectItem value="last_commit_date-desc">
                  Recent Commits
                </SelectItem>
                <SelectItem value="name-asc">Name (A to Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredAndSortedStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="rounded-lg border border-table-border overflow-hidden">
            <div className="overflow-auto relative max-h-[calc(100vh-300px)]">
              <table className="w-full caption-bottom text-sm min-w-full">
                <thead className="sticky top-0 z-20 bg-table-header border-b shadow-sm">
                  <tr className="bg-table-header hover:bg-table-header border-b">
                    <th
                      className="h-12 px-4 text-center w-14 min-w-[56px] align-middle font-medium text-muted-foreground sticky left-0 z-30 border-r border-table-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      style={{ backgroundColor: "hsl(var(--table-header))" }}
                    >
                      Sr No.
                    </th>
                    <th
                      className="h-12 px-4 cursor-pointer select-none min-w-[150px] text-left align-middle font-medium text-muted-foreground sticky left-14 z-30 border-r border-table-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      onClick={() => handleSort("name")}
                      style={{ backgroundColor: "hsl(var(--table-header))" }}
                    >
                      <div className="flex items-center">
                        Name
                        <SortIcon field="name" />
                      </div>
                    </th>
                    {selectedTable === ALL_CLASSES_KEY && (
                      <th
                        className="h-12 px-4 cursor-pointer select-none min-w-[120px] text-left align-middle font-medium text-muted-foreground"
                        onClick={() => handleSort("section")}
                      >
                        <div className="flex items-center">
                          Section
                          <SortIcon field="section" />
                        </div>
                      </th>
                    )}
                    <th
                      className="h-12 px-4 cursor-pointer select-none min-w-[120px] text-left align-middle font-medium text-muted-foreground"
                      onClick={() => handleSort("roll_number")}
                    >
                      <div className="flex items-center">
                        Roll
                        <SortIcon field="roll_number" />
                      </div>
                    </th>
                    <th
                      className="h-12 px-4 cursor-pointer select-none text-center min-w-[120px] align-middle font-medium text-muted-foreground"
                      onClick={() => handleSort("lc_total_solved")}
                    >
                      <div className="flex items-center justify-center">
                        LC Solved
                        <SortIcon field="lc_total_solved" />
                      </div>
                    </th>
                    <th
                      className="h-12 px-4 cursor-pointer select-none text-center min-w-[120px] align-middle font-medium text-muted-foreground"
                      onClick={() => handleSort("lc_ranking")}
                    >
                      <div className="flex items-center justify-center">
                        LC Rank
                        <SortIcon field="lc_ranking" />
                      </div>
                    </th>
                    <th
                      className="h-12 px-4 cursor-pointer select-none text-center min-w-[120px] align-middle font-medium text-muted-foreground"
                      onClick={() => handleSort("lc_lastsubmission")}
                    >
                      <div className="flex items-center justify-center">
                        LC Activity
                        <SortIcon field="lc_lastsubmission" />
                      </div>
                    </th>
                    <th
                      className="h-12 px-4 cursor-pointer select-none text-center min-w-[120px] align-middle font-medium text-muted-foreground"
                      onClick={() => handleSort("last_commit_date")}
                    >
                      <div className="flex items-center justify-center">
                        Git Commit
                        <SortIcon field="last_commit_date" />
                      </div>
                    </th>
                    {!readOnly && (
                      <th className="h-12 px-4 text-center min-w-[100px] align-middle font-medium text-muted-foreground">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredAndSortedStudents.map((student, index) => {
                    const activityStatus = getActivityStatus(
                      student.lc_lastsubmission
                    );
                    const isEvenRow = index % 2 === 0;
                    const bgColor = isEvenRow
                      ? "hsl(var(--table-row-even))"
                      : "hsl(var(--table-row-odd))";

                    return (
                      <tr
                        key={student.roll_number}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td
                          className="p-4 align-middle text-center text-muted-foreground sticky left-0 z-10 border-r border-table-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                          style={{ backgroundColor: bgColor }}
                        >
                          {index + 1}
                        </td>
                        <td
                          className="p-4 align-middle font-medium sticky left-14 z-10 border-r border-table-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                          style={{ backgroundColor: bgColor }}
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              {student.name.replace(
                                /\w\S*/g,
                                (w) =>
                                  w.charAt(0).toUpperCase() +
                                  w.slice(1).toLowerCase()
                              )}
                            </span>
                            {(() => {
                              const suspiciousActivities =
                                detectSuspiciousActivities(student);
                              if (suspiciousActivities.length > 0) {
                                return (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant="outline"
                                          className="bg-destructive/10 text-destructive border-destructive/30 cursor-help shrink-0"
                                        >
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          SUS
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <div className="space-y-1">
                                          <p className="font-semibold text-xs">
                                            Suspicious Activity Detected:
                                          </p>
                                          {suspiciousActivities.map(
                                            (activity, idx) => (
                                              <p key={idx} className="text-xs">
                                                • {activity.reason}
                                              </p>
                                            )
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </td>
                        {selectedTable === ALL_CLASSES_KEY && (
                          <td className="p-4 align-middle text-sm">
                            <Badge variant="secondary" className="text-xs">
                              {student.section || "Unknown"}
                            </Badge>
                          </td>
                        )}
                        <td className="p-4 align-middle font-mono text-sm">
                          {student.roll_number}
                        </td>
                        <td className="p-4 align-middle text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <span className="font-bold text-lg text-primary">
                              {student.lc_total_solved}
                            </span>
                            <div className="flex space-x-1">
                              <Badge variant="outline" className="text-xs">
                                E: {student.lc_easy}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                M: {student.lc_medium}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                H: {student.lc_hard}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <span className="font-semibold">
                              {(() => {
                                const n = Number(student.lc_ranking);
                                if (Number.isFinite(n) && n > 0) {
                                  return `#${Math.round(n).toLocaleString(
                                    "en-US"
                                  )}`;
                                }
                                return "—";
                              })()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <Badge
                              variant={
                                activityStatus.color === "success"
                                  ? "default"
                                  : activityStatus.color === "warning"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {getDaysAgo(student.lc_lastsubmission)}d ago
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Streak: {student.lc_cur_streak}/
                              {student.lc_max_streak}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-sm">
                              {formatDate(student.last_commit_date)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getDaysAgo(student.last_commit_date)}d ago
                            </span>
                          </div>
                        </td>
                        {!readOnly && (
                          <td className="p-4 align-middle text-center">
                            <div className="flex justify-center flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenGithubDetails(student)}
                                className="hover:bg-primary hover:text-primary-foreground transition-fast"
                              >
                                <Github className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenLeetcodeDetails(student)}
                                className="hover:bg-warning hover:text-warning-foreground transition-fast"
                              >
                                <Code2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentTable;
