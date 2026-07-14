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
    }
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

  // Protected route — wait until we have a user (redirect is in-flight if not)
  if (!user) return null;

  return <>{children}</>;
}
