"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { AlertTriangle, RefreshCw, Building2, Calendar, ShieldCheck, TrendingDown, Activity } from "lucide-react";

// PRD §11: Risk Signals — /manager/risk-signals
// Manager sees risk signals across ALL assigned Team Leads

interface HealthRow {
  id: string;
  user_id: string;
  company_name: string;
  uploaded_by: string;
  overall_health_score: number;
  health_grade: string;
  risk_level: string;
  retention_probability: number;
  concerns: string[] | string;
  created_at: string;
}

interface TeamLeadOption { id: string; full_name: string; }

function toArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string") { try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch {} return [v]; }
  return [];
}

function getSeverity(score: number): { label: string; cls: string } {
  if (score < 45) return { label: "Critical", cls: "bg-destructive/10 text-destructive border-destructive/20" };
  if (score < 55) return { label: "High", cls: "bg-orange-500/10 text-orange-600 border-orange-200" };
  if (score < 65) return { label: "Medium", cls: "bg-warning/10 text-warning border-warning/20" };
  return { label: "Low", cls: "bg-success/10 text-success border-success/20" };
}

function getScoreColor(score: number) {
  if (score < 50) return "text-destructive";
  if (score < 70) return "text-warning";
  return "text-success";
}

export default function ManagerRiskSignalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<HealthRow[]>([]);
  const [teamLeads, setTeamLeads] = useState<TeamLeadOption[]>([]);
  const [teamLeadMap, setTeamLeadMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium">("all");
  const [filterTL, setFilterTL] = useState<string>("all");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: tls } = await supabase.from("profiles").select("id, full_name").eq("manager_id", user.id).eq("role", "team_lead");
      const leads = (tls ?? []) as TeamLeadOption[];
      setTeamLeads(leads);
      const tlMap = new Map<string, string>();
      leads.forEach((l) => tlMap.set(l.id, l.full_name));
      setTeamLeadMap(tlMap);

      if (leads.length === 0) { setRows([]); setLoading(false); return; }
      const leadIds = leads.map((l) => l.id);

      const { data, error: dbErr } = await supabase
        .from("client_health_scores")
        .select("id, user_id, company_name, uploaded_by, overall_health_score, health_grade, risk_level, retention_probability, concerns, created_at")
        .in("user_id", leadIds)
        .lt("overall_health_score", 75)
        .order("overall_health_score", { ascending: true });
      if (dbErr) throw dbErr;

      // Dedupe per user_id + company
      const seen = new Set<string>();
      const deduped: HealthRow[] = [];
      for (const r of (data ?? []) as HealthRow[]) {
        const k = `${r.user_id}:${(r.company_name || "").toLowerCase()}`;
        if (!seen.has(k)) { seen.add(k); deduped.push(r); }
      }
      setRows(deduped);
    } catch (e) { console.error(e); setError("Unable to load risk signals."); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("mgr-risk-rt").on("postgres_changes", { event: "INSERT", schema: "public", table: "client_health_scores" }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchData]);

  const filtered = rows.filter((r) => {
    const sev = getSeverity(r.overall_health_score).label.toLowerCase();
    const matchSev = filter === "all" || sev === filter;
    const matchTL = filterTL === "all" || r.user_id === filterTL;
    return matchSev && matchTL;
  });

  const critCount = rows.filter(r => r.overall_health_score < 45).length;
  const highCount = rows.filter(r => r.overall_health_score >= 45 && r.overall_health_score < 55).length;
  const medCount = rows.filter(r => r.overall_health_score >= 55 && r.overall_health_score < 75).length;

  if (error) return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold">Risk Signals</h1></div>
      <ErrorState title="Unable to load risk signals" description={error} onRetry={fetchData} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Risk Signals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-detected risk signals across all your Team Leads' accounts
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Critical Accounts", count: critCount, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "High Risk", count: highCount, icon: TrendingDown, color: "text-orange-600", bg: "bg-orange-500/10" },
          { label: "Medium Risk", count: medCount, icon: Activity, color: "text-warning", bg: "bg-warning/10" },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${color}`}>{loading ? "—" : count}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PRD §11: Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          {(["all", "critical", "high", "medium"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} {f !== "all" && `(${f === "critical" ? critCount : f === "high" ? highCount : medCount})`}
            </button>
          ))}
        </div>
        {/* Additional filter: Team Lead */}
        {teamLeads.length > 1 && (
          <Select value={filterTL} onValueChange={(v: string | null) => setFilterTL(v ?? "all")}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue placeholder="Filter by Team Lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team Leads</SelectItem>
              {teamLeads.map((tl) => <SelectItem key={tl.id} value={tl.id}>{tl.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* PRD §11: Risk Signal Cards — Client, Team Lead, Signal, Severity */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-0">
          <EmptyState
            icon="check"
            title={filter === "all" && filterTL === "all" ? "No Active Risks" : "No matching risk signals"}
            description={filter === "all" && filterTL === "all" ? "All clients are currently healthy." : "No signals match the selected filters."}
          />
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const sev = getSeverity(row.overall_health_score);
            const concerns = toArray(row.concerns);
            const teamLeadName = teamLeadMap.get(row.user_id) || "—";
            return (
              <Card key={row.id} className="hover:shadow-sm transition-shadow cursor-pointer hover:border-primary/20"
                onClick={() => router.push(`/manager/clients/${row.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold">{row.company_name || "Unknown"}</p>
                          <Badge variant="outline" className={`text-[10px] ${sev.cls}`}>{sev.label}</Badge>
                          <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">{row.risk_level} Risk</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />Team Lead: {teamLeadName}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                        {concerns.length > 0 && (
                          <div className="space-y-1">
                            {concerns.slice(0, 2).map((c, i) => (
                              <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-1.5" />{c}
                              </p>
                            ))}
                            {concerns.length > 2 && <p className="text-[10px] text-muted-foreground ml-3">+{concerns.length - 2} more signals</p>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-3xl font-bold ${getScoreColor(row.overall_health_score)}`}>{row.overall_health_score}</p>
                      <p className="text-[10px] text-muted-foreground">/ 100</p>
                      <div className="flex items-center gap-1 mt-2 justify-end">
                        <ShieldCheck className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{row.retention_probability ?? 0}% retention</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
