"use client";

import { FileText, Activity, ShieldCheck, TrendingUp, TrendingDown, Users, AlertTriangle, Eye, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HealthKPIs } from "@/hooks/use-health-scores";

interface KPICardsProps {
  kpis: HealthKPIs;
  loading: boolean;
}

export function KPICards({ kpis, loading }: KPICardsProps) {
  const trendPositive = kpis.scoreTrend !== null && kpis.scoreTrend >= 0;
  const trendLabel =
    kpis.scoreTrend !== null
      ? `${kpis.scoreTrend >= 0 ? "+" : ""}${kpis.scoreTrend} vs previous`
      : null;

  // PRD §11: Total Clients, Healthy, Watch, At Risk, Critical
  const cards = [
    {
      title: "Total Clients",
      value: loading ? null : kpis.totalClients ?? kpis.totalReports,
      change: null,
      trend: "neutral" as const,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Healthy",
      value: loading ? null : kpis.healthyCount,
      change: null,
      trend: "neutral" as const,
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Watch",
      value: loading ? null : kpis.warningCount,
      change: null,
      trend: "neutral" as const,
      icon: Eye,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "At Risk",
      value: loading ? null : kpis.atRiskCount ?? kpis.criticalCount,
      change: trendLabel,
      trend: (kpis.scoreTrend !== null
        ? trendPositive ? "up" : "down"
        : "neutral") as "up" | "down" | "neutral",
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((kpi) => (
        <Card key={kpi.title} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              {kpi.change && (
                <div className="flex items-center gap-1">
                  {kpi.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-success" />
                  ) : kpi.trend === "down" ? (
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  ) : null}
                  <span
                    className={`text-xs font-medium ${
                      kpi.trend === "up"
                        ? "text-success"
                        : kpi.trend === "down"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {kpi.change}
                  </span>
                </div>
              )}
            </div>
            {loading ? (
              <Skeleton className="h-7 w-20 mb-1" />
            ) : (
              <p className="text-2xl font-semibold text-foreground">
                {kpi.value ?? "—"}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
