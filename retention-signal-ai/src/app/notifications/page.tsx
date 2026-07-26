"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Sparkles, Settings, CheckSquare, CheckCheck, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

type NotifType = "alert" | "recommendation" | "system" | "task";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  client_id?: string;
  client_name?: string;
  action_url?: string;
  user_id?: string;
}

const ICON_MAP: Record<NotifType, typeof AlertTriangle> = {
  alert: AlertTriangle,
  recommendation: Sparkles,
  system: Settings,
  task: CheckSquare,
};

const COLOR_MAP: Record<NotifType, string> = {
  alert: "bg-destructive/10 text-destructive",
  recommendation: "bg-primary/10 text-primary",
  system: "bg-muted text-muted-foreground",
  task: "bg-warning/10 text-warning",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "alerts" | "recommendations">("all");

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        // Table may not exist — show empty state
        console.warn("Notifications table:", error.message);
        setNotifications([]);
      } else {
        setNotifications((data ?? []) as Notification[]);
      }
    } catch (e) {
      console.error(e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notifications-rt")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchNotifications]);

  const markRead = async (id: string) => {
    setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    if (user) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "alerts") return n.type === "alert";
    if (filter === "recommendations") return n.type === "recommendation";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={markAllRead}>
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 flex-wrap">
        {(["all", "unread", "alerts", "recommendations"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[9px] rounded-full bg-primary-foreground/20">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="bell"
              title={filter === "all" ? "No notifications yet" : "You're all caught up!"}
              description={
                filter === "all"
                  ? "Notifications for critical risks, opportunities, and report processing will appear here."
                  : "No notifications match this filter."
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((n) => {
                const Icon = ICON_MAP[n.type] ?? Settings;
                const color = COLOR_MAP[n.type] ?? COLOR_MAP.system;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-4 hover:bg-muted/50 cursor-pointer transition-colors ${!n.read ? "bg-primary/[0.02]" : ""}`}
                    onClick={() => {
                      markRead(n.id);
                      if (n.action_url) router.push(n.action_url);
                      else if (n.client_id) router.push(`/clients/${n.client_id}`);
                    }}
                  >
                    <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{n.message}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[9px] ${color}`}>{n.type}</Badge>
                        {n.client_name && (
                          <span className="text-[10px] text-muted-foreground">{n.client_name}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
