"use client";

import { Sparkles, AlertTriangle, TrendingUp, ShieldCheck, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HealthKPIs } from "@/hooks/use-health-scores";
import { useAuth } from "@/contexts/auth-context";

interface AISummaryCardProps {
  kpis: HealthKPIs;
  loading: boolean;
}

export function AISummaryCard({ kpis, loading }: AISummaryCardProps) {
  const { user } = useAuth();
  const displayName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-primary/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-foreground">
                Good morning, {displayName}
              </h1>
            </div>

            {loading ? (
              <div className="space-y-2 mb-4">
                <Skeleton className="h-4 w-72" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">
                {kpis.totalReports === 0
                  ? "Upload a weekly report to start seeing AI-powered health insights."
                  : `Retention Signal AI has analysed ${kpis.totalReports} health ${kpis.totalReports === 1 ? "report" : "reports"} for your account.`}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <SummaryItem
                icon={<Activity className="w-4 h-4 text-primary" />}
                value={loading ? "—" : kpis.latestScore !== null ? String(kpis.latestScore) : "—"}
                label="latest health score"
                variant="primary"
              />
              <SummaryItem
                icon={<AlertTriangle className="w-4 h-4 text-destructive" />}
                value={loading ? "—" : String(kpis.criticalCount)}
                label="critical accounts (score < 60)"
                variant="destructive"
              />
              <SummaryItem
                icon={<ShieldCheck className="w-4 h-4 text-success" />}
                value={loading ? "—" : String(kpis.healthyCount)}
                label="healthy accounts (score ≥ 80)"
                variant="success"
              />
              <SummaryItem
                icon={<TrendingUp className="w-4 h-4 text-warning" />}
                value={loading ? "—" : String(kpis.warningCount)}
                label="accounts in warning zone"
                variant="warning"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  icon,
  value,
  label,
  variant,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  variant: "destructive" | "warning" | "success" | "primary";
}) {
  const bgMap = {
    destructive: "bg-destructive/5 border-destructive/10",
    warning: "bg-warning/5 border-warning/10",
    success: "bg-success/5 border-success/10",
    primary: "bg-primary/5 border-primary/10",
  };

  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-lg border ${bgMap[variant]}`}>
      {icon}
      <div>
        <span className="text-base font-semibold text-foreground">{value}</span>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      </div>
    </div>
  );
}
