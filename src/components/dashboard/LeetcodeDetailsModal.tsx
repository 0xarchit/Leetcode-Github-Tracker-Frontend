import React from 'react';
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

  const languages = student.lc_language ? student.lc_language.split(',').map(lang => lang.trim()) : [];
  const badges = student.lc_badges && student.lc_badges !== '0' ? student.lc_badges.split(',').filter(badge => badge.trim()) : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
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

  const formatRanking = (ranking: number) => {
    return ranking.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <span>LeetCode Profile</span>
              <p className="text-sm font-normal text-muted-foreground mt-1">
                {student.name} • @{student.leetcode_username}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://leetcode.com/${student.leetcode_username}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">{student.lc_total_solved}</span>
                </div>
                <p className="text-sm text-muted-foreground">Total Solved</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  <span className="text-2xl font-bold text-warning">{formatRanking(student.lc_ranking)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Ranking</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Flame className="h-5 w-5 text-destructive" />
                  <span className="text-2xl font-bold text-destructive">{student.lc_cur_streak}</span>
                </div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <span className="text-2xl font-bold text-accent">{student.lc_max_streak}</span>
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
                      {student.lc_easy}
                    </Badge>
                  </div>
                  <Progress 
                    value={(student.lc_easy / student.lc_total_solved) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-warning">Medium</span>
                    <Badge variant="outline" className="text-warning border-warning">
                      {student.lc_medium}
                    </Badge>
                  </div>
                  <Progress 
                    value={(student.lc_medium / student.lc_total_solved) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-destructive">Hard</span>
                    <Badge variant="outline" className="text-destructive border-destructive">
                      {student.lc_hard}
                    </Badge>
                  </div>
                  <Progress 
                    value={(student.lc_hard / student.lc_total_solved) * 100} 
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
                    {getDaysAgo(student.lc_lastsubmission)} days ago
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Accepted:</p>
                  <p className="font-medium">{formatDate(student.lc_lastacceptedsubmission)}</p>
                  <p className="text-xs text-muted-foreground">
                    {getDaysAgo(student.lc_lastacceptedsubmission)} days ago
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