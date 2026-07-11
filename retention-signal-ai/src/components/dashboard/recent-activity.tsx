"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { activities } from "@/lib/mock-data";
import { ArrowRight, CheckSquare, TrendingUp, UserPlus, FileText, Sparkles } from "lucide-react";

const iconMap = {
  task_created: CheckSquare,
  score_changed: TrendingUp,
  manager_assigned: UserPlus,
  report_submitted: FileText,
  opportunity_found: Sparkles,
};

const colorMap = {
  task_created: "bg-primary/10 text-primary",
  score_changed: "bg-warning/10 text-warning",
  manager_assigned: "bg-success/10 text-success",
  report_submitted: "bg-muted text-muted-foreground",
  opportunity_found: "bg-primary/10 text-primary",
};

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
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {activities.slice(0, 8).map((activity, i) => {
            const Icon = iconMap[activity.type];
            const color = colorMap[activity.type];
            return (
              <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0 last:pb-0">
                <div className="relative">
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {i < 7 && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-3 bg-border" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{activity.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{activity.description}</p>
                </div>
                <TimeAgo date={activity.createdAt} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
