"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { HealthGauge } from "@/components/shared/health-gauge";
import {
  ArrowLeft, Users, User, FileText, Calendar, RefreshCw,
  AlertTriangle, TrendingUp, Sparkles, CheckSquare, ShieldCheck, Zap,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// PRD §10: Manager Client Detail — /manager/clients/:id
// Manager sees same analysis as Team Lead but with additional Account Owner + Manager context
// All read-only — manager cannot edit health score, AI analysis, account owner, or manager

interface HealthRow {
  id: string;
  user_id: string;
  company_name: string;
  uploaded_by: string;
  report_id: string;
  overall_health_score: number;
  health_grade: string;
  risk_level: string;
  client_status: string;
  retention_probability: number;
  expansion_probability: number;
  confidence_score: number;
  executive_summary: string;
  strengths: string[] | string;
  concerns: string[] | string;
  recommendations: string[] | string;
  priority_actions: string[] | string;
  created_at: string;
}

interface CrossSellRow {
  id: string;
  cross_sell_score: number;
  opportunity_level: string;
  potential_revenue: number | string;
  confidence_score: number;
  executive_summary: string;
  recommended_services: string[] | string;
  next_actions: string[] | string;
  created_at: string;
}

function toArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try { const p = JSON.parse(value); if (Array.isArray(p)) return p; } catch {}
    return [value];
  }
  return [];
}

