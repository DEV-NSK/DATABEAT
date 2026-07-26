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
import {
  TrendingUp, Sparkles, RefreshCw, DollarSign, Target,
  CheckCircle2, AlertCircle, Clock, ChevronRight, Calendar,
} from "lucide-react";

// PRD §12: Opportunities — /manager/opportunities
// Manager sees all cross-sell opportunities from ALL Team Leads

interface CrossSellRow {
  id: string;
  user_id: string;
  company_name?: string;
  cross_sell_score: number;
  opportunity_level: string;
  potential_revenue: number | string;
  confidence_score: number;
  executive_summary: string;
  recommended_services: string[] | string;
  reasons: string[] | string;
  next_actions: string[] | string;
  priority: string;
  decision: string;
  created_at: string;
}

interface TeamLeadOption { id: string; full_name: string; }

function toArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string") { try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch {} return [v]; }
  return [];
}

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || !num) return "—";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}

function getOpportunityBadge(level: string): string {
  const l = level?.toLowerCase();
  if (l === "high") return "bg-success/10 text-success border-success/20";
  if (l === "medium") return "bg-warning/10 text-warning border-warning/20";
  return "bg-orange-500/10 text-orange-600 border-orange-200";
}

function getPriorityBadge(priority: string): string {
  const p = priority?.toLowerCase();
  if (p === "critical") return "bg-destructive/10 text-destructive border-destructive/20";
  if (p === "high") return "bg-orange-500/10 text-orange-600 border-orange-200";
  if (p === "medium") return "bg-warning/10 text-warning border-warning/20";
  return "bg-success/10 text-success border-success/20";
}

function getDecisionIcon(decision: string): typeof CheckCircle2 {
  const d = decision?.toLowerCase();
  if (d?.includes("strong")) return CheckCircle2;
  if (d?.includes("possible")) return AlertCircle;
  return Clock;
}

