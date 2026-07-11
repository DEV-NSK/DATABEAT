"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { opportunities } from "@/lib/mock-data";
import { DollarSign, MoreHorizontal, LayoutGrid, List, Columns3 } from "lucide-react";
import type { OpportunityStatus } from "@/lib/types";

const statusConfig: Record<OpportunityStatus, { label: string; color: string; column: string }> = {
  identified: { label: "Qualified", color: "bg-muted text-muted-foreground", column: "bg-muted/30" },
  qualified: { label: "Review", color: "bg-primary/10 text-primary", column: "bg-primary/5" },
  proposed: { label: "Proposal", color: "bg-warning/10 text-warning", column: "bg-warning/5" },
  won: { label: "Won", color: "bg-success/10 text-success", column: "bg-success/5" },
  lost: { label: "Lost", color: "bg-destructive/10 text-destructive", column: "bg-destructive/5" },
};

export default function UpsellPage() {
  const [view, setView] = useState<"pipeline" | "grid" | "list">("pipeline");
  const upsells = opportunities.filter(o => o.type === "upsell");
  const totalRevenue = upsells.reduce((s, o) => s + o.potentialRevenue, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Upsell Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{upsells.length} opportunities · ${(totalRevenue / 1000000).toFixed(1)}M total pipeline</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button onClick={() => setView("pipeline")} className={`p-1.5 rounded-md ${view === "pipeline" ? "bg-background shadow-sm" : ""}`}><Columns3 className="w-4 h-4" /></button>
          <button onClick={() => setView("grid")} className={`p-1.5 rounded-md ${view === "grid" ? "bg-background shadow-sm" : ""}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setView("list")} className={`p-1.5 rounded-md ${view === "list" ? "bg-background shadow-sm" : ""}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {view === "pipeline" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {(["identified", "qualified", "proposed", "won", "lost"] as OpportunityStatus[]).map((status) => {
            const config = statusConfig[status];
            const statusOpps = upsells.filter(o => o.status === status);
            const pipelineRevenue = statusOpps.reduce((s, o) => s + o.potentialRevenue, 0);
            return (
              <div key={status} className={`rounded-xl p-3 ${config.column}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{config.label}</h3>
                    <Badge variant="outline" className="text-[10px]">{statusOpps.length}</Badge>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">${(pipelineRevenue / 1000).toFixed(0)}K pipeline</p>
                <div className="space-y-2">
                  {statusOpps.slice(0, 6).map((opp) => (
                    <Card key={opp.id} className="hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6"><AvatarFallback className="text-[9px] bg-muted">{opp.client.name.slice(0, 2)}</AvatarFallback></Avatar>
                          <p className="text-xs font-medium truncate flex-1">{opp.client.name}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-2">{opp.service}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">${(opp.potentialRevenue / 1000).toFixed(0)}K</span>
                          <span className="text-[10px] text-muted-foreground">{opp.confidence}%</span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden mt-1.5">
                          <div className="h-full bg-success rounded-full" style={{ width: `${opp.confidence}%` }} />
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1.5">{opp.owner.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upsells.map((opp) => (
            <Card key={opp.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-8 h-8"><AvatarFallback className="text-[10px] bg-muted">{opp.client.name.slice(0, 2)}</AvatarFallback></Avatar>
                    <div>
                      <p className="text-sm font-medium">{opp.client.name}</p>
                      <p className="text-[10px] text-muted-foreground">{opp.client.industry}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                </div>
                <p className="text-xs font-medium mb-1">{opp.service}</p>
                <p className="text-[10px] text-muted-foreground mb-3 line-clamp-2">{opp.notes}</p>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-muted-foreground" /><span className="text-sm font-semibold">${(opp.potentialRevenue / 1000).toFixed(0)}K</span></div>
                  <Badge variant="outline" className={`text-[10px] ${statusConfig[opp.status].color}`}>{statusConfig[opp.status].label}</Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full" style={{ width: `${opp.confidence}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{opp.confidence}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Owner: {opp.owner.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {upsells.map((opp) => (
              <div key={opp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                <Avatar className="w-8 h-8"><AvatarFallback className="text-[10px] bg-muted">{opp.client.name.slice(0, 2)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{opp.client.name}</p>
                  <p className="text-[10px] text-muted-foreground">{opp.service}</p>
                </div>
                <span className="text-xs font-semibold">${(opp.potentialRevenue / 1000).toFixed(0)}K</span>
                <div className="flex items-center gap-1.5 w-24">
                  <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full" style={{ width: `${opp.confidence}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{opp.confidence}%</span>
                </div>
                <Badge variant="outline" className={`text-[10px] ${statusConfig[opp.status].color}`}>{statusConfig[opp.status].label}</Badge>
                <span className="text-[10px] text-muted-foreground w-28">{opp.owner.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
