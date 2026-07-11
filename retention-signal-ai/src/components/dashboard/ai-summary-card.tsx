"use client";

import { Sparkles, AlertTriangle, TrendingUp, ArrowRightLeft, Eye, DollarSign, Target, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { kpiSummary } from "@/lib/mock-data";

export function AISummaryCard() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-primary/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-foreground">Good Morning, Sai Kiran</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Retention Signal AI analyzed <span className="font-medium text-foreground">{kpiSummary.totalClients} accounts</span> overnight.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <SummaryItem
                icon={<AlertTriangle className="w-4 h-4 text-destructive" />}
                value="3"
                label="accounts require immediate attention"
                variant="destructive"
              />
              <SummaryItem
                icon={<Eye className="w-4 h-4 text-warning" />}
                value="7"
                label="accounts show early warning signals"
                variant="warning"
              />
              <SummaryItem
                icon={<TrendingUp className="w-4 h-4 text-success" />}
                value={String(kpiSummary.upsellOpportunities)}
                label="upsell opportunities detected"
                variant="success"
              />
              <SummaryItem
                icon={<ArrowRightLeft className="w-4 h-4 text-primary" />}
                value={String(kpiSummary.crossSellOpportunities)}
                label="cross-sell opportunities discovered"
                variant="primary"
              />
            </div>

            {/* Revenue Opportunity + Today's Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/10">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Estimated Revenue Opportunity</p>
                  <p className="text-lg font-bold text-success">$245,000</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground">Today&apos;s Priority</p>
                  <p className="text-sm font-semibold">Review Acme Digital</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1">
                  View <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  icon,
  value,
  label,
  variant,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  variant: "destructive" | "warning" | "success" | "primary";
}) {
  const bgMap = {
    destructive: "bg-destructive/5 border-destructive/10",
    warning: "bg-warning/5 border-warning/10",
    success: "bg-success/5 border-success/10",
    primary: "bg-primary/5 border-primary/10",
  };

  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-lg border ${bgMap[variant]}`}>
      {icon}
      <div>
        <span className="text-base font-semibold text-foreground">{value}</span>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      </div>
    </div>
  );
}
