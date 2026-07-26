"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { UserProfile, ManagerProfile, AuthContextType, AuthState, SignUpData } from "@/lib/types";
import { toast } from "sonner";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("fetchProfile error:", error.message);
    return null;
  }
  return data as UserProfile;
}

async function fetchManager(managerId: string): Promise<ManagerProfile | null> {
  if (!managerId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", managerId)
    .single();
  if (error) {
    console.error("fetchManager error:", error.message);
    return null;
  }
  return data as ManagerProfile;
}

/**
 * After signup the DB trigger runs asynchronously.
 * Retry up to maxAttempts times until the profile row appears.
 */
async function fetchProfileWithRetry(
  userId: string,
  maxAttempts = 8,
  delayMs = 500
): Promise<UserProfile | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const profile = await fetchProfile(userId);
    if (profile) return profile;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    manager: null,
    loading: true,
    error: null,
  });

  // Helper: load profile + manager together
  const loadUserAndManager = async (userId: string): Promise<{ user: UserProfile | null; manager: ManagerProfile | null }> => {
    const profile = await fetchProfile(userId);
    let manager: ManagerProfile | null = null;
    if (profile?.manager_id) {
      manager = await fetchManager(profile.manager_id);
    }
    return { user: profile, manager };
  };

  // ── Session restore on mount ──────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const { user, manager } = await loadUserAndManager(session.user.id);
          if (mounted) setState({ user, manager, loading: false, error: null });
        } else if (mounted) {
          setState({ user: null, manager: null, loading: false, error: null });
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) setState({ user: null, manager: null, loading: false, error: "Failed to restore session" });
      }
    };

    init();

    // ── Auth state listener ────────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_IN" && session?.user) {
          const { user, manager } = await loadUserAndManager(session.user.id);
          setState({ user, manager, loading: false, error: null });

          // Refresh last_login (best-effort)
          supabase
            .from("profiles")
            .update({ last_login: new Date().toISOString() })
            .eq("id", session.user.id)
            .then(() => {});

        } else if (event === "SIGNED_OUT") {
          setState({ user: null, manager: null, loading: false, error: null });

        } else if (event === "PASSWORD_RECOVERY") {
          // Keep whatever state we have — the reset-password page handles this
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          const { user, manager } = await loadUserAndManager(session.user.id);
          if (mounted) setState((prev) => ({ ...prev, user, manager }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── signUp ────────────────────────────────────────────────────────────────
  const signUp = async (data: SignUpData): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            company_name: data.companyName,
            designation: data.designation ?? "",
            role: "team_lead",
          },
        },
      });

      if (error) throw error;

      if (authData.session?.user) {
        const profile = await fetchProfileWithRetry(authData.session.user.id);
        let manager: ManagerProfile | null = null;
        if (profile?.manager_id) {
          manager = await fetchManager(profile.manager_id);
        }
        setState({ user: profile, manager, loading: false, error: null });
        toast.success("Account created! Welcome to Retention Signal AI.");
      } else {
        setState((prev) => ({ ...prev, loading: false }));
        toast.success("Account created! Please check your email to verify your account.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account";
      setState((prev) => ({ ...prev, loading: false, error: msg }));
      toast.error(msg);
      throw err;
    }
  };

  // ── signIn ────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error("No session returned from sign in");

      const profile = await fetchProfile(data.session.user.id);
      let manager: ManagerProfile | null = null;
      if (profile?.manager_id) {
        manager = await fetchManager(profile.manager_id);
      }
      setState({ user: profile, manager, loading: false, error: null });
      toast.success("Welcome back!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      setState((prev) => ({ ...prev, loading: false, error: msg }));
      toast.error(msg);
      throw err;
    }
  };

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setState({ user: null, manager: null, loading: false, error: null });
      toast.success("Signed out successfully");
      window.location.href = "/login";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign out";
      setState((prev) => ({ ...prev, loading: false, error: msg }));
      toast.error(msg);
      throw err;
    }
  };

  // ── resetPassword ─────────────────────────────────────────────────────────
  const resetPassword = async (email: string): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setState((prev) => ({ ...prev, loading: false }));
      toast.success("Password reset email sent — check your inbox.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email";
      setState((prev) => ({ ...prev, loading: false, error: msg }));
      toast.error(msg);
      throw err;
    }
  };

  // ── updateProfile ─────────────────────────────────────────────────────────
  const updateProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!state.user) throw new Error("No authenticated user");

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", state.user.id);

      if (error) throw error;

      const updated = await fetchProfile(state.user.id);
      let manager = state.manager;
      if (updated?.manager_id && updated.manager_id !== state.user.manager_id) {
        manager = await fetchManager(updated.manager_id);
      }
      setState((prev) => ({ ...prev, user: updated, manager, loading: false }));
      toast.success("Profile updated successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setState((prev) => ({ ...prev, loading: false, error: msg }));
      toast.error(msg);
      throw err;
    }
  };

  // ── refreshSession ────────────────────────────────────────────────────────
  const refreshSession = async (): Promise<void> => {
    const { error } = await supabase.auth.refreshSession();
    if (error) throw error;
  };

  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
