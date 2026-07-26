"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ArrowRight, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

interface CrossSellRow {
  id: string;
  company_name?: string;
  recommended_services: string[] | string;
  reasons: string[] | string;
  confidence_score: number;
  opportunity_level: string;
  potential_revenue: number | string;
  created_at: string;
}

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

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || !num) return "—";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}

function getLevelBadge(level: string) {
  const l = level?.toLowerCase();
  if (l === "high") return "bg-success/10 text-success border-success/20";
  if (l === "medium") return "bg-warning/10 text-warning border-warning/20";
  return "bg-orange-500/10 text-orange-600 border-orange-200";
}

export function TopExpansionOpportunities() {
  const { user } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<CrossSellRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("client_cross_sell")
      .select("id, company_name, recommended_services, reasons, confidence_score, opportunity_level, potential_revenue, created_at")
      .eq("user_id", user.id)
      .order("confidence_score", { ascending: false })
      .limit(5);
    if (data) setRows(data as CrossSellRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("top-opportunities-channel")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "client_cross_sell",
        filter: `user_id=eq.${user.id}`,
      }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <CardTitle className="text-sm font-semibold">Top Expansion Opportunities</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => router.push("/cross-sell")}
          >
            View All <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-muted-foreground">
              No expansion opportunities detected yet. Upload a report to generate insights.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => {
              const services = toArray(row.recommended_services);
              const reasons = toArray(row.reasons);
              return (
                <div
                  key={row.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push("/cross-sell")}
                >
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                    <DollarSign className="w-3.5 h-3.5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-medium text-foreground truncate">
                        {row.company_name || "Unknown"}
                      </p>
                      <Badge variant="outline" className={`text-[9px] shrink-0 ${getLevelBadge(row.opportunity_level)}`}>
                        {row.opportunity_level || "—"}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {services[0] || "Service opportunity"}
                    </p>
                    {reasons[0] && (
                      <p className="text-[10px] text-muted-foreground truncate opacity-70">
                        {reasons[0]}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-success">{row.confidence_score}%</p>
                    <p className="text-[10px] text-muted-foreground">{formatCurrency(row.potential_revenue)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
