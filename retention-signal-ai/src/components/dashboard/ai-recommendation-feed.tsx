"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recommendations } from "@/lib/mock-data";
import { ArrowRight, Sparkles } from "lucide-react";

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

const typeColors = {
  churn_risk: "bg-destructive/10 text-destructive",
  upsell: "bg-success/10 text-success",
  cross_sell: "bg-primary/10 text-primary",
  action: "bg-muted text-muted-foreground",
};

export function AIRecommendationFeed() {
  const topRecs = recommendations.filter(r => r.status === "new" || r.status === "acknowledged").slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">AI Recommendations</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {topRecs.map((rec) => (
            <div
              key={rec.id}
              className="p-3.5 rounded-xl border border-border hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className={`text-[10px] px-1.5 ${typeColors[rec.type]}`}>
                  {rec.type.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className={`text-[10px] px-1.5 ${priorityColors[rec.priority]}`}>
                  {rec.priority}
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground mb-1 line-clamp-1">{rec.client.name}</p>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{rec.reason}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${rec.confidence}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{rec.confidence}%</span>
                </div>
                <span className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {rec.nextAction}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
