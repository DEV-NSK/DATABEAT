"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, Sparkles, RefreshCw, DollarSign, Target,
  CheckCircle2, AlertCircle, Clock, ChevronRight, Building2, Calendar,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ClientCrossSell {
  id: string;
  user_id: string;
  report_id?: string;
  company_name?: string;
  uploaded_by?: string;
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
  status: string;
  created_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function toArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch { return [value]; }
  }
  return [];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || !num) return "—";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}

function getOpportunityLevelBadge(level: string): string {
  const l = level?.toLowerCase();
  if (l === "high") return "bg-success/10 text-success border-success/20";
  if (l === "medium") return "bg-warning/10 text-warning border-warning/20";
  if (l === "low") return "bg-orange-500/10 text-orange-600 border-orange-200";
  return "bg-muted text-muted-foreground border-border";
}

function getPriorityBadge(priority: string): string {
  const p = priority?.toLowerCase();
  if (p === "critical") return "bg-destructive/10 text-destructive border-destructive/20";
  if (p === "high") return "bg-orange-500/10 text-orange-600 border-orange-200";
  if (p === "medium") return "bg-warning/10 text-warning border-warning/20";
  if (p === "low") return "bg-success/10 text-success border-success/20";
  return "bg-muted text-muted-foreground border-border";
}

function getDecisionIcon(decision: string): typeof CheckCircle2 {
  const d = decision?.toLowerCase();
  if (d?.includes("strong")) return CheckCircle2;
  if (d?.includes("possible")) return AlertCircle;
  return Clock;
}

// ─── Opportunity Card ──────────────────────────────────────────────────────

function OpportunityCard({ row, onClick }: { row: ClientCrossSell; onClick: () => void }) {
  const services = toArray(row.recommended_services);
  const reasons = toArray(row.reasons);
  const DecisionIcon = getDecisionIcon(row.decision);

  return (
    <Card
      className="hover:shadow-sm transition-shadow cursor-pointer hover:border-primary/20"
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {row.company_name || "Unknown Client"}
                </p>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${getOpportunityLevelBadge(row.opportunity_level)}`}
                >
                  {row.opportunity_level || "—"} Opportunity
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(row.created_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-success">{formatCurrency(row.potential_revenue)}</p>
            <p className="text-[10px] text-muted-foreground">Potential Revenue</p>
          </div>
        </div>

        {/* Recommended Services */}
        {services.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
              Recommended Products
            </p>
            <div className="flex flex-wrap gap-1.5">
              {services.slice(0, 3).map((svc, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/5 text-primary border border-primary/10"
                >
                  {svc}
                </span>
              ))}
              {services.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{services.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Reason */}
        {reasons[0] && (
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            {reasons[0]}
          </p>
        )}

        {/* Footer metrics */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            {/* Confidence */}
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-warning" />
              <span className="text-xs font-semibold">{row.confidence_score ?? 0}%</span>
              <span className="text-[10px] text-muted-foreground">confidence</span>
            </div>
            {/* Priority */}
            <Badge variant="outline" className={`text-[9px] ${getPriorityBadge(row.priority)}`}>
              {row.priority || "—"}
            </Badge>
          </div>
          {/* Decision */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DecisionIcon className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{row.decision || "—"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<ClientCrossSell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<"all" | "high" | "medium" | "low">("all");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from("client_cross_sell")
        .select("*")
        .eq("user_id", user.id)
        .order("confidence_score", { ascending: false });

      if (dbError) throw dbError;
      setRows((data ?? []) as ClientCrossSell[]);
    } catch (err: unknown) {
      console.error("Cross-sell fetch error:", err);
      setError("Unable to load opportunities. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("cross-sell-list-rt")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "client_cross_sell",
        filter: `user_id=eq.${user.id}`,
      }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  const filtered = rows.filter((r) => {
    if (filterLevel === "all") return true;
    return (r.opportunity_level || "").toLowerCase() === filterLevel;
  });

  const highCount = rows.filter((r) => (r.opportunity_level || "").toLowerCase() === "high").length;
  const medCount = rows.filter((r) => (r.opportunity_level || "").toLowerCase() === "medium").length;
  const lowCount = rows.filter((r) => (r.opportunity_level || "").toLowerCase() === "low").length;

  const totalRevenue = rows.reduce((sum, r) => {
    const val = typeof r.potential_revenue === "string" ? parseFloat(r.potential_revenue) : r.potential_revenue;
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Opportunities</h1>
        </div>
        <ErrorState title="Unable to load opportunities" description={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated cross-sell and expansion opportunities from your assigned clients
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

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{loading ? "—" : rows.length}</p>
              <p className="text-xs text-muted-foreground">Total Opportunities</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold text-success">{loading ? "—" : highCount}</p>
              <p className="text-xs text-muted-foreground">High Opportunity</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-xl font-bold text-warning">{loading ? "—" : medCount}</p>
              <p className="text-xs text-muted-foreground">Medium Opportunity</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold text-success">{loading ? "—" : formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Total Potential Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 flex-wrap">
        {(["all", "high", "medium", "low"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterLevel(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterLevel === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "high" && ` (${highCount})`}
            {f === "medium" && ` (${medCount})`}
            {f === "low" && ` (${lowCount})`}
          </button>
        ))}
      </div>

      {/* Opportunity Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon="sparkles"
              title={filterLevel === "all" ? "No opportunities yet" : `No ${filterLevel} opportunities`}
              description={
                filterLevel === "all"
                  ? "Upload a weekly report to generate AI-powered expansion opportunities for your clients."
                  : "No opportunities match this level."
              }
              action={
                filterLevel === "all"
                  ? { label: "Upload Weekly Report", onClick: () => router.push("/weekly-reports") }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((row) => (
            <OpportunityCard
              key={row.id}
              row={row}
              onClick={() => router.push(`/clients/${row.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
