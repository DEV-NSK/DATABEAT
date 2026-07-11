"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HealthGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showTrend?: boolean;
  trend?: number;
  showRecommendation?: boolean;
  recommendation?: string;
  label?: string;
}

function getScoreColor(score: number) {
  if (score >= 80) return { stroke: "#10b981", label: "Healthy", badgeClass: "bg-success/10 text-success" };
  if (score >= 60) return { stroke: "#f59e0b", label: "Watch", badgeClass: "bg-warning/10 text-warning" };
  if (score >= 40) return { stroke: "#ef4444", label: "Warning", badgeClass: "bg-destructive/10 text-destructive" };
  return { stroke: "#dc2626", label: "Critical", badgeClass: "bg-destructive/10 text-destructive" };
}

function getRecommendation(score: number) {
  if (score >= 80) return "No immediate action required";
  if (score >= 60) return "Monitor closely this week";
  if (score >= 40) return "Schedule outreach within 48 hours";
  return "Immediate executive intervention required";
}

export function HealthGauge({ score, size = "md", showTrend = true, trend = 0, showRecommendation = false, recommendation, label }: HealthGaugeProps) {
  const { stroke, label: statusLabel, badgeClass } = getScoreColor(score);

  const sizeMap = { sm: { ring: 64, stroke: 8, text: "text-lg" }, md: { ring: 96, stroke: 10, text: "text-2xl" }, lg: { ring: 128, stroke: 12, text: "text-3xl" } };
  const s = sizeMap[size];
  const radius = (s.ring - s.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: s.ring, height: s.ring }}>
        <svg width={s.ring} height={s.ring} className="-rotate-90">
          <circle cx={s.ring / 2} cy={s.ring / 2} r={radius} fill="none" stroke="currentColor" className="text-muted/50" strokeWidth={s.stroke} />
          <circle cx={s.ring / 2} cy={s.ring / 2} r={radius} fill="none" stroke={stroke} strokeWidth={s.stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.5s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${s.text} font-bold`}>{score}</span>
          {size !== "sm" && <span className="text-[10px] text-muted-foreground">/100</span>}
        </div>
      </div>

      {label && <p className="text-xs font-medium">{label}</p>}

      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className={`text-[10px] ${badgeClass}`}>{statusLabel}</Badge>
        {showTrend && trend !== 0 && (
          <div className={`flex items-center gap-0.5 text-[10px] font-medium ${trend > 0 ? "text-success" : "text-destructive"}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend > 0 ? "+" : ""}{trend}%
          </div>
        )}
      </div>

      {showRecommendation && (
        <p className="text-[10px] text-muted-foreground text-center max-w-[140px]">{recommendation || getRecommendation(score)}</p>
      )}
    </div>
  );
}
