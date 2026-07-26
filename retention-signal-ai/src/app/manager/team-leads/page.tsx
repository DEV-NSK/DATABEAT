"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Users, RefreshCw, BarChart3, AlertTriangle, Activity, FileText } from "lucide-react";

// PRD §7: Team Leads Page — /manager/team-leads

interface TeamLeadCard {
  id: string;
  full_name: string;
  clientCount: number;
  avgHealthScore: number;
  atRisk: number;
  critical: number;
  reportsThisMonth: number;
}

export default function ManagerTeamLeadsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teamLeads, setTeamLeads] = useState<TeamLeadCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch team leads under this manager — PRD §7: profiles.manager_id = auth.uid()
      const { data: tls, error: tlErr } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("manager_id", user.id)
        .eq("role", "team_lead");
      if (tlErr) throw tlErr;
      const leads = (tls ?? []) as Array<{ id: string; full_name: string; email: string }>;

      if (leads.length === 0) {
        setTeamLeads([]);
        setLoading(false);
        return;
      }

      const leadIds = leads.map((l) => l.id);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch health scores for all team leads
      const { data: healthData } = await supabase
        .from("client_health_scores")
        .select("user_id, company_name, overall_health_score")
        .in("user_id", leadIds);

      const allHealth = (healthData ?? []) as Array<{ user_id: string; company_name: string; overall_health_score: number }>;

      // Deduplicate per team lead per company (latest)
      const seen = new Set<string>();
      const deduped = allHealth.filter((r) => {
        const key = `${r.user_id}:${(r.company_name || "").toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Reports this month
      const { data: reportsData } = await supabase
        .from("weekly_reports")
        .select("user_id")
        .in("user_id", leadIds)
        .gte("created_at", monthStart);
      const allReports = (reportsData ?? []) as Array<{ user_id: string }>;

      const cards: TeamLeadCard[] = leads.map((lead) => {
        const leadHealth = deduped.filter((r) => r.user_id === lead.id);
        const clientCount = leadHealth.length;
        const avgHealthScore = clientCount > 0
          ? Math.round(leadHealth.reduce((s, r) => s + r.overall_health_score, 0) / clientCount)
          : 0;
        const atRisk = leadHealth.filter((r) => r.overall_health_score >= 45 && r.overall_health_score < 65).length;
        const critical = leadHealth.filter((r) => r.overall_health_score < 45).length;
        const reportsThisMonth = allReports.filter((r) => r.user_id === lead.id).length;

        return { id: lead.id, full_name: lead.full_name, clientCount, avgHealthScore, atRisk, critical, reportsThisMonth };
      });
      setTeamLeads(cards);
    } catch (err) {
      console.error(err);
      setError("Unable to load Team Leads. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (error) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-xl font-semibold text-foreground">My Team Leads</h1></div>
        <ErrorState title="Unable to load Team Leads" description={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">My Team Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${teamLeads.length} Team Lead${teamLeads.length !== 1 ? "s" : ""} assigned to you`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : teamLeads.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamLeads.map((tl) => (
            /* PRD §7: Team Lead Card */
            <Card key={tl.id} className="hover:shadow-md transition-all border-border hover:border-primary/20">
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {tl.full_name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{tl.full_name}</p>
                      <Badge variant="outline" className="text-[9px] mt-0.5 bg-primary/10 text-primary border-primary/20">
                        Team Lead
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <StatCell icon={<Users className="w-3.5 h-3.5 text-primary" />} label="Clients" value={String(tl.clientCount)} />
                  <StatCell
                    icon={<Activity className="w-3.5 h-3.5 text-muted-foreground" />}
                    label="Avg Health Score"
                    value={String(tl.avgHealthScore)}
                    valueColor={tl.avgHealthScore >= 80 ? "text-success" : tl.avgHealthScore >= 65 ? "text-warning" : "text-destructive"}
                  />
                  <StatCell
                    icon={<AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
                    label="At Risk"
                    value={String(tl.atRisk)}
                    valueColor={tl.atRisk > 0 ? "text-orange-500" : "text-foreground"}
                  />
                  <StatCell
                    icon={<AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                    label="Critical"
                    value={String(tl.critical)}
                    valueColor={tl.critical > 0 ? "text-destructive" : "text-foreground"}
                  />
                </div>

                {/* Reports this month */}
                <div className="flex items-center gap-2 mb-4 p-2 bg-muted/30 rounded-lg">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Reports This Month:</span>
                  <span className="text-xs font-semibold text-foreground">{tl.reportsThisMonth}</span>
                </div>

                {/* CTA */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs gap-1.5"
                  onClick={() => router.push(`/manager/team-leads/${tl.id}`)}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  View Performance
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCell({
  icon, label, value, valueColor = "text-foreground",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg">
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={`text-sm font-semibold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}
