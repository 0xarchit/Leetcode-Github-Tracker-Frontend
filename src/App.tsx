import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthPage from "@/components/auth/AuthPage";
import PasswordUpdate from "@/components/auth/PasswordUpdate";
import Dashboard from "@/components/dashboard/Dashboard";
import StatsPage from "./pages/Stats";
import NotFound from "./pages/NotFound";
import PublicClass from "./pages/PublicClass";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import SiteFooter from "@/components/site-footer";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();
  const flowType = useMemo(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash || window.location.search);
    return (params.get("type") || "").toLowerCase();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-content flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  
  if (flowType === "recovery" || flowType === "invite") {
    return (
      <div className="min-h-screen bg-dashboard-content flex flex-col">
        <div className="flex-1">
          <PasswordUpdate />
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-content flex flex-col">
      <div className="flex-1">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={user ? <Dashboard /> : <AuthPage />} />
            <Route path="/auth" element={<AuthPage />} />
            {}
            <Route path="/classes" element={<PublicClass />} />
            <Route path="/auth/update-password" element={<PasswordUpdate />} />
            <Route path="/stats" element={user ? <StatsPage /> : <AuthPage />} />
            {}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
      <SiteFooter />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
