"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  Search, Activity, ShieldCheck, TrendingUp, Zap, Calendar,
  RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";

// PRD §9: Manager Clients Page — /manager/clients

interface AccountRow {
  id: string;
  user_id: string;
  company_name: string;
  uploaded_by: string;
  overall_health_score: number;
  health_grade: string;
  risk_level: string;
  retention_probability: number;
  expansion_probability: number;
  confidence_score: number;
  created_at: string;
}

interface TeamLeadOption {
  id: string;
  full_name: string;
}

function getHealthBadge(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: "Healthy", cls: "bg-success/10 text-success border-success/20" };
  if (score >= 65) return { label: "Watch", cls: "bg-warning/10 text-warning border-warning/20" };
  if (score >= 45) return { label: "At Risk", cls: "bg-orange-500/10 text-orange-600 border-orange-200" };
  return { label: "Critical", cls: "bg-destructive/10 text-destructive border-destructive/20" };
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 65) return "bg-warning";
  if (score >= 45) return "bg-orange-500";
  return "bg-destructive";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PAGE_SIZE = 12;

function AccountCard({
  row, teamLeadName, onClick,
}: {
  row: AccountRow;
  teamLeadName: string;
  onClick: () => void;
}) {
  const health = getHealthBadge(row.overall_health_score);
  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer group border-border hover:border-primary/20"
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
                {(row.company_name || "?").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {row.company_name || "Unknown"}
              </p>
              <p className="text-[10px] text-muted-foreground">Owner: {teamLeadName}</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] shrink-0 ${health.cls}`}>
            {health.label}
          </Badge>
        </div>

        {/* Health Score Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Health Score</span>
            <span className="text-sm font-bold">{row.overall_health_score} / 100</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getScoreBarColor(row.overall_health_score)}`}
              style={{ width: `${row.overall_health_score}%` }}
            />
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="flex flex-col items-center p-1.5 bg-muted/30 rounded-lg">
            <ShieldCheck className="w-3 h-3 text-success mb-0.5" />
            <span className="text-xs font-semibold text-success">{row.retention_probability ?? 0}%</span>
            <span className="text-[9px] text-muted-foreground">Retention</span>
          </div>
          <div className="flex flex-col items-center p-1.5 bg-muted/30 rounded-lg">
            <Zap className="w-3 h-3 text-primary mb-0.5" />
            <span className="text-xs font-semibold text-primary">{row.expansion_probability ?? 0}%</span>
            <span className="text-[9px] text-muted-foreground">Expansion</span>
          </div>
          <div className="flex flex-col items-center p-1.5 bg-muted/30 rounded-lg">
            <Activity className="w-3 h-3 text-warning mb-0.5" />
            <span className="text-xs font-semibold text-warning">{row.confidence_score ?? 0}%</span>
            <span className="text-[9px] text-muted-foreground">Confidence</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground">
            {row.risk_level || "—"} Risk
          </Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {timeAgo(row.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ManagerClientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [teamLeads, setTeamLeads] = useState<TeamLeadOption[]>([]);
  const [teamLeadMap, setTeamLeadMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterHealth, setFilterHealth] = useState<"all" | "healthy" | "watch" | "at_risk" | "critical">("all");
  const [filterTeamLead, setFilterTeamLead] = useState<string>("all");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Get team leads for this manager
      const { data: tls } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("manager_id", user.id)
        .eq("role", "team_lead");
      const leads = (tls ?? []) as TeamLeadOption[];
      setTeamLeads(leads);
      const leadMap = new Map<string, string>();
      leads.forEach((l) => leadMap.set(l.id, l.full_name));
      setTeamLeadMap(leadMap);

      if (leads.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const leadIds = leads.map((l) => l.id);

      // PRD §9: All clients belonging to Team Leads — deduplicated by company
      const { data: healthData, error: dbErr } = await supabase
        .from("client_health_scores")
        .select("*")
        .in("user_id", leadIds)
        .order("created_at", { ascending: false });
      if (dbErr) throw dbErr;

      // Deduplicate: latest per user_id + company_name
      const seen = new Set<string>();
      const deduped: AccountRow[] = [];
      for (const r of (healthData ?? []) as AccountRow[]) {
        const key = `${r.user_id}:${(r.company_name || "").toLowerCase()}`;
        if (!seen.has(key)) { seen.add(key); deduped.push(r); }
      }
      setRows(deduped);
    } catch (e) {
      console.error(e);
      setError("Unable to load clients. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // PRD §23: Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("mgr-clients-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "client_health_scores" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchData]);

  // PRD §9: Filters — health + team lead + search
  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.company_name || "").toLowerCase().includes(q);
    let matchHealth = true;
    if (filterHealth !== "all") {
      const h = getHealthBadge(r.overall_health_score);
      matchHealth = h.label.toLowerCase().replace(" ", "_") === filterHealth;
    }
    const matchTL = filterTeamLead === "all" || r.user_id === filterTeamLead;
    return matchSearch && matchHealth && matchTL;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (error) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-xl font-semibold">All Clients</h1></div>
        <ErrorState title="Unable to load clients" description={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">All Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${filtered.length} client${filtered.length !== 1 ? "s" : ""} across your team`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* PRD §9: Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search client/company…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-xs bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>

        {/* Health filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {(["all", "healthy", "watch", "at_risk", "critical"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilterHealth(f); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterHealth === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f === "at_risk" ? "At Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* PRD §9: Filter by Team Lead */}
        {teamLeads.length > 1 && (
          <Select value={filterTeamLead} onValueChange={(v: string | null) => { setFilterTeamLead(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue placeholder="Filter by Team Lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team Leads</SelectItem>
              {teamLeads.map((tl) => (
                <SelectItem key={tl.id} value={tl.id}>{tl.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5 space-y-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent></Card>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <Card><CardContent className="p-0">
          <EmptyState
            icon="users"
            title={rows.length === 0 ? "No Client Data Yet" : "No matching clients"}
            description={rows.length === 0 ? "Your Team Leads have not submitted reports yet." : "Try adjusting your search or filters."}
          />
        </CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map((row) => (
              <AccountCard
                key={row.id}
                row={row}
                teamLeadName={teamLeadMap.get(row.user_id) || "—"}
                onClick={() => router.push(`/manager/clients/${row.id}`)}
              />
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <Button key={i} variant={page === i + 1 ? "default" : "outline"} size="icon" className="h-7 w-7 text-xs" onClick={() => setPage(i + 1)}>
                    {i + 1}
                  </Button>
                ))}
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
