"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ["/login", "/register", "/reset-password"];

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading) return;

    // Unauthenticated user on a protected route → send to login
    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }

    // Authenticated user lands on login or register → send to dashboard
    if (user && (pathname === "/login" || pathname === "/register")) {
      router.replace("/");
      return;
    }

    // Authenticated but not team_lead → show access denied (stay on current route,
    // but we will render a blocking message in the UI below)
  }, [user, loading, pathname, isPublic, router]);

  // Splash screen while session is being restored
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Public routes always render
  if (isPublic) return <>{children}</>;

  // Protected route — wait until we have a user
  if (!user) return null;

  // Role check: only team_lead can access the Team Lead workspace
  const role = user.role?.toLowerCase();
  if (role && role !== "team_lead") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Access Restricted</h1>
          <p className="text-sm text-muted-foreground">
            You do not have access to the Team Lead workspace. This application is only available
            to users with the <strong>Team Lead</strong> role.
          </p>
          <p className="text-xs text-muted-foreground">
            Your current role: <span className="font-medium text-foreground capitalize">{user.role}</span>
          </p>
          <button
            onClick={async () => {
              const { supabase } = await import("@/lib/supabase");
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="mt-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
