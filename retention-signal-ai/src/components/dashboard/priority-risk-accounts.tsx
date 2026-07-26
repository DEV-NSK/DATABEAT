"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { HealthScoreRow } from "@/hooks/use-health-scores";

interface PriorityRiskAccountsProps {
  rows: HealthScoreRow[];
  loading: boolean;
}

function getRiskBadge(risk: string) {
  const r = risk?.toLowerCase();
  if (r === "critical") return "bg-destructive/10 text-destructive border-destructive/20";
  if (r === "high") return "bg-orange-500/10 text-orange-600 border-orange-200";
  if (r === "medium") return "bg-warning/10 text-warning border-warning/20";
  return "bg-success/10 text-success border-success/20";
}

function getScoreColor(score: number) {
  if (score < 50) return "text-destructive";
  if (score < 70) return "text-warning";
  return "text-success";
}

function getMainSignal(row: HealthScoreRow): string {
  const concerns = row.concerns
    ? Array.isArray(row.concerns)
      ? row.concerns
      : (() => {
          try { return JSON.parse(row.concerns as string); } catch { return [row.concerns as string]; }
        })()
    : [];
  return concerns[0] ?? "No signal detected";
}

function getAction(risk: string): string {
  const r = risk?.toLowerCase();
  if (r === "critical") return "Contact Now";
  if (r === "high") return "Review";
  if (r === "medium") return "Monitor";
  return "Watch";
}

export function PriorityRiskAccounts({ rows, loading }: PriorityRiskAccountsProps) {
  const router = useRouter();

  // Sort by health score ascending (worst first), show at-risk accounts
  const atRisk = [...rows]
    .filter((r) => r.overall_health_score < 75)
    .sort((a, b) => a.overall_health_score - b.overall_health_score)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <CardTitle className="text-sm font-semibold">Priority Risk Accounts</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => router.push("/account-health")}
          >
            View All <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : atRisk.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-muted-foreground">
              No at-risk accounts detected. All accounts are performing well.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Account</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Health Score</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Risk</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Main Signal</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {atRisk.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/clients/${row.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[140px]">
                        {row.company_name || "Unknown"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold text-sm ${getScoreColor(row.overall_health_score)}`}>
                        {row.overall_health_score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] ${getRiskBadge(row.risk_level)}`}>
                        {row.risk_level || "Unknown"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-muted-foreground truncate max-w-[180px]" title={getMainSignal(row)}>
                        {getMainSignal(row)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/clients/${row.id}`);
                        }}
                      >
                        {getAction(row.risk_level)}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
