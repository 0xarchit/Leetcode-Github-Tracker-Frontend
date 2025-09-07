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

  const badges = student.git_badges ? student.git_badges.split(',').filter(badge => badge.trim()) : [];

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-gray-900 to-gray-700 rounded-lg flex items-center justify-center">
              <Github className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <span>GitHub Profile</span>
              <p className="text-sm font-normal text-muted-foreground mt-1">
                {student.name} • @{student.github_username}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://github.com/${student.github_username}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">{student.git_followers}</span>
                </div>
                <p className="text-sm text-muted-foreground">Followers</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <UserPlus className="h-5 w-5 text-secondary" />
                  <span className="text-2xl font-bold text-secondary">{student.git_following}</span>
                </div>
                <p className="text-sm text-muted-foreground">Following</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Folder className="h-5 w-5 text-accent" />
                  <span className="text-2xl font-bold text-accent">{student.git_public_repo}</span>
                </div>
                <p className="text-sm text-muted-foreground">Public Repos</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-warning" />
                  <span className="text-2xl font-bold text-warning">{student.git_authored_repo}</span>
                </div>
                <p className="text-sm text-muted-foreground">Authored</p>
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
                  <Badge variant="outline">{student.git_original_repo}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Authored Repositories:</span>
                  <Badge variant="outline">{student.git_authored_repo}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Public:</span>
                  <Badge variant="outline">{student.git_public_repo}</Badge>
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
                    {getDaysAgo(student.last_commit_date)} days ago
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