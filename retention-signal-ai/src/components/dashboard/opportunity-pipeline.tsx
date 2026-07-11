"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { opportunities } from "@/lib/mock-data";
import { ArrowRight, TrendingUp, ArrowRightLeft, DollarSign } from "lucide-react";

const statusColors = {
  identified: "bg-muted text-muted-foreground",
  qualified: "bg-primary/10 text-primary",
  proposed: "bg-warning/10 text-warning",
  won: "bg-success/10 text-success",
  lost: "bg-destructive/10 text-destructive",
};

export function OpportunityPipeline() {
  const upsells = opportunities.filter(o => o.type === "upsell").slice(0, 4);
  const crossSells = opportunities.filter(o => o.type === "cross_sell").slice(0, 4);
  const totalUpsellRev = opportunities.filter(o => o.type === "upsell").reduce((s, o) => s + o.potentialRevenue, 0);
  const totalCrossRev = opportunities.filter(o => o.type === "cross_sell").reduce((s, o) => s + o.potentialRevenue, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Opportunity Pipeline</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upsell */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-sm font-medium">Upsell</span>
                <Badge variant="outline" className="text-[10px]">{upsells.length} active</Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="w-3 h-3" />
                <span className="font-medium text-foreground">{(totalUpsellRev / 1000000).toFixed(1)}M</span>
                <span>pipeline</span>
              </div>
            </div>
            <div className="space-y-2">
              {upsells.map((opp) => (
                <div key={opp.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{opp.client.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{opp.service}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium">${(opp.potentialRevenue / 1000).toFixed(0)}K</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="h-1 w-8 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full" style={{ width: `${opp.confidence}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{opp.confidence}%</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[9px] shrink-0 ${statusColors[opp.status]}`}>
                    {opp.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Sell */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Cross-Sell</span>
                <Badge variant="outline" className="text-[10px]">{crossSells.length} active</Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="w-3 h-3" />
                <span className="font-medium text-foreground">{(totalCrossRev / 1000000).toFixed(1)}M</span>
                <span>pipeline</span>
              </div>
            </div>
            <div className="space-y-2">
              {crossSells.map((opp) => (
                <div key={opp.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{opp.client.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{opp.service}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium">${(opp.potentialRevenue / 1000).toFixed(0)}K</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="h-1 w-8 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${opp.confidence}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{opp.confidence}%</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[9px] shrink-0 ${statusColors[opp.status]}`}>
                    {opp.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