function getGradeClass(grade: string) {
  const g = grade?.toUpperCase();
  if (g === "A" || g === "A+") return "bg-success/10 text-success border-success/20";
  if (g === "B" || g === "B+") return "bg-primary/10 text-primary border-primary/20";
  if (g === "C" || g === "C+") return "bg-warning/10 text-warning border-warning/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

function getRiskClass(risk: string) {
  const r = risk?.toLowerCase();
  if (r === "low") return "bg-success/10 text-success border-success/20";
  if (r === "medium") return "bg-warning/10 text-warning border-warning/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || !num) return "—";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "health", label: "Health Score" },
  { id: "risk", label: "Risk Signals" },
  { id: "opportunities", label: "Opportunities" },
  { id: "actions", label: "Recommended Actions" },
];

export default function ManagerClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const [latest, setLatest] = useState<HealthRow | null>(null);
  const [history, setHistory] = useState<HealthRow[]>([]);
  const [crossSell, setCrossSell] = useState<CrossSellRow | null>(null);
  const [accountOwnerName, setAccountOwnerName] = useState<string>("—");
  const [managerName, setManagerName] = useState<string>("—");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError(null);
    try {
      // Get the health record
      const { data: row, error: rowErr } = await supabase
        .from("client_health_scores")
        .select("*")
        .eq("id", id)
        .single();
      if (rowErr) throw rowErr;
      const healthRow = row as HealthRow;

      // Security: verify this record belongs to one of our team leads
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("id, full_name, manager_id")
        .eq("id", healthRow.user_id)
        .eq("manager_id", user.id)
        .single();

      if (!ownerProfile) {
        throw new Error("Access denied: client does not belong to your team.");
      }

      setLatest(healthRow);
      setAccountOwnerName((ownerProfile as { id: string; full_name: string; manager_id: string }).full_name || "—");

      // Manager name
      const { data: mgr } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setManagerName((mgr as { full_name: string } | null)?.full_name || user.full_name || "—");

      // History for trend chart
      const { data: hist } = await supabase
        .from("client_health_scores")
        .select("id, overall_health_score, created_at")
        .eq("user_id", healthRow.user_id)
        .eq("company_name", healthRow.company_name)
        .order("created_at", { ascending: true });
      setHistory((hist ?? []) as HealthRow[]);

      // Cross-sell
      const { data: cs } = await supabase
        .from("client_cross_sell")
        .select("*")
        .eq("user_id", healthRow.user_id)
        .eq("company_name", healthRow.company_name)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setCrossSell(cs as CrossSellRow | null);
    } catch (e) {
      console.error(e);
      setError("Unable to load client details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2" onClick={() => router.push("/manager/clients")}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="space-y-4 animate-pulse">
          <Skeleton className="h-8 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  if (error || !latest) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2" onClick={() => router.push("/manager/clients")}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {error
          ? <ErrorState title="Unable to load client" description={error} onRetry={fetchData} />
          : <EmptyState icon="users" title="Client not found" description="This record may not be accessible." action={{ label: "Back to Clients", onClick: () => router.push("/manager/clients") }} />
        }
      </div>
    );
  }

  const strengths = toArray(latest.strengths);
  const concerns = toArray(latest.concerns);
  const recommendations = toArray(latest.recommendations);
  const priorityActions = toArray(latest.priority_actions);
  const trendData = history.map(h => ({
    date: new Date(h.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: h.overall_health_score,
  }));

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2" onClick={() => router.push("/manager/clients")}>
        <ArrowLeft className="w-4 h-4" /> Back to All Clients
      </Button>

      {/* PRD §10: Manager additional context — Account Owner + Manager (read-only) */}
      <div className="flex flex-wrap items-center gap-4 text-sm p-4 bg-muted/30 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Account Owner:</span>
          <span className="font-medium text-foreground">{accountOwnerName}</span>
          <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground">Read Only</Badge>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Manager:</span>
          <span className="font-medium text-foreground">{managerName}</span>
          <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground">Read Only</Badge>
        </div>
      </div>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-primary">
                  {(latest.company_name || "?").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-xl font-bold">{latest.company_name}</h1>
                  <Badge variant="outline" className={`text-xs ${getGradeClass(latest.health_grade)}`}>Grade {latest.health_grade}</Badge>
                  <Badge variant="outline" className={`text-xs ${getRiskClass(latest.risk_level)}`}>{latest.risk_level} Risk</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{latest.uploaded_by || "—"}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{latest.report_id ? latest.report_id.slice(0, 12) + "…" : "—"}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(latest.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <HealthGauge score={latest.overall_health_score} size="md" showTrend={false} showRecommendation label="Health Score" />
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchData}>
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>
          </div>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border">
            <div className="bg-success/5 border border-success/10 rounded-lg p-3 text-center">
              <ShieldCheck className="w-4 h-4 text-success mx-auto mb-1" />
              <p className="text-lg font-bold text-success">{latest.retention_probability ?? 0}%</p>
              <p className="text-[10px] text-muted-foreground">Retention Prob.</p>
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-center">
              <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-primary">{latest.expansion_probability ?? 0}%</p>
              <p className="text-[10px] text-muted-foreground">Expansion Prob.</p>
            </div>
            <div className="bg-warning/5 border border-warning/10 rounded-lg p-3 text-center">
              <Sparkles className="w-4 h-4 text-warning mx-auto mb-1" />
              <p className="text-lg font-bold text-warning">{latest.confidence_score ?? 0}%</p>
              <p className="text-[10px] text-muted-foreground">AI Confidence</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <FileText className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-bold text-foreground">{latest.client_status || "—"}</p>
              <p className="text-[10px] text-muted-foreground">Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex items-center gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Tab content — identical to Team Lead view (read-only) */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Executive Summary</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{latest.executive_summary || "No summary available."}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-success" />Strengths</CardTitle></CardHeader>
              <CardContent>
                {strengths.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">No strengths listed</p> : (
                  <div className="space-y-2">{strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-success/5 border border-success/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-1.5" />
                      <p className="text-xs leading-relaxed">{s}</p>
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-destructive" />Concerns</CardTitle></CardHeader>
              <CardContent>
                {concerns.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">No concerns flagged</p> : (
                  <div className="space-y-2">{concerns.map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-1.5" />
                      <p className="text-xs leading-relaxed">{c}</p>
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "health" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Score Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Retention Probability", value: latest.retention_probability ?? 0, color: "bg-success" },
                  { label: "Expansion Probability", value: latest.expansion_probability ?? 0, color: "bg-primary" },
                  { label: "AI Confidence", value: latest.confidence_score ?? 0, color: "bg-warning" },
                  { label: "Overall Health", value: latest.overall_health_score ?? 0, color: latest.overall_health_score >= 80 ? "bg-success" : latest.overall_health_score >= 60 ? "bg-warning" : "bg-destructive" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground w-44 shrink-0">{label}</p>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
                    </div>
                    <span className="text-xs font-semibold w-8 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Health Score Trend</CardTitle></CardHeader>
            <CardContent>
              {trendData.length < 2 ? (
                <div className="h-48 flex items-center justify-center"><p className="text-xs text-muted-foreground">Not enough data yet.</p></div>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="mgrClientHealthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }} formatter={(v) => [`${v}`, "Health Score"]} />
                      <Area type="monotone" dataKey="score" stroke="#2563eb" fill="url(#mgrClientHealthGrad)" strokeWidth={2} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "risk" && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-destructive" />Risk Signals</CardTitle></CardHeader>
          <CardContent>
            {concerns.length === 0 ? (
              <EmptyState icon="check" title="No risk signals detected" description="This account appears healthy with no flagged concerns." />
            ) : (
              <div className="space-y-3">
                {concerns.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Risk Signal {i + 1}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "opportunities" && (
        <div className="space-y-4">
          {!crossSell ? (
            <Card><CardContent className="p-0"><EmptyState icon="sparkles" title="No cross-sell data" description="Cross-sell opportunities will appear after AI analysis." /></CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-semibold">Cross-Sell Intelligence</p>
                    <p className="text-xs text-muted-foreground">{crossSell.executive_summary || "AI-generated expansion opportunities."}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">{crossSell.opportunity_level} Opportunity</Badge>
                    <span className="text-sm font-bold text-success">{formatCurrency(crossSell.potential_revenue)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {toArray(crossSell.recommended_services).map((svc, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                      <p className="text-xs font-medium">{svc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "actions" && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-primary" />Recommended Next Actions</CardTitle></CardHeader>
          <CardContent>
            {recommendations.length === 0 && priorityActions.length === 0 ? (
              <EmptyState icon="check" title="No actions recommended" description="Actions will appear once AI analyzes the latest report." />
            ) : (
              <div className="space-y-2">
                {[...priorityActions, ...recommendations].map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 shrink-0 mt-0.5 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-muted-foreground">{i + 1}</span>
                    </div>
                    <p className="text-xs leading-relaxed">{action}</p>
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
