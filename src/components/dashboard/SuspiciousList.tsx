import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Code2, GitCommit } from "lucide-react";
import { Student } from "@/services/api";
import { getSuspiciousStudents } from "@/utils/suspiciousDetector";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SuspiciousListProps {
  students: Student[];
  onStudentClick?: (student: Student) => void;
}

const SuspiciousList: React.FC<SuspiciousListProps> = ({
  students,
  onStudentClick,
}) => {
  const suspiciousStudents = useMemo(() => {
    return getSuspiciousStudents(students);
  }, [students]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "leetcode_submissions":
        return <Code2 className="h-4 w-4" />;
      case "leetcode_progress":
        return <TrendingUp className="h-4 w-4" />;
      case "github_commits":
        return <GitCommit className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "leetcode_submissions":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "leetcode_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "github_commits":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (suspiciousStudents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <span>Suspicious Activities</span>
          </CardTitle>
          <CardDescription>
            Monitoring unusual activity patterns in the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-success/10 p-3 mb-3">
              <AlertTriangle className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">
              No suspicious activities detected
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All students' activities are within normal ranges
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Suspicious Activities</span>
          </div>
          <Badge variant="destructive" className="ml-2">
            {suspiciousStudents.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Students with unusual activity in the last 24 hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {suspiciousStudents.map(({ student, activities }) => (
              <div
                key={student.roll_number}
                className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onStudentClick?.(student)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">
                        {student.name}
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-destructive/10 text-destructive border-destructive/30 shrink-0"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Suspicious
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Roll: {student.roll_number}
                      {student.section && ` • Section: ${student.section}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {activities.length}{" "}
                    {activities.length === 1 ? "flag" : "flags"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {activities.map((activity, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 p-2 rounded-md border ${getActivityColor(
                        activity.type
                      )}`}
                    >
                      <div className="mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{activity.reason}</p>
                        <p className="text-xs opacity-75 mt-0.5">
                          Threshold: {activity.threshold} • Detected:{" "}
                          {activity.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SuspiciousList;
