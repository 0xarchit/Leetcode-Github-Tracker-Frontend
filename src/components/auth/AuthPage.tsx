import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GraduationCap } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [available, setAvailable] = useState<string[]>([]);

  const flowType = useMemo(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash || window.location.search);
    return (params.get('type') || '').toLowerCase();
  }, []);

  useEffect(() => {
    if (flowType === 'recovery' || flowType === 'invite') {
      navigate('/auth/update-password', { replace: true });
    }
  }, [flowType, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.getAvailableTables();
        setAvailable(res.tables || []);
      } catch {
        
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dashboard-content to-primary-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Student Tracker</h1>
          <p className="text-muted-foreground mt-2">Admin & Teacher Dashboard</p>
        </div>

        <div className="flex justify-center mb-6">
          <ThemeToggle />
        </div>

        <Card className="shadow-xl bg-gradient-card border-0">
          <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access the student tracking dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@school.edu"
                  required
                  className="transition-fast"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="transition-fast"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:bg-primary-hover transition-smooth"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
            <div className="mt-6 text-sm text-muted-foreground">
              <div className="mb-2">Or view public class data:</div>
              <ul className="list-disc pl-5 space-y-1">
                {available.slice(0, 6).map((t) => (
                  <li key={t}>
                    <Link className="text-primary hover:underline" to={`/classes?class=${encodeURIComponent(t)}`}>{t}</Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs">Note: Data updates approximately every 12 hours.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;