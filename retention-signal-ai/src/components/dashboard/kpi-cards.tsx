"use client";

import { Users, Heart, AlertTriangle, CheckSquare, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { kpiSummary } from "@/lib/mock-data";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

const sparkData = [
  { v: 42 }, { v: 45 }, { v: 44 }, { v: 48 }, { v: 47 }, { v: 50 },
  { v: 49 }, { v: 52 }, { v: 50 }, { v: 48 }, { v: 51 }, { v: 50 },
];

const sparkRisk = [
  { v: 8 }, { v: 10 }, { v: 9 }, { v: 11 }, { v: 12 }, { v: 10 },
  { v: 13 }, { v: 11 }, { v: 12 }, { v: 14 }, { v: 12 }, { v: 13 },
];

const kpis = [
  {
    title: "Total Clients",
    value: kpiSummary.totalClients,
    change: "+4.2%",
    trend: "up" as const,
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
    data: sparkData,
    stroke: "#2563eb",
  },
  {
    title: "Healthy Accounts",
    value: kpiSummary.healthyAccounts,
    change: "+8.3%",
    trend: "up" as const,
    icon: Heart,
    color: "text-success",
    bg: "bg-success/10",
    data: sparkData,
    stroke: "#10b981",
  },
  {
    title: "Risk Accounts",
    value: kpiSummary.riskAccounts,
    change: "-5.1%",
    trend: "down" as const,
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    data: sparkRisk,
    stroke: "#ef4444",
  },
  {
    title: "Open Tasks",
    value: kpiSummary.openTasks,
    change: "+2.8%",
    trend: "up" as const,
    icon: CheckSquare,
    color: "text-warning",
    bg: "bg-warning/10",
    data: sparkData,
    stroke: "#f59e0b",
  },
];

export function KPICards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="flex items-center gap-1">
                {kpi.trend === "up" ? (
                  <TrendingUp className="w-3 h-3 text-success" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                <span className={`text-xs font-medium ${kpi.trend === "up" ? "text-success" : "text-destructive"}`}>
                  {kpi.change}
                </span>
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.title}</p>
            <div className="h-8 mt-2 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpi.data}>
                  <defs>
                    <linearGradient id={`grad-${kpi.title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={kpi.stroke} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={kpi.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={kpi.stroke}
                    strokeWidth={1.5}
                    fill={`url(#grad-${kpi.title})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
