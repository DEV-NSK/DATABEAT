"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

interface RiskRow {
  id: string;
  company_name: string;
  overall_health_score: number;
  health_grade: string;
  risk_level: string;
  retention_probability: number;
  created_at: string;
}

function getRiskBadgeClass(risk: string): string {
  const r = risk?.toLowerCase();
  if (r === "low") return "bg-success/10 text-success";
  if (r === "medium") return "bg-warning/10 text-warning";
  return "bg-destructive/10 text-destructive";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

export function TopRiskAccounts() {
  const { user } = useAuth();
  const [rows, setRows] = useState<RiskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRiskAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("client_health_scores")
      .select(
        "id, company_name, overall_health_score, health_grade, risk_level, retention_probability, created_at"
      )
      .eq("user_id", user.id)
      // Only show records with non-low risk or score < 80
      .lt("overall_health_score", 80)
      .order("overall_health_score", { ascending: true })
      .limit(8);
    setRows((data as RiskRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRiskAccounts(); }, [fetchRiskAccounts]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("top-risk-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "client_health_scores", filter: `user_id=eq.${user.id}` },
        () => fetchRiskAccounts()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchRiskAccounts]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <CardTitle className="text-sm font-semibold">Accounts Needing Attention</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-muted-foreground">
              All analysed accounts are in the healthy range.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Company</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Health Score</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Grade</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Risk Level</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Retention</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Last Analysed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  <TableCell className="text-xs font-medium">
                    {row.company_name || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-10 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            row.overall_health_score < 60
                              ? "bg-destructive"
                              : row.overall_health_score < 80
                              ? "bg-warning"
                              : "bg-success"
                          }`}
                          style={{ width: `${row.overall_health_score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${getScoreColor(row.overall_health_score)}`}>
                        {row.overall_health_score}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium">{row.health_grade || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${getRiskBadgeClass(row.risk_level)}`}
                    >
                      {row.risk_level || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.retention_probability != null ? `${row.retention_probability}%` : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
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
