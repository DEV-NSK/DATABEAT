"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles } from "lucide-react";
import { useHealthScores } from "@/hooks/use-health-scores";

function getGradeBadgeClass(grade: string): string {
  const g = grade?.toUpperCase();
  if (g === "A" || g === "A+") return "bg-success/10 text-success border-success/20";
  if (g === "B" || g === "B+") return "bg-primary/10 text-primary border-primary/20";
  if (g === "C" || g === "C+") return "bg-warning/10 text-warning border-warning/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

function getRiskBadgeClass(risk: string): string {
  const r = risk?.toLowerCase();
  if (r === "low") return "bg-success/10 text-success border-success/20";
  if (r === "medium") return "bg-warning/10 text-warning border-warning/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

export function HealthScoreHistoryTable() {
  const { rows, loading } = useHealthScores();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-semibold">
            AI-Generated Health Scores
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          All health scores generated from your uploaded weekly reports — newest first
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">No Health Reports Yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a weekly report above to generate your first AI health score.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Company</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Health Score</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Grade</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Risk</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Retention %</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Expansion %</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Confidence</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Report ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {row.company_name || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm font-bold ${getScoreColor(
                        row.overall_health_score
                      )}`}
                    >
                      {row.overall_health_score}
                    </span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${getGradeBadgeClass(row.health_grade)}`}
                    >
                      {row.health_grade || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${getRiskBadgeClass(row.risk_level)}`}
                    >
                      {row.risk_level || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {row.retention_probability != null
                      ? `${row.retention_probability}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {row.expansion_probability != null
                      ? `${row.expansion_probability}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {row.confidence_score != null
                      ? `${row.confidence_score}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {row.report_id
                      ? row.report_id.length > 14
                        ? `${row.report_id.slice(0, 14)}…`
                        : row.report_id
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
