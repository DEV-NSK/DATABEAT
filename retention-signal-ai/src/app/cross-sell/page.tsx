"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Sparkles,
  CheckSquare,
  RefreshCw,
  DollarSign,
  Target,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Building2,
  User,
  FileText,
  Calendar,
} from "lucide-react";
import { SkeletonCard } from "@/components/shared/skeleton-loader";
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
  business_signals: string[] | string;
  reasons: string[] | string;
  next_actions: string[] | string;
  priority: string;
  decision: string;
  status: string;
  created_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** JSON/jsonb fields may arrive as a string — normalise to array */
function toArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch {
      return [value];
    }
  }
  return [];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
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

function getDecisionColor(decision: string): { bg: string; text: string; border: string; icon: typeof CheckCircle2 } {
  const d = decision?.toLowerCase();
  if (d?.includes("strong")) return { bg: "bg-success/10", text: "text-success", border: "border-success/20", icon: CheckCircle2 };
  if (d?.includes("possible")) return { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20", icon: AlertCircle };
  return { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", icon: Clock };
}

function getCrossSellScoreColor(score: number): string {
  if (score > 80) return "#10b981"; // green
  if (score >= 60) return "#f59e0b"; // yellow
  if (score >= 40) return "#f97316"; // orange
  return "#ef4444"; // red
}

function getCrossSellScoreLabel(score: number): string {
  if (score > 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Low";
}

// ─── Circular Progress ─────────────────────────────────────────────────────

function CircularProgress({ score }: { score: number }) {
  const size = 128;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getCrossSellScoreColor(score);
  const label = getCrossSellScoreLabel(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-muted/50"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.7s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{score}</span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <Badge
        variant="outline"
        style={{ color, borderColor: `${color}33`, backgroundColor: `${color}1a` }}
        className="text-[10px]"
      >
        {label}
      </Badge>
    </div>
  );
}

// ─── Page Skeleton ─────────────────────────────────────────────────────────

function CrossSellPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 bg-muted rounded w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonCard />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function CrossSellPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [latest, setLatest] = useState<ClientCrossSell | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────

  const fetchCrossSellData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from("client_cross_sell")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbError) throw dbError;

      setLatest(data as ClientCrossSell | null);
    } catch (err: unknown) {
      console.error("Cross-sell fetch error:", err);
      setError("Unable to load Cross Sell Intelligence. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchCrossSellData();
  }, [fetchCrossSellData]);

  // ── Realtime subscription ─────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("cross-sell-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "client_cross_sell",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCrossSellData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCrossSellData]);

  // ── Loading ───────────────────────────────────────────────────────────

  if (loading) return <CrossSellPageSkeleton />;

  // ── Error ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">AI Cross Sell Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated business expansion opportunities based on uploaded client reports.
          </p>
        </div>
        <ErrorState
          title="Unable to load Cross Sell Intelligence"
          description={error}
          onRetry={fetchCrossSellData}
        />
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────

  if (!latest) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">AI Cross Sell Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated business expansion opportunities based on uploaded client reports.
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon="sparkles"
              title="No AI Cross Sell Analysis Available"
              description="Upload a Weekly Report to generate Cross Sell Intelligence."
              action={{
                label: "Go to Weekly Reports",
                onClick: () => router.push("/weekly-reports"),
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Normalise arrays ──────────────────────────────────────────────────

  const recommendedServices = toArray(latest.recommended_services);
  const businessSignals = toArray(latest.business_signals);
  const reasons = toArray(latest.reasons);
  const nextActions = toArray(latest.next_actions);

  const decisionStyle = getDecisionColor(latest.decision);
  const DecisionIcon = decisionStyle.icon;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">AI Cross Sell Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated business expansion opportunities based on uploaded client reports.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={fetchCrossSellData}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* ── Client Info Banner ── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {latest.company_name && (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">{latest.company_name}</span>
              </span>
            )}
            {latest.uploaded_by && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {latest.uploaded_by}
              </span>
            )}
            {latest.report_id && (
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {latest.report_id}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(latest.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 — Opportunity Score */}
        <Card>
          <CardContent className="p-5 flex flex-col items-center">
            <p className="text-xs font-medium text-muted-foreground mb-3">Opportunity Score</p>
            <CircularProgress score={latest.cross_sell_score ?? 0} />
          </CardContent>
        </Card>

        {/* Card 2 — Opportunity Level */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Opportunity Level</p>
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Badge
                variant="outline"
                className={`text-sm font-semibold px-3 py-1 ${getOpportunityLevelBadge(latest.opportunity_level)}`}
              >
                {latest.opportunity_level || "—"}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              AI-assessed opportunity tier
            </p>
          </CardContent>
        </Card>

        {/* Card 3 — Potential Revenue */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Potential Revenue</p>
              <DollarSign className="w-4 h-4 text-success" />
            </div>
            <p className="text-3xl font-bold text-success mt-2">
              {formatCurrency(latest.potential_revenue)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">
              Estimated expansion value
            </p>
          </CardContent>
        </Card>

        {/* Card 4 — Confidence */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Confidence</p>
              <Sparkles className="w-4 h-4 text-warning" />
            </div>
            <p className="text-3xl font-bold text-warning">
              {latest.confidence_score ?? 0}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-3">
              <div
                className="h-full rounded-full bg-warning transition-all duration-700"
                style={{ width: `${latest.confidence_score ?? 0}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">AI prediction confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Executive Summary ── */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold mb-2">AI Executive Summary</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {latest.executive_summary || "No summary available."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Recommended Services + Business Signals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recommended Services */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Recommended Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendedServices.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No recommended services
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recommendedServices.map((service, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-success" />
                    </div>
                    <p className="text-xs font-medium text-foreground leading-snug">{service}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Signals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" />
              Business Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {businessSignals.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No business signals detected
              </p>
            ) : (
              <div className="space-y-2">
                {businessSignals.map((signal, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-warning/5 border border-warning/10"
                  >
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                      <span className="text-[10px] text-muted-foreground font-mono">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{signal}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Reasons + Next Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reasons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              Reasons for Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reasons.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No reasons listed
              </p>
            ) : (
              <ul className="space-y-2">
                {reasons.map((reason, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-relaxed">{reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Next Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Next Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextActions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No actions defined
              </p>
            ) : (
              <div className="space-y-2">
                {nextActions.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-5 h-5 rounded border-2 border-primary/30 shrink-0 mt-0.5 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Priority + Decision + Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Priority */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Priority</p>
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <Badge
              variant="outline"
              className={`text-sm font-semibold px-3 py-1 ${getPriorityBadge(latest.priority)}`}
            >
              {latest.priority || "—"}
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-2">
              Execution urgency level
            </p>
          </CardContent>
        </Card>

        {/* Decision */}
        <Card className={`${decisionStyle.bg} ${decisionStyle.border} border`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Decision</p>
              <DecisionIcon className={`w-4 h-4 ${decisionStyle.text}`} />
            </div>
            <p className={`text-lg font-bold ${decisionStyle.text}`}>
              {latest.decision || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">
              AI recommendation outcome
            </p>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <Badge
              variant="outline"
              className="text-sm font-semibold px-3 py-1 bg-primary/10 text-primary border-primary/20"
            >
              {latest.status || "—"}
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-2">
              Current processing state
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
