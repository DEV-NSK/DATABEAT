"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart as RPieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart as RBarChart,
  Bar,
  Legend,
} from "recharts";

// --- Donut Chart ---
interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, title, height = 200, showLegend = true, centerLabel, centerValue }: DonutChartProps) {
  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RPieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={3} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
              />
              {centerLabel && centerValue && (
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan x="50%" dy="-0.5em" className="fill-foreground text-2xl font-bold">{centerValue}</tspan>
                  <tspan x="50%" dy="1.5em" className="fill-muted-foreground text-xs">{centerLabel}</tspan>
                </text>
              )}
            </RPieChart>
          </ResponsiveContainer>
        </div>
        {showLegend && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                <span className="text-xs font-medium ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Line Chart ---
interface LineSeries {
  dataKey: string;
  color: string;
  name?: string;
  dashed?: boolean;
}

interface LineChartProps {
  data: Record<string, unknown>[];
  series: LineSeries[];
  title?: string;
  height?: number;
  xAxisKey?: string;
}

export function LineChart({ data, series, title, height = 250, xAxisKey = "period" }: LineChartProps) {
  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RLineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {series.map((s) => (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  stroke={s.color}
                  strokeWidth={2}
                  name={s.name || s.dataKey}
                  strokeDasharray={s.dashed ? "5 5" : undefined}
                  dot={false}
                />
              ))}
            </RLineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Bar Chart ---
interface BarSeries {
  dataKey: string;
  color: string;
  name?: string;
  stacked?: boolean;
}

interface BarChartProps {
  data: Record<string, unknown>[];
  series: BarSeries[];
  title?: string;
  height?: number;
  xAxisKey?: string;
}

export function BarChart({ data, series, title, height = 250, xAxisKey = "period" }: BarChartProps) {
  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {series.map((s) => (
                <Bar
                  key={s.dataKey}
                  dataKey={s.dataKey}
                  fill={s.color}
                  name={s.name || s.dataKey}
                  stackId={s.stacked ? "stack" : undefined}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </RBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Progress Card ---
interface ProgressCardProps {
  title: string;
  value: number;
  max?: number;
  color?: string;
  description?: string;
  trend?: number;
}

export function ProgressCard({ title, value, max = 100, color = "#2563eb", description, trend }: ProgressCardProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-0.5 text-[10px] font-medium ${trend > 0 ? "text-success" : "text-destructive"}`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend > 0 ? "+" : ""}{trend}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold mb-2" style={{ color }}>{value}</p>
        <Progress value={percentage} className="h-2" />
        {description && <p className="text-[10px] text-muted-foreground mt-2">{description}</p>}
      </CardContent>
    </Card>
  );
}

// --- Stats Card ---
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  description?: string;
  color?: string;
}

export function StatsCard({ title, value, change, trend = "neutral", icon, description, color }: StatsCardProps) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          {icon && <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">{icon}</div>}
          {change && (
            <div className="flex items-center gap-1">
              {trend === "up" && <TrendingUp className="w-3 h-3 text-success" />}
              {trend === "down" && <TrendingDown className="w-3 h-3 text-destructive" />}
              <span className={`text-xs font-medium ${trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                {change}
              </span>
            </div>
          )}
        </div>
        <p className="text-2xl font-semibold text-foreground" style={color ? { color } : undefined}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
        {description && <p className="text-[10px] text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