export default function ManagerOpportunitiesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<CrossSellRow[]>([]);
  const [teamLeads, setTeamLeads] = useState<TeamLeadOption[]>([]);
  const [teamLeadMap, setTeamLeadMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<"all" | "high" | "medium" | "low">("all");
  const [sortBy, setSortBy] = useState<"confidence" | "revenue" | "team_lead">("confidence");
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
        .from("client_cross_sell")
        .select("*")
        .in("user_id", leadIds)
        .order("confidence_score", { ascending: false });
      if (dbErr) throw dbErr;
      setRows((data ?? []) as CrossSellRow[]);
    } catch (e) { console.error(e); setError("Unable to load opportunities. Please try again."); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("mgr-opp-rt").on("postgres_changes", { event: "INSERT", schema: "public", table: "client_cross_sell" }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchData]);

  let filtered = rows.filter((r) => {
    const matchLevel = filterLevel === "all" || (r.opportunity_level || "").toLowerCase() === filterLevel;
    const matchTL = filterTL === "all" || r.user_id === filterTL;
    return matchLevel && matchTL;
  });

  // PRD §12: Sort by confidence, potential revenue, or team lead
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "revenue") {
      const aR = typeof a.potential_revenue === "string" ? parseFloat(a.potential_revenue) : a.potential_revenue;
      const bR = typeof b.potential_revenue === "string" ? parseFloat(b.potential_revenue) : b.potential_revenue;
      return (bR || 0) - (aR || 0);
    }
    if (sortBy === "team_lead") {
      return (teamLeadMap.get(a.user_id) || "").localeCompare(teamLeadMap.get(b.user_id) || "");
    }
    return (b.confidence_score || 0) - (a.confidence_score || 0);
  });

  const highCount = rows.filter(r => (r.opportunity_level || "").toLowerCase() === "high").length;
  const medCount = rows.filter(r => (r.opportunity_level || "").toLowerCase() === "medium").length;
  const lowCount = rows.filter(r => (r.opportunity_level || "").toLowerCase() === "low").length;
  const totalRevenue = rows.reduce((s, r) => {
    const v = typeof r.potential_revenue === "string" ? parseFloat(r.potential_revenue) : r.potential_revenue;
    return s + (isNaN(v) ? 0 : v);
  }, 0);

  if (error) return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold">Opportunities</h1></div>
      <ErrorState title="Unable to load opportunities" description={error} onRetry={fetchData} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated cross-sell and expansion opportunities across all your Team Leads
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { icon: <Target className="w-4 h-4 text-primary" />, bg: "bg-primary/10", label: "Total Opportunities", value: loading ? "—" : String(rows.length), color: "" },
          { icon: <TrendingUp className="w-4 h-4 text-success" />, bg: "bg-success/10", label: "High Opportunity", value: loading ? "—" : String(highCount), color: "text-success" },
          { icon: <AlertCircle className="w-4 h-4 text-warning" />, bg: "bg-warning/10", label: "Medium Opportunity", value: loading ? "—" : String(medCount), color: "text-warning" },
          { icon: <DollarSign className="w-4 h-4 text-success" />, bg: "bg-success/10", label: "Total Potential Revenue", value: loading ? "—" : formatCurrency(totalRevenue), color: "text-success" },
        ].map(({ icon, bg, label, value, color }) => (
          <Card key={label}><CardContent className="p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
            <div>
              <p className={`text-xl font-bold ${color || "text-foreground"}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent></Card>
        ))}
      </div>

      {/* PRD §12: Filters + Sort */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          {(["all", "high", "medium", "low"] as const).map((f) => (
            <button key={f} onClick={() => setFilterLevel(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterLevel === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} {f === "high" ? `(${highCount})` : f === "medium" ? `(${medCount})` : f === "low" ? `(${lowCount})` : ""}
            </button>
          ))}
        </div>

        {/* Sort by */}
        <Select value={sortBy} onValueChange={(v: string | null) => setSortBy((v ?? "confidence") as typeof sortBy)}>
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confidence">Sort: Confidence</SelectItem>
            <SelectItem value="revenue">Sort: Revenue</SelectItem>
            <SelectItem value="team_lead">Sort: Team Lead</SelectItem>
          </SelectContent>
        </Select>

        {/* Team Lead filter */}
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

      {/* Opportunity Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-0">
          <EmptyState
            icon="sparkles"
            title="No opportunities yet"
            description="Opportunities are generated when Team Leads submit and process weekly reports."
          />
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((row) => {
            const services = toArray(row.recommended_services);
            const reasons = toArray(row.reasons);
            const DecisionIcon = getDecisionIcon(row.decision);
            const tlName = teamLeadMap.get(row.user_id) || "—";
            return (
              <Card key={row.id} className="hover:shadow-sm transition-shadow cursor-pointer hover:border-primary/20"
                onClick={() => router.push(`/manager/clients/${row.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-semibold truncate">{row.company_name || "Unknown Client"}</p>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${getOpportunityBadge(row.opportunity_level)}`}>
                            {row.opportunity_level || "—"} Opportunity
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>Team Lead: {tlName}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-success">{formatCurrency(row.potential_revenue)}</p>
                      <p className="text-[10px] text-muted-foreground">Potential Revenue</p>
                    </div>
                  </div>
                  {services.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Recommended Products</p>
                      <div className="flex flex-wrap gap-1.5">
                        {services.slice(0, 3).map((svc, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/5 text-primary border border-primary/10">{svc}</span>
                        ))}
                        {services.length > 3 && <span className="text-[10px] text-muted-foreground self-center">+{services.length - 3} more</span>}
                      </div>
                    </div>
                  )}
                  {reasons[0] && <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{reasons[0]}</p>}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-warning" />
                        <span className="text-xs font-semibold">{row.confidence_score ?? 0}%</span>
                        <span className="text-[10px] text-muted-foreground">confidence</span>
                      </div>
                      <Badge variant="outline" className={`text-[9px] ${getPriorityBadge(row.priority)}`}>{row.priority || "—"}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <DecisionIcon className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[100px]">{row.decision || "—"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
