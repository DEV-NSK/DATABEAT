"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, Sparkles, AlertTriangle,
  CheckSquare, Building2, User, FileText, Calendar,
  RefreshCw, ShieldCheck, Zap, ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip, Area, AreaChart,
} from "recharts";
import { HealthGauge } from "@/components/shared/health-gauge";
import { SkeletonCard, SkeletonChart } from "@/components/shared/skeleton-loader";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ClientHealthScore {
  id: string;
  user_id: string;
  overall_health_score: number;
  health_grade: string;
  risk_level: string;
  client_status: string;
  retention_probability: number;
  expansion_probability: number;
  executive_summary: string;
  strengths: string[] | string;
  concerns: string[] | string;
  recommendations: string[] | string;
  priority_actions: string[] | string;
  confidence_score: number;
  company_name: string;
  uploaded_by: string;
  report_id: string;
  created_at: string;
}

interface HealthTrendPoint {
  date: string;
  score: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** JSON/jsonb fields may arrive as a string — normalise to array */
function toArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch {
      // plain string — treat as single item
      return [value];
    }
  }
  return [];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRiskBadgeClass(risk: string): string {
  const r = risk?.toLowerCase();
  if (r === "low") return "bg-success/10 text-success";
  if (r === "medium") return "bg-warning/10 text-warning";
  return "bg-destructive/10 text-destructive";
}

function getGradeBadgeClass(grade: string): string {
  const g = grade?.toUpperCase();
  if (g === "A" || g === "A+") return "bg-success/10 text-success";
  if (g === "B" || g === "B+") return "bg-primary/10 text-primary";
  if (g === "C" || g === "C+") return "bg-warning/10 text-warning";
  return "bg-destructive/10 text-destructive";
}

// ─── Skeleton for the whole page ──────────────────────────────────────────

function HealthPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-5 bg-muted rounded w-48" />

      {/* KPI row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <div className="lg:col-span-2">
          <SkeletonChart />
        </div>
      </div>

      {/* Insight + lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AccountHealthPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [latest, setLatest] = useState<ClientHealthScore | null>(null);
  const [trendData, setTrendData] = useState<HealthTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch data ────────────────────────────────────────────────────────

  const fetchHealthData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Latest record
      const { data: latestData, error: latestError } = await supabase
        .from("client_health_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        if (latestError.code === "PGRST116") {
          // no rows — not an error, just empty state
          setLatest(null);
          setTrendData([]);
        } else {
          throw latestError;
        }
      } else {
        setLatest(latestData as ClientHealthScore);
      }

      // Historical trend
      const { data: historyData, error: historyError } = await supabase
        .from("client_health_scores")
        .select("created_at, overall_health_score")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!historyError && historyData) {
        const points: HealthTrendPoint[] = historyData.map((row: { created_at: string; overall_health_score: number }) => ({
          date: new Date(row.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          score: row.overall_health_score,
        }));
        setTrendData(points);
      }
    } catch (err: unknown) {
      console.error("Health fetch error:", err);
      setError("Unable to load Health Intelligence. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // ── Realtime auto-refresh ─────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("health-scores-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "client_health_scores",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchHealthData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchHealthData]);

  // ── Loading ───────────────────────────────────────────────────────────

  if (loading) return <HealthPageSkeleton />;

  // ── Error ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Health Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated health analysis from your latest weekly report
          </p>
        </div>
        <ErrorState
          title="Unable to load Health Intelligence"
          description={error}
          onRetry={fetchHealthData}
        />
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────

  if (!latest) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Health Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated health analysis from your latest weekly report
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon="sparkles"
              title="No Health Score Available"
              description="Upload a Weekly Report to generate AI Health Intelligence."
              action={{
                label: "Go to Weekly Reports",
                onClick: () => router.push("/weekly-reports"),
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Normalise arrays ──────────────────────────────────────────────────

  const strengths = toArray(latest.strengths);
  const concerns = toArray(latest.concerns);
  const recommendations = toArray(latest.recommendations);
  const priorityActions = toArray(latest.priority_actions);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Health Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated health analysis from your latest weekly report
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => router.push("/cross-sell")}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            View Cross Sell Intelligence
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={fetchHealthData}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Client Info Banner ── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span className="font-medium text-foreground">{latest.company_name || "—"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {latest.uploaded_by || "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {latest.report_id || "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(latest.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Health */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center">
            <HealthGauge
              score={latest.overall_health_score ?? 0}
              size="lg"
              showTrend={false}
              showRecommendation
              label="Overall Health"
            />
            <div className="flex items-center gap-2 mt-3">
              <Badge
                variant="outline"
                className={getGradeBadgeClass(latest.health_grade)}
              >
                Grade {latest.health_grade}
              </Badge>
              <Badge
                variant="outline"
                className={getRiskBadgeClass(latest.risk_level)}
              >
                {latest.risk_level} Risk
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Retention */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Retention Probability</p>
              <ShieldCheck className="w-4 h-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-success">
              {latest.retention_probability ?? 0}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full bg-success transition-all duration-700"
                style={{ width: `${latest.retention_probability ?? 0}%` }}
              />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {(latest.retention_probability ?? 0) >= 70 ? (
                <TrendingUp className="w-3 h-3 text-success" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span className="text-[10px] text-muted-foreground">
                {latest.client_status || "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Expansion */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Expansion Probability</p>
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">
              {latest.expansion_probability ?? 0}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${latest.expansion_probability ?? 0}%` }}
              />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">Growth signal</span>
            </div>
          </CardContent>
        </Card>

        {/* Confidence */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">AI Confidence</p>
              <Sparkles className="w-4 h-4 text-warning" />
            </div>
            <p className="text-2xl font-bold text-warning">
              {latest.confidence_score ?? 0}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full bg-warning transition-all duration-700"
                style={{ width: `${latest.confidence_score ?? 0}%` }}
              />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground">Score confidence</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Executive Summary + Health Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Executive Summary */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-2">Executive Summary</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {latest.executive_summary || "No summary available."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Health Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No trend data available</p>
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="healthScoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                      formatter={(value) => [`${value ?? 0}`, "Health Score"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="url(#healthScoreGrad)"
                      strokeWidth={2}
                      dot={trendData.length === 1 ? { r: 5, fill: "#2563eb" } : false}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Signal Feed (Concerns) + Strengths + Recommendations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signal Feed — from concerns[] */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              Signal Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {concerns.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No concerns flagged
              </p>
            ) : (
              <div className="space-y-2">
                {concerns.map((concern, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-1.5" />
                    <p className="text-xs text-foreground leading-relaxed">{concern}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-success" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strengths.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No strengths listed
              </p>
            ) : (
              <div className="space-y-2">
                {strengths.map((strength, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-success/5 border border-success/10"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-1.5" />
                    <p className="text-xs text-foreground leading-relaxed">{strength}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No recommendations available
              </p>
            ) : (
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    <p className="text-xs text-foreground leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Priority Actions ── */}
      {priorityActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {priorityActions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
