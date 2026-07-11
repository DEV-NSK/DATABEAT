"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { opportunities, clients } from "@/lib/mock-data";
import { ArrowRightLeft, DollarSign, MoreHorizontal, LayoutGrid, List, Grid3X3, Columns3, Newspaper, Briefcase, TrendingUp, Sparkles } from "lucide-react";
import type { OpportunityStatus } from "@/lib/types";

const statusConfig: Record<OpportunityStatus, { label: string; color: string; column: string }> = {
  identified: { label: "Qualified", color: "bg-muted text-muted-foreground", column: "bg-muted/30" },
  qualified: { label: "Review", color: "bg-primary/10 text-primary", column: "bg-primary/5" },
  proposed: { label: "Proposal", color: "bg-warning/10 text-warning", column: "bg-warning/5" },
  won: { label: "Won", color: "bg-success/10 text-success", column: "bg-success/5" },
  lost: { label: "Lost", color: "bg-destructive/10 text-destructive", column: "bg-destructive/5" },
};

const detectionSources = [
  { label: "Hiring", icon: Briefcase, color: "bg-blue-500/10 text-blue-600" },
  { label: "News", icon: Newspaper, color: "bg-orange-500/10 text-orange-600" },
  { label: "Growth", icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-600" },
  { label: "Manual", icon: ArrowRightLeft, color: "bg-purple-500/10 text-purple-600" },
  { label: "AI", icon: Sparkles, color: "bg-primary/10 text-primary" },
];

const services = ["Cloud Migration", "Data Analytics", "Cybersecurity", "DevOps", "AI/ML Solutions"];

export default function CrossSellPage() {
  const [view, setView] = useState<"pipeline" | "grid" | "list" | "matrix">("pipeline");
  const crossSells = opportunities.filter(o => o.type === "cross_sell");
  const totalRevenue = crossSells.reduce((s, o) => s + o.potentialRevenue, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Cross-Sell Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{crossSells.length} opportunities · ${(totalRevenue / 1000000).toFixed(1)}M total pipeline</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button onClick={() => setView("pipeline")} className={`p-1.5 rounded-md ${view === "pipeline" ? "bg-background shadow-sm" : ""}`}><Columns3 className="w-4 h-4" /></button>
          <button onClick={() => setView("grid")} className={`p-1.5 rounded-md ${view === "grid" ? "bg-background shadow-sm" : ""}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setView("list")} className={`p-1.5 rounded-md ${view === "list" ? "bg-background shadow-sm" : ""}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setView("matrix")} className={`p-1.5 rounded-md ${view === "matrix" ? "bg-background shadow-sm" : ""}`}><Grid3X3 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Detection Sources Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] text-muted-foreground font-medium">Detection Source:</span>
        {detectionSources.map(src => {
          const Icon = src.icon;
          return (
            <div key={src.label} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded ${src.color} flex items-center justify-center`}>
                <Icon className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-medium">{src.label}</span>
            </div>
          );
        })}
      </div>

      {view === "pipeline" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {(["identified", "qualified", "proposed", "won", "lost"] as OpportunityStatus[]).map((status) => {
            const config = statusConfig[status];
            const statusOpps = crossSells.filter(o => o.status === status);
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
                  {statusOpps.slice(0, 6).map((opp, i) => {
                    const src = detectionSources[i % detectionSources.length];
                    const SrcIcon = src.icon;
                    return (
                      <Card key={opp.id} className="hover:shadow-sm transition-shadow cursor-pointer">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-6 h-6"><AvatarFallback className="text-[9px] bg-muted">{opp.client.name.slice(0, 2)}</AvatarFallback></Avatar>
                            <p className="text-xs font-medium truncate flex-1">{opp.client.name}</p>
                            <div className={`w-4 h-4 rounded ${src.color} flex items-center justify-center`} title={src.label}>
                              <SrcIcon className="w-2.5 h-2.5" />
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-2">{opp.service}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">${(opp.potentialRevenue / 1000).toFixed(0)}K</span>
                            <span className="text-[10px] text-muted-foreground">{opp.confidence}%</span>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden mt-1.5">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${opp.confidence}%` }} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : view === "matrix" ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-4">Service Gap Matrix - Missing services per client</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Client</th>
                    {services.map(s => <th key={s} className="text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">{s}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {clients.slice(0, 15).map(c => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 pr-4 font-medium">{c.name}</td>
                      {services.map(s => (
                        <td key={s} className="text-center py-2 px-2">
                          {c.services.includes(s) ? (
                            <div className="w-4 h-4 mx-auto rounded-full bg-success/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-success" /></div>
                          ) : (
                            <div className="w-4 h-4 mx-auto rounded-full bg-muted flex items-center justify-center"><DollarSign className="w-2.5 h-2.5 text-muted-foreground" /></div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crossSells.map((opp, idx) => {
            const src = detectionSources[idx % detectionSources.length];
            const SrcIcon = src.icon;
            return (
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
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded ${src.color} flex items-center justify-center`} title={src.label}>
                        <SrcIcon className="w-3 h-3" />
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <p className="text-xs font-medium mb-1">{opp.service}</p>
                  <p className="text-[10px] text-muted-foreground mb-3 line-clamp-2">{opp.notes}</p>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-muted-foreground" /><span className="text-sm font-semibold">${(opp.potentialRevenue / 1000).toFixed(0)}K</span></div>
                    <Badge variant="outline" className={`text-[10px] ${statusConfig[opp.status].color}`}>{statusConfig[opp.status].label}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${opp.confidence}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{opp.confidence}%</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {crossSells.map((opp, idx) => {
              const src = detectionSources[idx % detectionSources.length];
              const SrcIcon = src.icon;
              return (
                <div key={opp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <Avatar className="w-8 h-8"><AvatarFallback className="text-[10px] bg-muted">{opp.client.name.slice(0, 2)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{opp.client.name}</p>
                    <p className="text-[10px] text-muted-foreground">{opp.service}</p>
                  </div>
                  <div className={`w-5 h-5 rounded ${src.color} flex items-center justify-center`} title={src.label}>
                    <SrcIcon className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-semibold">${(opp.potentialRevenue / 1000).toFixed(0)}K</span>
                  <Badge variant="outline" className={`text-[10px] ${statusConfig[opp.status].color}`}>{statusConfig[opp.status].label}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
