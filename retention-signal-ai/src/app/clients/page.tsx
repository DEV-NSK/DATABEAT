"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  Search, Activity, ShieldCheck, TrendingUp,
  Zap, Calendar, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AccountRow {
  id: string;
  company_name: string;
  uploaded_by: string;
  overall_health_score: number;
  health_grade: string;
  risk_level: string;
  client_status: string;
  retention_probability: number;
  expansion_probability: number;
  confidence_score: number;
  report_id: string;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getHealthBadge(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: "Healthy", cls: "bg-success/10 text-success border-success/20" };
  if (score >= 65) return { label: "Watch", cls: "bg-warning/10 text-warning border-warning/20" };
  if (score >= 45) return { label: "At Risk", cls: "bg-orange-500/10 text-orange-600 border-orange-200" };
  return { label: "Critical", cls: "bg-destructive/10 text-destructive border-destructive/20" };
}

function getRiskBadge(risk: string): string {
  const r = risk?.toLowerCase();
  if (r === "low") return "bg-success/10 text-success border-success/20";
  if (r === "medium") return "bg-warning/10 text-warning border-warning/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 65) return "bg-warning";
  if (score >= 45) return "bg-orange-500";
  return "bg-destructive";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PAGE_SIZE = 10;

// ── Account Card ──────────────────────────────────────────────────────────────

function AccountCard({ row, onClick }: { row: AccountRow; onClick: () => void }) {
  const health = getHealthBadge(row.overall_health_score);
  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer group border-border hover:border-primary/20"
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
                {(row.company_name || "?").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {row.company_name || "Unknown Company"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {row.uploaded_by || "—"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] shrink-0 ${health.cls}`}>
            {health.label}
          </Badge>
        </div>

        {/* Health Score Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">Health Score</span>
            <span className="text-sm font-bold text-foreground">{row.overall_health_score} / 100</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getScoreBarColor(row.overall_health_score)}`}
              style={{ width: `${row.overall_health_score}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center p-2 bg-muted/30 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-success mb-1" />
            <span className="text-xs font-semibold text-success">{row.retention_probability ?? 0}%</span>
            <span className="text-[9px] text-muted-foreground text-center">Retention</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted/30 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-primary mb-1" />
            <span className="text-xs font-semibold text-primary">{row.expansion_probability ?? 0}%</span>
            <span className="text-[9px] text-muted-foreground text-center">Expansion</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted/30 rounded-lg">
            <Activity className="w-3.5 h-3.5 text-warning mb-1" />
            <span className="text-xs font-semibold text-warning">{row.confidence_score ?? 0}%</span>
            <span className="text-[9px] text-muted-foreground text-center">Confidence</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={`text-[9px] ${getRiskBadge(row.risk_level)}`}>
              {row.risk_level || "—"} Risk
            </Badge>
            {row.health_grade && (
              <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                Grade {row.health_grade}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {timeAgo(row.created_at)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterHealth, setFilterHealth] = useState<"all" | "healthy" | "watch" | "at_risk" | "critical">("all");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("client_health_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (dbErr) throw dbErr;
      // Dedupe by company name — keep latest per company
      const seen = new Set<string>();
      const deduped: AccountRow[] = [];
      for (const row of (data ?? []) as AccountRow[]) {
        const key = (row.company_name || "").toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(row);
        }
      }
      setRows(deduped);
    } catch (e) {
      console.error(e);
      setError("Unable to load accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("clients-page-rt")
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "client_health_scores", filter: `user_id=eq.${user.id}`,
      }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchData]);

  // Filter
  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.company_name || "").toLowerCase().includes(q) || (r.uploaded_by || "").toLowerCase().includes(q);
    let matchHealth = true;
    if (filterHealth !== "all") {
      const h = getHealthBadge(r.overall_health_score);
      matchHealth = h.label.toLowerCase().replace(" ", "_") === filterHealth;
    }
    return matchSearch && matchHealth;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterClick = (f: typeof filterHealth) => {
    setFilterHealth(f);
    setPage(1);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">My Clients</h1>
        </div>
        <ErrorState title="Unable to load clients" description={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">My Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${filtered.length} client${filtered.length !== 1 ? "s" : ""} · AI-powered health intelligence`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by company, manager…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-xs bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {(["all", "healthy", "watch", "at_risk", "critical"] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterClick(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterHealth === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f === "at_risk" ? "At Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-6 w-2/3 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon="users"
              title={search || filterHealth !== "all" ? "No matching accounts" : "No accounts yet"}
              description={
                search || filterHealth !== "all"
                  ? "Try adjusting your search or filter."
                  : "Upload your first weekly report to generate account intelligence."
              }
              action={
                !search && filterHealth === "all"
                  ? { label: "Go to Weekly Reports", onClick: () => router.push("/weekly-reports") }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map((row) => (
              <AccountCard
                key={row.id}
                row={row}
                onClick={() => router.push(`/clients/${row.id}`)}
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
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-7 text-xs"
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
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
