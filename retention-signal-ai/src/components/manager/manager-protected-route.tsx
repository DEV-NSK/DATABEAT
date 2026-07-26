"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// PRD §3: Manager Authentication + Access Restrictions
// Routes that belong to the Manager workspace
const MANAGER_ROUTES_PREFIX = "/manager";

interface ManagerProtectedRouteProps {
  children: React.ReactNode;
}

export function ManagerProtectedRoute({ children }: ManagerProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isManagerRoute = pathname.startsWith(MANAGER_ROUTES_PREFIX);

  useEffect(() => {
    if (loading) return;

    // Not authenticated → login
    if (!user) {
      router.replace("/login");
      return;
    }

    const role = user.role?.toLowerCase();

    // On a manager route: only 'manager' role is allowed
    if (isManagerRoute && role !== "manager") {
      // Don't redirect — we will show an access denied page below
      return;
    }
  }, [user, loading, pathname, isManagerRoute, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Manager workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const role = user.role?.toLowerCase();

  // PRD §3: Team Lead or other role trying to access manager routes
  if (isManagerRoute && role !== "manager") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Access Restricted</h1>
          <p className="text-sm text-muted-foreground">
            You do not have access to the Manager workspace.
          </p>
          <p className="text-xs text-muted-foreground">
            Your current role: <span className="font-medium text-foreground capitalize">{user.role}</span>
          </p>
          <button
            onClick={async () => {
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
