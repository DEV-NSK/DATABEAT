"use client";

import { Search, Inbox, FileText, CheckCircle2, Bell, Users, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: "search" | "inbox" | "file" | "check" | "bell" | "users" | "chart" | "sparkles";
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

const icons = {
  search: Search,
  inbox: Inbox,
  file: FileText,
  check: CheckCircle2,
  bell: Bell,
  users: Users,
  chart: BarChart3,
  sparkles: Sparkles,
};

export function EmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">{description}</p>
      {action && (
        <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
