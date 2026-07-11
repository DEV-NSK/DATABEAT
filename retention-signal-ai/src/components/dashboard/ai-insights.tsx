"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { aiInsights } from "@/lib/mock-data";
import { ArrowRight, Brain, TrendingDown, TrendingUp, BarChart3, Eye } from "lucide-react";

const categoryConfig = {
  risk: { icon: TrendingDown, color: "bg-destructive/10 text-destructive", label: "Risk" },
  opportunity: { icon: TrendingUp, color: "bg-success/10 text-success", label: "Opportunity" },
  trend: { icon: BarChart3, color: "bg-primary/10 text-primary", label: "Trend" },
  observation: { icon: Eye, color: "bg-muted text-muted-foreground", label: "Observation" },
};

export function AIInsights() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">AI Insights</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {aiInsights.map((insight) => {
            const config = categoryConfig[insight.category];
            const Icon = config.icon;
            return (
              <div
                key={insight.id}
                className="p-4 rounded-xl border border-border hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-7 h-7 rounded-lg ${config.color} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Confidence</span>
                    <span className="text-xs font-semibold">{insight.confidence}%</span>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1.5">{insight.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{insight.content}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                    {config.label}
                  </Badge>
                  <span className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore insight
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
