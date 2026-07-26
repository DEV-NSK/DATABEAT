"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Plus, ChevronDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function TopNav() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count from Supabase
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    };
    fetchCount();

    // Realtime
    const ch = supabase
      .channel("topnav-notif-count")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, fetchCount)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <header className="sticky top-0 z-30 h-14 bg-card/80 backdrop-blur-sm border-b border-border flex items-center px-6 gap-4">
      {/* Global Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients, reports, tasks…"
            className="pl-9 h-8 text-sm bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Create */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Report</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => router.push("/weekly-reports")}>
              Upload Weekly Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Bell */}
        <button
          className="relative inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted"
          onClick={() => router.push("/notifications")}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[9px] bg-destructive text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-7 h-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {user ? getInitials(user.full_name) : "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="text-sm font-medium truncate">{user?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                {user?.role === "team_lead" ? "Team Lead" : (user?.role || "Team Lead")}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-destructive focus:text-destructive"
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
