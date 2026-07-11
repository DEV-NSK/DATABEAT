"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ArrowRight, AlertTriangle, TrendingUp, Shuffle, Zap } from "lucide-react";
import type { Recommendation } from "@/lib/types";

const typeConfig = {
  churn_risk: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", label: "Churn Risk" },
  upsell: { icon: TrendingUp, color: "text-success", bg: "bg-success/10", label: "Upsell" },
  cross_sell: { icon: Shuffle, color: "text-primary", bg: "bg-primary/10", label: "Cross-Sell" },
  action: { icon: Zap, color: "text-warning", bg: "bg-warning/10", label: "Action" },
};

const priorityColors = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAction?: (id: string) => void;
  compact?: boolean;
}

export function RecommendationCard({ recommendation: rec, onAction, compact = false }: RecommendationCardProps) {
  const config = typeConfig[rec.type];
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-sm transition-all overflow-hidden">
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <p className="text-xs font-medium text-muted-foreground">{rec.client.name}</p>
                </div>
                <h4 className="text-sm font-semibold leading-tight">{rec.title}</h4>
              </div>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${priorityColors[rec.priority]}`}>
                {rec.priority}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-1">{rec.reason}</p>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Confidence</span>
                <Progress value={rec.confidence} className="h-1 w-16" />
                <span className="text-[10px] font-semibold">{rec.confidence}%</span>
              </div>
              <Badge variant="outline" className={`text-[10px] ${config.bg} ${config.color} border-0`}>
                {config.label}
              </Badge>
            </div>

            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Action:</span>
                <span className="text-[10px] font-medium">{rec.nextAction}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => onAction?.(rec.id)}>
                Act <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            {rec.potentialRevenue && (
              <div className="mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-[10px] font-medium text-success">Potential: ${(rec.potentialRevenue / 1000).toFixed(0)}K</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
