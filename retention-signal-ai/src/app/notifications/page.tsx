"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notifications } from "@/lib/mock-data";
import { AlertTriangle, Sparkles, Settings, CheckSquare, CheckCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

const iconMap = {
  alert: AlertTriangle,
  recommendation: Sparkles,
  system: Settings,
  task: CheckSquare,
};

const colorMap = {
  alert: "bg-destructive/10 text-destructive",
  recommendation: "bg-primary/10 text-primary",
  system: "bg-muted text-muted-foreground",
  task: "bg-warning/10 text-warning",
};

function groupByTime(items: typeof notifications) {
  const now = new Date("2026-07-11T12:00:00Z");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groups: Record<string, typeof notifications> = {
    Today: [],
    Yesterday: [],
    "Last Week": [],
    Older: [],
  };

  items.forEach(n => {
    const d = new Date(n.createdAt);
    if (d >= today) groups["Today"].push(n);
    else if (d >= yesterday) groups["Yesterday"].push(n);
    else if (d >= lastWeek) groups["Last Week"].push(n);
    else groups["Older"].push(n);
  });

  return groups;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "alerts" | "recommendations">("all");
  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "alerts") return n.type === "alert";
    if (filter === "recommendations") return n.type === "recommendation";
    return true;
  });
  const unreadCount = notifications.filter(n => !n.read).length;
  const grouped = groupByTime(filtered);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread notifications</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1"><CheckCheck className="w-3.5 h-3.5" /> Mark all read</Button>
      </div>

      <div className="flex items-center gap-1">
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
              <span className="ml-1.5 px-1.5 py-0.5 text-[9px] rounded-full bg-primary-foreground/20">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {Object.entries(grouped).map(([period, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={period}>
                <div className="sticky top-0 bg-muted/50 px-4 py-2 border-b border-border z-10">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{period} ({items.length})</p>
                </div>
                <div className="divide-y divide-border">
                  {items.map((notification) => {
                    const Icon = iconMap[notification.type];
                    const color = colorMap[notification.type];
                    return (
                      <div key={notification.id} className={`flex items-start gap-3 px-4 py-3.5 hover:bg-muted/50 cursor-pointer ${!notification.read ? "bg-primary/[0.02]" : ""}`}>
                        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm ${!notification.read ? "font-semibold" : "font-medium"}`}>{notification.title}</p>
                            {!notification.read && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className={`text-[10px] ${color}`}>{notification.type}</Badge>
                            {notification.client && <span className="text-[10px] text-muted-foreground">{notification.client.name}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <EmptyState icon="bell" title="You're all caught up!" description="No notifications to show right now. We'll alert you when something important comes up." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
