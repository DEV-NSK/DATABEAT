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
import { ErrorState } from "@/components/shared/error-state";
import {
  Users, Activity, AlertTriangle, TrendingUp, CheckCircle,
  Eye, ShieldCheck, Zap, FileText, RefreshCw, ChevronRight,
  Clock, CheckCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamLeadRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface TeamLeadStats {
  id: string;
  full_name: string;
  clientCount: number;
  avgHealth: number;
  atRisk: number;
  critical: number;
  reportsThisMonth: number;
  lastReportDate: string | null;
  lastReportStatus: string | null;
}

interface HealthSummary {
  total: number;
  healthy: number;
  watch: number;
  atRisk: number;
  critical: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHealthCategory(score: number): "healthy" | "watch" | "atRisk" | "critical" {
  if (score >= 80) return "healthy";
  if (score >= 65) return "watch";
  if (score >= 45) return "atRisk";
  return "critical";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function isOverdue(lastReportDate: string | null): boolean {
  if (!lastReportDate) return true;
  const diff = Date.now() - new Date(lastReportDate).getTime();
  return diff > 7 * 24 * 60 * 60 * 1000; // > 7 days
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [teamLeads, setTeamLeads] = useState<TeamLeadRow[]>([]);
  const [teamLeadStats, setTeamLeadStats] = useState<TeamLeadStats[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary>({ total: 0, healthy: 0, watch: 0, atRisk: 0, critical: 0 });
  const [priorityRisks, setPriorityRisks] = useState<Array<{ company: string; teamLead: string; score: number; signal: string }>>([]);
  const [topOpportunities, setTopOpportunities] = useState<Array<{ company: string; teamLead: string; revenue: string; confidence: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Team Leads under this manager
      const { data: tls, error: tlErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("manager_id", user.id)
        .eq("role", "team_lead");
      if (tlErr) throw tlErr;
      const leads = (tls ?? []) as TeamLeadRow[];
      setTeamLeads(leads);

      if (leads.length === 0) {
        setLoading(false);
        return;
      }

      const leadIds = leads.map((l) => l.id);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // 2. Fetch client_health_scores for all team leads
      const { data: healthData } = await supabase
        .from("client_health_scores")
        .select("id, user_id, company_name, overall_health_score, concerns, created_at")
        .in("user_id", leadIds)
        .order("created_at", { ascending: false });
      const allHealth = (healthData ?? []) as Array<{
        id: string; user_id: string; company_name: string;
        overall_health_score: number; concerns: unknown; created_at: string;
      }>;

      // Deduplicate: latest per company per team lead
      const seen = new Set<string>();
      const deduped = allHealth.filter((r) => {
        const key = `${r.user_id}:${(r.company_name || "").toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Health summary (unique clients across team)
      const globalSeen = new Set<string>();
      const uniqueClients = deduped.filter((r) => {
        const key = (r.company_name || "").toLowerCase();
        if (globalSeen.has(key)) return false;
        globalSeen.add(key);
        return true;
      });

      const summary: HealthSummary = {
        total: uniqueClients.length,
        healthy: uniqueClients.filter((r) => r.overall_health_score >= 80).length,
        watch: uniqueClients.filter((r) => r.overall_health_score >= 65 && r.overall_health_score < 80).length,
        atRisk: uniqueClients.filter((r) => r.overall_health_score >= 45 && r.overall_health_score < 65).length,
        critical: uniqueClients.filter((r) => r.overall_health_score < 45).length,
      };
      setHealthSummary(summary);

      // 3. Fetch weekly reports this month for all team leads
      const { data: reportsData } = await supabase
        .from("weekly_reports")
        .select("id, user_id, client_name, created_at")
        .in("user_id", leadIds)
        .gte("created_at", monthStart)
        .order("created_at", { ascending: false });
      const allReports = (reportsData ?? []) as Array<{ id: string; user_id: string; client_name: string; created_at: string }>;

      // Latest report per team lead (for overdue tracking)
      const { data: allReportsData } = await supabase
        .from("weekly_reports")
        .select("id, user_id, client_name, created_at")
        .in("user_id", leadIds)
        .order("created_at", { ascending: false });
      const allReportsFull = (allReportsData ?? []) as Array<{ id: string; user_id: string; client_name: string; created_at: string }>;

      // 4. Build per-team-lead stats
      const stats: TeamLeadStats[] = leads.map((lead) => {
        const leadHealth = deduped.filter((r) => r.user_id === lead.id);
        const clientCount = leadHealth.length;
        const avgHealth = clientCount > 0
          ? Math.round(leadHealth.reduce((s, r) => s + r.overall_health_score, 0) / clientCount)
          : 0;
        const atRisk = leadHealth.filter((r) => r.overall_health_score >= 45 && r.overall_health_score < 65).length;
        const critical = leadHealth.filter((r) => r.overall_health_score < 45).length;
        const reportsThisMonth = allReports.filter((r) => r.user_id === lead.id).length;
        const leadLatestReport = allReportsFull.find((r) => r.user_id === lead.id);

        return {
          id: lead.id,
          full_name: lead.full_name,
          clientCount,
          avgHealth,
          atRisk,
          critical,
          reportsThisMonth,
          lastReportDate: leadLatestReport?.created_at ?? null,
          lastReportStatus: leadLatestReport ? "Completed" : null,
        };
      });
      setTeamLeadStats(stats);

      // 5. Priority risks — bottom 3 clients by score
      const riskMap = new Map<string, string>(); // company → team lead name
      for (const r of deduped) {
        const lead = leads.find((l) => l.id === r.user_id);
        if (lead) riskMap.set(r.company_name, lead.full_name);
      }
      const risks = deduped
        .filter((r) => r.overall_health_score < 65)
        .sort((a, b) => a.overall_health_score - b.overall_health_score)
        .slice(0, 5)
        .map((r) => {
          const concerns = Array.isArray(r.concerns) ? r.concerns[0] : (typeof r.concerns === "string" ? r.concerns : "Risk detected");
          return {
            company: r.company_name || "Unknown",
            teamLead: riskMap.get(r.company_name) || "—",
            score: r.overall_health_score,
            signal: (concerns as string) || "Health score below threshold",
          };
        });
      setPriorityRisks(risks);

      // 6. Top opportunities from client_cross_sell
      const { data: csData } = await supabase
        .from("client_cross_sell")
        .select("company_name, potential_revenue, confidence_score, user_id")
        .in("user_id", leadIds)
        .order("confidence_score", { ascending: false })
        .limit(5);
      const csLeadMap = new Map<string, string>();
      for (const r of (csData ?? []) as Array<{ company_name: string; potential_revenue: number; confidence_score: number; user_id: string }>) {
        const lead = leads.find((l) => l.id === r.user_id);
        csLeadMap.set(r.company_name, lead?.full_name || "—");
      }
      const opps = ((csData ?? []) as Array<{ company_name: string; potential_revenue: number; confidence_score: number; user_id: string }>).map((r) => ({
        company: r.company_name || "Unknown",
        teamLead: csLeadMap.get(r.company_name) || "—",
        revenue: formatCurrency(r.potential_revenue),
        confidence: r.confidence_score,
      }));
      setTopOpportunities(opps);
    } catch (err) {
      console.error("Manager dashboard fetch error:", err);
      setError("Unable to load team performance. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // PRD §23: Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    const channels = [
      supabase.channel("mgr-health-rt").on("postgres_changes", { event: "INSERT", schema: "public", table: "client_health_scores" }, () => fetchData()),
      supabase.channel("mgr-cross-sell-rt").on("postgres_changes", { event: "INSERT", schema: "public", table: "client_cross_sell" }, () => fetchData()),
      supabase.channel("mgr-reports-rt").on("postgres_changes", { event: "INSERT", schema: "public", table: "weekly_reports" }, () => fetchData()),
    ];
    channels.forEach((ch) => ch.subscribe());
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); };
  }, [user, fetchData]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Manager Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor team performance and client health across your assigned Team Leads.</p>
        </div>
        <ErrorState title="Unable to Load Team Performance" description={error} onRetry={fetchData} />
      </div>
    );
  }

  // PRD §24: Empty state — no team leads assigned
  const noTeamLeads = !loading && teamLeads.length === 0;

  return (
    <div className="space-y-6">
      {/* Header — PRD §5 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Manager Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor team performance and client health across your assigned Team Leads.
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {noTeamLeads ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon="users"
              title="No Team Leads Assigned"
              description="Your team has not been configured yet. Contact your administrator to assign Team Leads."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* PRD §5.1: KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard
              icon={<Users className="w-4 h-4 text-primary" />}
              bg="bg-primary/10"
              label="Total Team Leads"
              value={loading ? "—" : String(teamLeads.length)}
            />
            <KpiCard
              icon={<Activity className="w-4 h-4 text-primary" />}
              bg="bg-primary/10"
              label="Total Clients"
              value={loading ? "—" : String(healthSummary.total)}
            />
            <KpiCard
              icon={<CheckCircle className="w-4 h-4 text-success" />}
              bg="bg-success/10"
              label="Healthy"
              value={loading ? "—" : String(healthSummary.healthy)}
              valueColor="text-success"
            />
            <KpiCard
              icon={<Eye className="w-4 h-4 text-warning" />}
              bg="bg-warning/10"
              label="Watch"
              value={loading ? "—" : String(healthSummary.watch)}
              valueColor="text-warning"
            />
            <KpiCard
              icon={<AlertTriangle className="w-4 h-4 text-orange-600" />}
              bg="bg-orange-500/10"
              label="At Risk"
              value={loading ? "—" : String(healthSummary.atRisk)}
              valueColor="text-orange-600"
            />
            <KpiCard
              icon={<AlertTriangle className="w-4 h-4 text-destructive" />}
              bg="bg-destructive/10"
              label="Critical"
              value={loading ? "—" : String(healthSummary.critical)}
              valueColor="text-destructive"
            />
          </div>

          {/* PRD §6: Team Performance Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
                </div>
              ) : teamLeadStats.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No team lead data available yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {["Team Lead", "Clients", "Avg Health", "At Risk", "Reports"].map((h) => (
                          <th key={h} className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                        <th className="py-2 px-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {teamLeadStats.map((tl) => (
                        <tr
                          key={tl.id}
                          className="hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/manager/team-leads/${tl.id}`)}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-primary">
                                  {tl.full_name.slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-foreground">{tl.full_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-foreground font-medium">{tl.clientCount}</td>
                          <td className="py-3 px-3">
                            <span className={`font-semibold ${tl.avgHealth >= 80 ? "text-success" : tl.avgHealth >= 65 ? "text-warning" : "text-destructive"}`}>
                              {tl.avgHealth}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {tl.atRisk > 0 || tl.critical > 0 ? (
                              <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">
                                {tl.atRisk + tl.critical}
                              </Badge>
                            ) : (
                              <span className="text-success text-[10px]">0</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-foreground">{tl.reportsThisMonth}</td>
                          <td className="py-3 px-3">
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom row: Priority Risks + Top Opportunities + Report Submission Monitoring */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Priority Risks */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Priority Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded" />)}</div>
                ) : priorityRisks.length === 0 ? (
                  <div className="py-6 text-center">
                    <ShieldCheck className="w-8 h-8 text-success mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No Active Risks</p>
                    <p className="text-[10px] text-muted-foreground">All clients are currently healthy.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {priorityRisks.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-1.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-medium truncate">{risk.company}</p>
                            <span className="text-[10px] font-bold text-destructive ml-2 shrink-0">{risk.score}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Owner: {risk.teamLead}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{risk.signal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Opportunities */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  Top Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded" />)}</div>
                ) : topOpportunities.length === 0 ? (
                  <div className="py-6 text-center">
                    <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No opportunities yet</p>
                    <p className="text-[10px] text-muted-foreground">Team Leads need to submit reports first.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topOpportunities.map((opp, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-success/5 border border-success/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-1.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-medium truncate">{opp.company}</p>
                            <span className="text-[10px] font-bold text-success ml-2 shrink-0">{opp.revenue}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Owner: {opp.teamLead}</p>
                          <p className="text-[10px] text-muted-foreground">{opp.confidence}% confidence</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PRD §14: Report Submission Monitoring */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Weekly Report Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded" />)}</div>
                ) : teamLeadStats.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No team leads assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {teamLeadStats.map((tl) => {
                      const overdue = isOverdue(tl.lastReportDate);
                      return (
                        <div key={tl.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${overdue ? "bg-warning/5 border-warning/20" : "bg-success/5 border-success/10"}`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${overdue ? "bg-warning/10" : "bg-success/10"}`}>
                            {overdue ? (
                              <Clock className="w-3.5 h-3.5 text-warning" />
                            ) : (
                              <CheckCheck className="w-3.5 h-3.5 text-success" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{tl.full_name}</p>
                            {overdue ? (
                              <p className="text-[10px] text-warning font-medium">⚠ Report overdue</p>
                            ) : (
                              <>
                                <p className="text-[10px] text-muted-foreground">
                                  Last Report: {tl.lastReportDate ? new Date(tl.lastReportDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                </p>
                                <p className="text-[10px] text-success">Status: Completed</p>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon, bg, label, value, valueColor = "text-foreground",
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || !num) return "—";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}
