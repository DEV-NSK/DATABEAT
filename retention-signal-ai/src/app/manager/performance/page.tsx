"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { BarChart3, RefreshCw, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";

// PRD §15: Performance Page — /manager/performance
// Compares all Team Leads

type SortKey = "health_high" | "health_low" | "at_risk" | "retention" | "expansion";

interface TeamLeadPerf {
  id: string;
  full_name: string;
  clientCount: number;
  avgHealth: number;
  retention: number;
  expansion: number;
  risk: string;
  atRisk: number;
  critical: number;
}

function getRiskLabel(atRisk: number, critical: number): { label: string; cls: string } {
  if (critical > 0) return { label: "Critical", cls: "bg-destructive/10 text-destructive border-destructive/20" };
  if (atRisk > 1) return { label: "High", cls: "bg-orange-500/10 text-orange-600 border-orange-200" };
  if (atRisk === 1) return { label: "Medium", cls: "bg-warning/10 text-warning border-warning/20" };
  return { label: "Low", cls: "bg-success/10 text-success border-success/20" };
}

export default function ManagerPerformancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teamLeads, setTeamLeads] = useState<TeamLeadPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("health_high");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: tls } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("manager_id", user.id)
        .eq("role", "team_lead");
      const leads = (tls ?? []) as Array<{ id: string; full_name: string }>;

      if (leads.length === 0) { setTeamLeads([]); setLoading(false); return; }
      const leadIds = leads.map((l) => l.id);

      const { data: healthData } = await supabase
        .from("client_health_scores")
        .select("user_id, company_name, overall_health_score, retention_probability, expansion_probability")
        .in("user_id", leadIds);
      const allHealth = (healthData ?? []) as Array<{
        user_id: string; company_name: string; overall_health_score: number;
        retention_probability: number; expansion_probability: number;
      }>;

      // Deduplicate per user_id + company
      const seen = new Set<string>();
      const deduped = allHealth.filter((r) => {
        const k = `${r.user_id}:${(r.company_name || "").toLowerCase()}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      const perfs: TeamLeadPerf[] = leads.map((lead) => {
        const lHealth = deduped.filter((r) => r.user_id === lead.id);
        const clientCount = lHealth.length;
        const avgHealth = clientCount > 0
          ? Math.round(lHealth.reduce((s, r) => s + r.overall_health_score, 0) / clientCount)
          : 0;
        const retention = clientCount > 0
          ? Math.round(lHealth.reduce((s, r) => s + (r.retention_probability || 0), 0) / clientCount)
          : 0;
        const expansion = clientCount > 0
          ? Math.round(lHealth.reduce((s, r) => s + (r.expansion_probability || 0), 0) / clientCount)
          : 0;
        const atRisk = lHealth.filter((r) => r.overall_health_score >= 45 && r.overall_health_score < 65).length;
        const critical = lHealth.filter((r) => r.overall_health_score < 45).length;
        const { label } = getRiskLabel(atRisk, critical);

        return { id: lead.id, full_name: lead.full_name, clientCount, avgHealth, retention, expansion, risk: label, atRisk, critical };
      });

      setTeamLeads(perfs);
    } catch (e) { console.error(e); setError("Unable to load performance data. Please try again."); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sorted = [...teamLeads].sort((a, b) => {
    switch (sortKey) {
      case "health_high": return b.avgHealth - a.avgHealth;
      case "health_low": return a.avgHealth - b.avgHealth;
      case "at_risk": return (b.atRisk + b.critical) - (a.atRisk + a.critical);
      case "retention": return b.retention - a.retention;
      case "expansion": return b.expansion - a.expansion;
      default: return 0;
    }
  });

  if (error) return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold">Performance</h1></div>
      <ErrorState title="Unable to Load Team Performance" description={error} onRetry={fetchData} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Performance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Compare all Team Leads across key performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {/* PRD §15: Performance Ranking sort */}
          <Select value={sortKey} onValueChange={(v: string | null) => setSortKey((v ?? "health_high") as SortKey)}>
            <SelectTrigger className="h-8 text-xs w-[200px]">
              <SelectValue placeholder="Sort by…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="health_high">Highest Health Score</SelectItem>
              <SelectItem value="health_low">Lowest Health Score</SelectItem>
              <SelectItem value="at_risk">Most At-Risk Clients</SelectItem>
              <SelectItem value="retention">Highest Retention Probability</SelectItem>
              <SelectItem value="expansion">Highest Expansion Opportunity</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : sorted.length === 0 ? (
        <Card><CardContent className="p-0">
          <EmptyState icon="users" title="No Team Leads Assigned" description="Your team has not been configured yet." />
        </CardContent></Card>
      ) : (
        <>
          {/* PRD §15: Performance Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Team Lead Performance Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["#", "Team Lead", "Clients", "Avg Health", "Retention", "Expansion", "Risk"].map((h) => (
                        <th key={h} className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                      <th className="py-2 px-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sorted.map((tl, idx) => {
                      const risk = getRiskLabel(tl.atRisk, tl.critical);
                      return (
                        <tr
                          key={tl.id}
                          className="hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/manager/team-leads/${tl.id}`)}
                        >
                          <td className="py-3 px-3 text-muted-foreground font-medium">#{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-primary">{tl.full_name.slice(0, 2).toUpperCase()}</span>
                              </div>
                              <span className="font-medium text-foreground">{tl.full_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-foreground font-medium">{tl.clientCount}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <span className={`font-semibold ${tl.avgHealth >= 80 ? "text-success" : tl.avgHealth >= 65 ? "text-warning" : "text-destructive"}`}>
                                {tl.avgHealth}
                              </span>
                              {sortKey === "health_high" && idx === 0 && <ArrowUp className="w-3 h-3 text-success" />}
                              {sortKey === "health_low" && idx === 0 && <ArrowDown className="w-3 h-3 text-destructive" />}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-success rounded-full" style={{ width: `${tl.retention}%` }} />
                              </div>
                              <span className="text-success font-medium">{tl.retention}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${tl.expansion}%` }} />
                              </div>
                              <span className="text-primary font-medium">{tl.expansion}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="outline" className={`text-[9px] ${risk.cls}`}>{risk.label}</Badge>
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
            </CardContent>
          </Card>

          {/* Detail Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((tl) => {
              const risk = getRiskLabel(tl.atRisk, tl.critical);
              return (
                <Card key={tl.id} className="hover:shadow-sm transition-shadow cursor-pointer hover:border-primary/20"
                  onClick={() => router.push(`/manager/team-leads/${tl.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{tl.full_name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{tl.full_name}</p>
                        <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">Team Lead</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Clients</p><p className="font-semibold">{tl.clientCount}</p></div>
                      <div><p className="text-muted-foreground">Avg Health</p><p className={`font-semibold ${tl.avgHealth >= 80 ? "text-success" : tl.avgHealth >= 65 ? "text-warning" : "text-destructive"}`}>{tl.avgHealth}</p></div>
                      <div><p className="text-muted-foreground">Retention</p><p className="font-semibold text-success">{tl.retention}%</p></div>
                      <div><p className="text-muted-foreground">Expansion</p><p className="font-semibold text-primary">{tl.expansion}%</p></div>
                      <div className="col-span-2"><p className="text-muted-foreground">Risk</p>
                        <Badge variant="outline" className={`text-[9px] mt-0.5 ${risk.cls}`}>{risk.label}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
