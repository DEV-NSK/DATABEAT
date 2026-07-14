"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import type { HealthScoreRow, HealthKPIs, TrendPoint } from "@/hooks/use-health-scores";

interface HealthChartsProps {
  rows: HealthScoreRow[];
  trendData: TrendPoint[];
  kpis: HealthKPIs;
  loading: boolean;
}

const DISTRIBUTION_COLORS = {
  Healthy: "#10b981",
  Warning: "#f59e0b",
  Critical: "#ef4444",
};

const RISK_COLORS: Record<string, string> = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#ef4444",
};

export function HealthCharts({ rows, trendData, kpis, loading }: HealthChartsProps) {
  // ── Health Distribution ─────────────────────────────────────────────────
  const healthDistribution = [
    { name: "Healthy", value: kpis.healthyCount, color: DISTRIBUTION_COLORS.Healthy },
    { name: "Warning", value: kpis.warningCount, color: DISTRIBUTION_COLORS.Warning },
    { name: "Critical", value: kpis.criticalCount, color: DISTRIBUTION_COLORS.Critical },
  ].filter((d) => d.value > 0);

  // ── Risk Distribution ────────────────────────────────────────────────────
  const riskCounts: Record<string, number> = {};
  rows.forEach((r) => {
    const level = r.risk_level ?? "Unknown";
    riskCounts[level] = (riskCounts[level] ?? 0) + 1;
  });
  const riskDistribution = Object.entries(riskCounts).map(([name, value]) => ({
    name,
    value,
    color: RISK_COLORS[name] ?? "#94a3b8",
  }));

  const totalReports = rows.length;
  const hasData = totalReports > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ── Health Distribution Donut ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Health Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : !hasData ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-xs text-muted-foreground text-center">
                No reports yet.
                <br />Upload a weekly report to see distribution.
              </p>
            </div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {healthDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        fontSize: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {healthDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                    <span className="text-xs font-medium ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Health Score Trend ── */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Health Score Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-56 w-full rounded-lg" />
          ) : !hasData ? (
            <div className="h-56 flex items-center justify-center">
              <p className="text-xs text-muted-foreground text-center">
                No reports yet.
                <br />Upload a weekly report to see the trend.
              </p>
            </div>
          ) : (
            <>
              {trendData.length === 1 && (
                <p className="text-[11px] text-muted-foreground mb-2 text-center">
                  Only one report available. Trend will appear after more uploads.
                </p>
              )}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                      formatter={(value) => [`${value}`, "Health Score"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="url(#trendGrad)"
                      strokeWidth={2}
                      /* Always show dot for single-point; activeDot for multi */
                      dot={
                        trendData.length === 1
                          ? { r: 6, fill: "#2563eb", strokeWidth: 2 }
                          : { r: 3, fill: "#2563eb", strokeWidth: 1 }
                      }
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Risk Distribution ── */}
      {hasData && riskDistribution.length > 0 && (
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              {riskDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-3 p-3 rounded-lg border border-border min-w-[120px]">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-xs font-medium">{item.name} Risk</p>
                    <p className="text-lg font-bold" style={{ color: item.color }}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
