"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Copy, Share2, X, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Eye, Lightbulb } from "lucide-react";
import type { AIInsight } from "@/lib/types";

const categoryConfig = {
  risk: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", label: "Risk" },
  opportunity: { icon: TrendingUp, color: "text-success", bg: "bg-success/10", label: "Opportunity" },
  trend: { icon: Eye, color: "text-primary", bg: "bg-primary/10", label: "Trend" },
  observation: { icon: Lightbulb, color: "text-warning", bg: "bg-warning/10", label: "Observation" },
};

interface AIInsightCardProps {
  insight: AIInsight;
  onDismiss?: (id: string) => void;
  compact?: boolean;
}

export function AIInsightCard({ insight, onDismiss, compact = false }: AIInsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const config = categoryConfig[insight.category];
  const Icon = config.icon;

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.(insight.id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${insight.title}\n\n${insight.content}`);
  };

  return (
    <Card className="hover:shadow-sm transition-all overflow-hidden">
      <CardContent className="p-0">
        <div className={`flex gap-3 ${compact ? "p-3" : "p-4"}`}>
          <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                <h4 className="text-sm font-semibold">{insight.title}</h4>
              </div>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${config.bg} ${config.color} border-0`}>
                {config.label}
              </Badge>
            </div>

            <p className={`text-xs text-muted-foreground leading-relaxed ${!expanded && !compact ? "line-clamp-2" : ""}`}>
              {insight.content}
            </p>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Confidence</span>
                <Progress value={insight.confidence} className="h-1 w-16" />
                <span className="text-[10px] font-semibold">{insight.confidence}%</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(insight.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              {insight.relatedClients.length > 0 && (
                <span className="text-[10px] text-muted-foreground">{insight.relatedClients.length} accounts</span>
              )}
            </div>

            {!compact && (
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expanded ? "Collapse" : "Expand"}
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={handleCopy}>
                  <Copy className="w-3 h-3" /> Copy
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2">
                  <Share2 className="w-3 h-3" /> Share
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2 text-destructive" onClick={handleDismiss}>
                  <X className="w-3 h-3" /> Dismiss
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
