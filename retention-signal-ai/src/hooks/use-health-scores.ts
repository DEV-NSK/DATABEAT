"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

export interface HealthScoreRow {
  id: string;
  user_id: string;
  company_name: string;
  uploaded_by: string;
  report_id: string;
  overall_health_score: number;
  health_grade: string;
  risk_level: string;
  client_status: string;
  retention_probability: number;
  expansion_probability: number;
  executive_summary: string;
  strengths: string[] | string;
  concerns: string[] | string;
  recommendations: string[] | string;
  priority_actions: string[] | string;
  confidence_score: number;
  created_at: string;
}

export interface HealthKPIs {
  totalReports: number;
  totalClients: number;       // unique companies
  latestScore: number | null;
  latestGrade: string | null;
  latestRisk: string | null;
  latestRetention: number | null;
  latestExpansion: number | null;
  latestConfidence: number | null;
  scoreTrend: number | null; // diff between latest and previous
  healthyCount: number;   // score >= 80
  warningCount: number;   // 65-79
  atRiskCount: number;    // 45-64
  criticalCount: number;  // < 45
  avgScore: number | null;
}

export interface TrendPoint {
  date: string;
  score: number;
}

export interface UseHealthScoresResult {
  rows: HealthScoreRow[];
  latest: HealthScoreRow | null;
  kpis: HealthKPIs;
  trendData: TrendPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const EMPTY_KPIS: HealthKPIs = {
  totalReports: 0,
  totalClients: 0,
  latestScore: null,
  latestGrade: null,
  latestRisk: null,
  latestRetention: null,
  latestExpansion: null,
  latestConfidence: null,
  scoreTrend: null,
  healthyCount: 0,
  warningCount: 0,
  atRiskCount: 0,
  criticalCount: 0,
  avgScore: null,
};

export function useHealthScores(): UseHealthScoresResult {
  const { user } = useAuth();
  const [rows, setRows] = useState<HealthScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from("client_health_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (dbError) throw dbError;
      setRows((data as HealthScoreRow[]) ?? []);
    } catch (err: unknown) {
      console.error("useHealthScores fetch error:", err);
      setError("Failed to load health data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription — auto-refresh on INSERT
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("health-scores-hook")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "client_health_scores",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  // Derive computed values
  const latest = rows.length > 0 ? rows[0] : null;
  const previous = rows.length > 1 ? rows[1] : null;

  const scoreTrend =
    latest && previous
      ? Math.round(latest.overall_health_score - previous.overall_health_score)
      : null;

  // Deduplicate by company for unique client counts
  const seenCompanies = new Set<string>();
  const latestPerCompany: HealthScoreRow[] = [];
  for (const r of rows) {
    const key = (r.company_name || "").toLowerCase();
    if (!seenCompanies.has(key)) {
      seenCompanies.add(key);
      latestPerCompany.push(r);
    }
  }
  const totalClients = latestPerCompany.length;

  const healthyCount = latestPerCompany.filter((r) => r.overall_health_score >= 80).length;
  const warningCount = latestPerCompany.filter(
    (r) => r.overall_health_score >= 65 && r.overall_health_score < 80
  ).length;
  const atRiskCount = latestPerCompany.filter(
    (r) => r.overall_health_score >= 45 && r.overall_health_score < 65
  ).length;
  const criticalCount = latestPerCompany.filter((r) => r.overall_health_score < 45).length;

  const avgScore =
    latestPerCompany.length > 0
      ? Math.round(latestPerCompany.reduce((s, r) => s + r.overall_health_score, 0) / latestPerCompany.length)
      : null;

  const kpis: HealthKPIs = latest
    ? {
        totalReports: rows.length,
        totalClients,
        latestScore: latest.overall_health_score,
        latestGrade: latest.health_grade,
        latestRisk: latest.risk_level,
        latestRetention: latest.retention_probability,
        latestExpansion: latest.expansion_probability,
        latestConfidence: latest.confidence_score,
        scoreTrend,
        healthyCount,
        warningCount,
        atRiskCount,
        criticalCount,
        avgScore,
      }
    : EMPTY_KPIS;

  // Trend data sorted oldest → newest for chart
  const trendData: TrendPoint[] = [...rows]
    .reverse()
    .map((r) => ({
      date: new Date(r.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: r.overall_health_score,
    }));

  return {
    rows,
    latest,
    kpis,
    trendData,
    loading,
    error,
    refresh: fetchData,
  };
}
