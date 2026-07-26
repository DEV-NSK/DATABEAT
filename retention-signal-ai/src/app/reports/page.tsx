"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { EmptyState } from "@/components/shared/empty-state";
import {
  FileText, Upload, BarChart3, TrendingUp, RefreshCw,
  CheckCircle2, Clock, AlertCircle, Calendar,
} from "lucide-react";

interface WeeklyReportRow {
  id: string;
  client_name?: string;
  company_name?: string;
  week?: string;
  report_timestamp?: string;
  created_at: string;
  sla_miss?: boolean;
  escalation?: boolean;
  processing_status?: string;
}

interface HealthRow {
  id: string;
  company_name: string;
  overall_health_score: number;
  health_grade: string;
  risk_level: string;
  confidence_score: number;
  created_at: string;
}

function StatusBadge({ status }: { status?: string }) {
  const s = status?.toLowerCase();
  if (!s || s === "completed") {
    return <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20"><CheckCircle2 className="w-2.5 h-2.5 mr-1 inline" />Completed</Badge>;
  }
  if (s === "processing") {
    return <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20"><Clock className="w-2.5 h-2.5 mr-1 inline" />Processing</Badge>;
  }
  if (s === "draft") {
    return <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground"><FileText className="w-2.5 h-2.5 mr-1 inline" />Draft</Badge>;
  }
  if (s === "failed") {
    return <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20"><AlertCircle className="w-2.5 h-2.5 mr-1 inline" />Failed</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20"><AlertCircle className="w-2.5 h-2.5 mr-1 inline" />Failed</Badge>;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReportRow[]>([]);
  const [healthReports, setHealthReports] = useState<HealthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"weekly" | "health">("weekly");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: wr }, { data: hr }] = await Promise.all([
        supabase.from("weekly_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("client_health_scores").select("id, company_name, overall_health_score, health_grade, risk_level, confidence_score, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setWeeklyReports((wr ?? []) as WeeklyReportRow[]);
      setHealthReports((hr ?? []) as HealthRow[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${weeklyReports.length} weekly report${weeklyReports.length !== 1 ? "s" : ""} · ${healthReports.length} health ${healthReports.length !== 1 ? "analyses" : "analysis"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => router.push("/weekly-reports")}>
            <Upload className="w-3.5 h-3.5" /> Upload Report
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{loading ? "—" : weeklyReports.length}</p>
              <p className="text-xs text-muted-foreground">Weekly Reports</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold">{loading ? "—" : healthReports.length}</p>
              <p className="text-xs text-muted-foreground">Health Analyses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {loading ? "—" : healthReports[0]?.overall_health_score ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Latest Health Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex items-center gap-0">
          {(["weekly", "health"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "weekly" ? "Weekly Reports" : "Health Analyses"}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Reports Tab */}
      {activeTab === "weekly" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Weekly Report History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded" />)}</div>
            ) : weeklyReports.length === 0 ? (
              <EmptyState
                icon="file"
                title="No weekly reports yet"
                description="Upload your first weekly report to start generating AI insights."
                action={{ label: "Upload Report", onClick: () => router.push("/weekly-reports") }}
              />
            ) : (
              <div className="divide-y divide-border">
                {weeklyReports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {r.client_name || r.company_name || "Unknown Client"} — {r.week || "Unknown Period"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {r.sla_miss && <Badge variant="outline" className="text-[9px] bg-warning/10 text-warning border-warning/20">SLA Miss</Badge>}
                        {r.escalation && <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">Escalation</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={r.processing_status} />
                      {r.processing_status === "failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] px-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => router.push("/weekly-reports")}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Health Analyses Tab */}
      {activeTab === "health" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Health Score History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded" />)}</div>
            ) : healthReports.length === 0 ? (
              <EmptyState
                icon="chart"
                title="No health analyses yet"
                description="Upload a weekly report to generate your first health analysis."
                action={{ label: "Upload Report", onClick: () => router.push("/weekly-reports") }}
              />
            ) : (
              <div className="divide-y divide-border">
                {healthReports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{r.company_name || "Unknown"}</p>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">Grade {r.health_grade || "—"}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${r.risk_level?.toLowerCase() === "low" ? "bg-success/10 text-success border-success/20" : r.risk_level?.toLowerCase() === "medium" ? "bg-warning/10 text-warning border-warning/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                        {r.risk_level || "—"} Risk
                      </Badge>
                      <span className={`text-sm font-bold ${getScoreColor(r.overall_health_score)}`}>{r.overall_health_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
