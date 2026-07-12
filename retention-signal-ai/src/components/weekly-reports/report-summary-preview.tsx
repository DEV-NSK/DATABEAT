"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WeeklyReportResponse } from "@/lib/types";
import {
  Calendar, ShieldAlert, Target, CheckCircle2,
  AlertTriangle, Clock, Flag, Users, TrendingUp, FileText,
} from "lucide-react";

interface ReportSummaryPreviewProps {
  data: WeeklyReportResponse | null;
}

const reportFieldConfig = [
  { key: "clientRequirement", label: "Client Requirement", icon: FileText },
  { key: "completionStatus", label: "Completion Status", icon: Target },
  { key: "onTimeDelivery", label: "On-Time Delivery", icon: Clock },
  { key: "slaCommitmentBreach", label: "SLA / Commitment Breach", icon: AlertTriangle },
  { key: "escalations", label: "Escalations", icon: Flag },
  { key: "clientSentiment", label: "Client Sentiment", icon: Users },
  { key: "scopeVsCapacity", label: "Scope vs. Capacity", icon: TrendingUp },
  { key: "openRisksFlags", label: "Open Risks / Flags", icon: AlertTriangle },
  { key: "notes", label: "Notes", icon: FileText },
];

export function ReportSummaryPreview({ data }: ReportSummaryPreviewProps) {
  if (!data) return null;

  const { report } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="space-y-4"
    >
      {/* Summary Cards Row — Exactly 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Reporting Period */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Reporting Period
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">{report.reportingPeriod}</p>
        </Card>

        {/* Card 2: Churn Risk */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Churn Risk
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {report.churnRisk.score} / 100
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold",
                report.churnRisk.level === "Low"
                  ? "text-success bg-success/10 border-success/20"
                  : report.churnRisk.level === "Medium"
                  ? "text-warning bg-warning/10 border-warning/20"
                  : "text-destructive bg-destructive/10 border-destructive/20"
              )}
            >
              {report.churnRisk.level}
            </Badge>
          </div>
        </Card>

        {/* Card 3: Cross-Sell */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Cross-Sell
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">{report.crossSell}</p>
        </Card>

        {/* Card 4: Status */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Status
            </span>
          </div>
          <Badge variant="outline" className="text-success bg-success/10 border-success/20 text-xs font-semibold">
            Completed
          </Badge>
        </Card>
      </div>

      {/* Report Details Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Report Details</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Extracted report data — {data.reportId}
          </p>
        </div>
        <div className="divide-y divide-border">
          {reportFieldConfig.map(({ key, label, icon: Icon }) => {
            const raw = report[key as keyof typeof report];
            const value = typeof raw === "string" ? raw : "—";
            return (
              <div
                key={key}
                className="flex items-start gap-4 px-5 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2.5 w-48 shrink-0">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
                <span className="text-xs text-foreground">{value}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
