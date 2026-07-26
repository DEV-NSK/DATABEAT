"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ArrowLeft, Users, Activity, AlertTriangle, ShieldCheck, FileText,
  RefreshCw, Calendar, ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// PRD §8: Team Lead Detail Page

interface TeamLeadProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  manager_id: string;
}

interface ClientRow {
  id: string;
  company_name: string;
  overall_health_score: number;
  risk_level: string;
  created_at: string;
}

interface TrendPoint {
  date: string;
  score: number;
}

interface HealthKpis {
  totalClients: number;
  avgHealth: number;
  healthy: number;
  atRisk: number;
  critical: number;
  reportsSubmitted: number;
}

function getHealthBadge(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: "Healthy", cls: "bg-success/10 text-success border-success/20" };
  if (score >= 65) return { label: "Watch", cls: "bg-warning/10 text-warning border-warning/20" };
  if (score >= 45) return { label: "At Risk", cls: "bg-orange-500/10 text-orange-600 border-orange-200" };
  return { label: "Critical", cls: "bg-destructive/10 text-destructive border-destructive/20" };
}

export default function TeamLeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const [profile, setProfile] = useState<TeamLeadProfile | null>(null);
  const [managerName, setManagerName] = useState<string>("");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [kpis, setKpis] = useState<HealthKpis>({ totalClients: 0, avgHealth: 0, healthy: 0, atRisk: 0, critical: 0, reportsSubmitted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch team lead profile (must be one of our team leads)
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, manager_id")
        .eq("id", id)
        .eq("manager_id", user.id) // Security: only manager's own team leads
        .single();
      if (profileErr) throw profileErr;
      const tl = profileData as TeamLeadProfile;
      setProfile(tl);

      // 2. Get manager name
      const { data: mgr } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", tl.manager_id)
        .single();
      setManagerName((mgr as { full_name: string } | null)?.full_name || "—");

      // 3. Fetch health scores for this team lead
      const { data: healthData } = await supabase
        .from("client_health_scores")
        .select("id, company_name, overall_health_score, risk_level, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false });
      const allHealth = (healthData ?? []) as ClientRow[];

      // Deduplicate by company
      const seen = new Set<string>();
      const deduped = allHealth.filter((r) => {
        const key = (r.company_name || "").toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setClients(deduped);

      // 4. KPIs
      const totalClients = deduped.length;
      const avgHealth = totalClients > 0
        ? Math.round(deduped.reduce((s, r) => s + r.overall_health_score, 0) / totalClients)
        : 0;
      const healthy = deduped.filter((r) => r.overall_health_score >= 80).length;
      const atRisk = deduped.filter((r) => r.overall_health_score >= 45 && r.overall_health_score < 65).length;
      const critical = deduped.filter((r) => r.overall_health_score < 45).length;

      // 5. Reports submitted
      const { count: reportsCount } = await supabase
        .from("weekly_reports")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id);
      setKpis({ totalClients, avgHealth, healthy, atRisk, critical, reportsSubmitted: reportsCount ?? 0 });

      // 6. Trend chart — average health over time for this team lead
      const trendPoints: TrendPoint[] = [...allHealth]
        .reverse()
        .slice(-10)
        .map((r) => ({
          date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          score: r.overall_health_score,
        }));
      setTrendData(trendPoints);
    } catch (err) {
      console.error(err);
      setError("Unable to load Team Lead details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2" onClick={() => router.push("/manager/team-leads")}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="space-y-4 animate-pulse">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2" onClick={() => router.push("/manager/team-leads")}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {error
          ? <ErrorState title="Unable to load Team Lead" description={error} onRetry={fetchData} />
          : <EmptyState icon="users" title="Team Lead not found" description="This team lead may not be assigned to you." action={{ label: "Back to Team Leads", onClick: () => router.push("/manager/team-leads") }} />
        }
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2" onClick={() => router.push("/manager/team-leads")}>
        <ArrowLeft className="w-4 h-4" /> Back to Team Leads
      </Button>

      {/* PRD §8 Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">
                {profile.full_name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-foreground">{profile.full_name}</h1>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Team Lead</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
              {/* PRD §8: Manager read-only */}
              <div className="flex items-center gap-2 mt-2 p-2 bg-muted/30 rounded-lg w-fit">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Manager:</span>
                <span className="text-xs font-medium text-foreground">{managerName}</span>
                <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground">Read Only</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shrink-0" onClick={fetchData}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PRD §8 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Clients", value: kpis.totalClients, icon: <Users className="w-4 h-4 text-primary" />, bg: "bg-primary/10", color: "text-foreground" },
          { label: "Avg Health Score", value: kpis.avgHealth, icon: <Activity className="w-4 h-4 text-muted-foreground" />, bg: "bg-muted", color: kpis.avgHealth >= 80 ? "text-success" : kpis.avgHealth >= 65 ? "text-warning" : "text-destructive" },
          { label: "Healthy Clients", value: kpis.healthy, icon: <ShieldCheck className="w-4 h-4 text-success" />, bg: "bg-success/10", color: "text-success" },
          { label: "At Risk", value: kpis.atRisk, icon: <AlertTriangle className="w-4 h-4 text-orange-500" />, bg: "bg-orange-500/10", color: "text-orange-500" },
          { label: "Critical Clients", value: kpis.critical, icon: <AlertTriangle className="w-4 h-4 text-destructive" />, bg: "bg-destructive/10", color: "text-destructive" },
          { label: "Reports Submitted", value: kpis.reportsSubmitted, icon: <FileText className="w-4 h-4 text-primary" />, bg: "bg-primary/10", color: "text-foreground" },
        ].map(({ label, value, icon, bg, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
              <div>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PRD §8 Performance Overview — Health Score Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Health Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.length < 2 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Not enough data. Team Lead needs to submit more reports.</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tlHealthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }} formatter={(v) => [`${v}`, "Health Score"]} />
                  <Area type="monotone" dataKey="score" stroke="#2563eb" fill="url(#tlHealthGrad)" strokeWidth={2} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PRD §8: Team Lead Clients table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Team Lead Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <EmptyState
              icon="users"
              title="No Client Data Yet"
              description="Your Team Leads have not submitted reports yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {["Client", "Health", "Risk", "Last Report"].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                    <th className="py-2 px-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((client) => {
                    const health = getHealthBadge(client.overall_health_score);
                    return (
                      <tr
                        key={client.id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/manager/clients/${client.id}`)}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-primary">
                                {(client.company_name || "?").slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-foreground">{client.company_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-semibold ${client.overall_health_score >= 80 ? "text-success" : client.overall_health_score >= 65 ? "text-warning" : "text-destructive"}`}>
                            {client.overall_health_score}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className={`text-[9px] ${health.cls}`}>{health.label}</Badge>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(client.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
