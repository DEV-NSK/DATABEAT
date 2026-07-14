"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Sparkles, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

interface ActivityEntry {
  id: string;
  company_name: string;
  overall_health_score: number;
  health_grade: string;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function TimeAgo({ date }: { date: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <span className="text-[10px] text-muted-foreground shrink-0">--</span>;
  return <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(date)}</span>;
}

export function RecentActivity() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("client_health_scores")
      .select("id, company_name, overall_health_score, health_grade, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);
    if (data) setEntries(data as ActivityEntry[]);
  }, [user]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("recent-activity-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "client_health_scores", filter: `user_id=eq.${user.id}` },
        () => fetchEntries()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchEntries]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No activity yet. Upload a report to get started.
          </p>
        ) : (
          <div className="space-y-0">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 py-3 border-b border-border last:border-0 last:pb-0"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  {i < entries.length - 1 && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-3 bg-border" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    Health score generated — {entry.overall_health_score}/100 (Grade {entry.health_grade})
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {entry.company_name || "Unknown company"}
                  </p>
                </div>
                <TimeAgo date={entry.created_at} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
