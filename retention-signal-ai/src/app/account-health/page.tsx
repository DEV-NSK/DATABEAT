"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clients, kpiSummary, healthTrendData } from "@/lib/mock-data";
import { TrendingDown, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip, Line, Legend, AreaChart, Area
} from "recharts";
import { HealthGauge } from "@/components/shared/health-gauge";
import { SignalTimeline, type SignalEvent } from "@/components/shared/signal-timeline";

const healthColors = {
  healthy: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  at_risk: "bg-destructive/10 text-destructive",
  critical: "bg-destructive/10 text-destructive",
};

const subScores = [
  { label: "Delivery", score: 78, trend: +3, color: "#2563eb" },
  { label: "Relationship", score: 82, trend: -1, color: "#10b981" },
  { label: "External", score: 65, trend: -5, color: "#f59e0b" },
  { label: "Contract", score: 71, trend: +2, color: "#8b5cf6" },
];

const signalEvents: SignalEvent[] = [
  { signalType: "SLA Miss", source: "internal", description: "Acme Digital - SLA response time exceeded threshold", timestamp: "2 hours ago", severity: "warning" },
  { signalType: "Health Score Dropped", source: "ai", description: "Northgate Media - Health declined 12 points in 7 days", timestamp: "5 hours ago", severity: "critical" },
  { signalType: "Client Escalation", source: "external", description: "Pixel Labs - Formal escalation submitted via support", timestamp: "1 day ago", severity: "critical" },
  { signalType: "Contract Renewed", source: "internal", description: "BlueWave - Annual contract renewed successfully", timestamp: "2 days ago", severity: "success" },
  { signalType: "Meeting Frequency Down", source: "ai", description: "Nova Retail - Engagement declining, 40% fewer meetings", timestamp: "3 days ago", severity: "warning" },
  { signalType: "Payment Delayed", source: "external", description: "GrowthX - Invoice overdue by 15 days", timestamp: "4 days ago", severity: "warning" },
];

export default function AccountHealthPage() {
  const [timeFilter, setTimeFilter] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("monthly");
  const sortedByHealth = [...clients].sort((a, b) => a.healthScore - b.healthScore);
  const trendData = healthTrendData[timeFilter];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Health Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Executive analytics across all accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center">
            <HealthGauge
              score={kpiSummary.avgHealthScore}
              size="lg"
              showTrend
              trend={2}
              showRecommendation
              label="Overall Health"
            />
          </CardContent>
        </Card>

        {subScores.map((sub) => (
          <Card key={sub.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground">{sub.label}</p>
                <div className={`flex items-center gap-0.5 text-[10px] font-medium ${sub.trend > 0 ? "text-success" : "text-destructive"}`}>
                  {sub.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {sub.trend > 0 ? "+" : ""}{sub.trend}
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: sub.color }}>{sub.score}</p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <div className="h-full rounded-full" style={{ width: `${sub.score}%`, backgroundColor: sub.color }} />
              </div>
              <div className="flex items-end gap-0.5 h-8 mt-3">
                {Array.from({ length: 12 }, (_, i) => {
                  const h = 30 + Math.sin(i * 0.7) * 20 + Math.sin(i * 1.3) * 10;
                  return (
                    <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, backgroundColor: sub.color, opacity: 0.3 + (i / 12) * 0.7 }} />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Signal Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <SignalTimeline events={signalEvents} compact />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Health Trends</CardTitle>
              <div className="flex items-center gap-1">
                {(["weekly", "monthly", "quarterly", "yearly"] as const).map((f) => (
                  <button key={f} onClick={() => setTimeFilter(f)}
                    className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                      timeFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="healthyGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="warningGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Area type="monotone" dataKey="healthy" stroke="#10b981" fill="url(#healthyGrad2)" strokeWidth={2} name="Healthy" />
                  <Area type="monotone" dataKey="warning" stroke="#f59e0b" fill="url(#warningGrad2)" strokeWidth={2} name="Warning" />
                  <Line type="monotone" dataKey="atRisk" stroke="#ef4444" strokeWidth={2} name="At Risk" dot={false} />
                  <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={2} name="Critical" dot={false} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold mb-2">Why did Health change?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The overall health score decreased by 2 points this week, primarily driven by three enterprise clients
                (Acme Digital, Northgate Media, and Pixel Labs) showing declining engagement metrics.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Three enterprise clients have reduced meeting frequency. This pattern has historically increased churn probability.
              </p>
              <div className="bg-warning/5 border border-warning/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <p className="text-xs font-semibold text-warning">Recommended Action</p>
                </div>
                <p className="text-xs text-muted-foreground">Executive outreach to the top 3 at-risk accounts within the next 48 hours.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Account Health Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {sortedByHealth.slice(0, 15).map((client) => (
              <div key={client.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                <Avatar className="w-8 h-8"><AvatarFallback className="text-[10px] bg-muted">{client.name.slice(0, 2)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-[10px] text-muted-foreground">{client.industry} · {client.manager.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${client.healthScore >= 80 ? "bg-success" : client.healthScore >= 60 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${client.healthScore}%` }} />
                    </div>
                    <span className="text-xs font-semibold w-8 text-right">{client.healthScore}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${healthColors[client.healthStatus]}`}>
                    {client.healthStatus.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
