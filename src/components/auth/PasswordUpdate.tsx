import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

function parseParams(): Record<string, string> {
  const params: Record<string, string> = {};
  const hash = window.location.hash?.replace(/^#/, "");
  const search = window.location.search?.replace(/^\?/, "");
  const pairs = [
    ...(hash ? hash.split("&") : []),
    ...(search ? search.split("&") : []),
  ];
  for (const p of pairs) {
    const [k, v] = p.split("=");
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
  }
  return params;
}

const PasswordUpdate: React.FC = () => {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const params = useMemo(parseParams, []);
  const flowType = (params["type"] || "").toLowerCase(); 

  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSessionReady(!!data.session);
    };
    init();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ variant: "destructive", title: "Weak password", description: "Use at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      toast({ variant: "destructive", title: "Passwords don't match", description: "Please confirm your password." });
      return;
    }
    setSubmitting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        toast({ variant: "destructive", title: "Session missing", description: "Open the reset/invite link again." });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated", description: "You can now access the dashboard." });
      
      try {
        if (window.history.replaceState) {
          window.history.replaceState({}, "", "/");
        }
      } finally {
        window.location.reload();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err?.message || "Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dashboard-content to-primary-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <KeyRound className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{flowType === "invite" ? "Set your password" : "Reset your password"}</h1>
          <p className="text-muted-foreground mt-2">Secure your account to continue</p>
        </div>

        <Card className="shadow-xl bg-gradient-card border-0">
          <CardHeader className="text-center">
            <CardTitle>{flowType === "invite" ? "Welcome!" : "Password recovery"}</CardTitle>
            <CardDescription>
              {sessionReady ? "Enter a new password for your account" : "Verifying your session..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !sessionReady}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {flowType === "invite" ? "Set Password" : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasswordUpdate;
