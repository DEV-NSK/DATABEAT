"use client";

import { Badge } from "@/components/ui/badge";

export interface SignalEvent {
  id?: string;
  timestamp: string;
  signalType: string;
  source: "internal" | "external" | "ai";
  description: string;
  severity: "info" | "warning" | "critical" | "success";
}

const severityColors = {
  info: "bg-primary",
  warning: "bg-warning",
  critical: "bg-destructive",
  success: "bg-success",
};

const severityBadgeColors = {
  info: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
};

interface SignalTimelineProps {
  events: SignalEvent[];
  compact?: boolean;
}

export function SignalTimeline({ events, compact = false }: SignalTimelineProps) {
  return (
    <div className={`relative ${compact ? "pl-4" : "pl-5"} space-y-4`}>
      <div className={`absolute ${compact ? "left-[7px]" : "left-[9px]"} top-3 bottom-3 w-px bg-border`} />
      {events.map((event, i) => (
        <div key={event.id || i} className="relative flex items-start gap-3">
          <div className={`absolute ${compact ? "left-[-11px]" : "left-[-13px]"} w-3.5 h-3.5 rounded-full border-2 border-card ${severityColors[event.severity]}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-xs font-medium">{event.signalType}</p>
              <Badge variant="outline" className={`text-[9px] ${severityBadgeColors[event.severity]}`}>
                {event.severity}
              </Badge>
            </div>
            <p className={`text-muted-foreground ${compact ? "text-[10px]" : "text-xs"}`}>{event.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground">{event.timestamp}</span>
              <span className="text-[10px] text-muted-foreground">· {event.source}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
