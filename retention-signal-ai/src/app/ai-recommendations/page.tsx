"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { recommendations } from "@/lib/mock-data";
import {
  Sparkles, AlertTriangle, TrendingUp, Shuffle,
  Clock, Target, Zap, CheckCircle, XCircle,
  Search
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

const typeIcons = {
  churn_risk: AlertTriangle,
  upsell: TrendingUp,
  cross_sell: Shuffle,
  action: Zap,
};

const typeColors = {
  churn_risk: "bg-destructive/10 text-destructive",
  upsell: "bg-success/10 text-success",
  cross_sell: "bg-primary/10 text-primary",
  action: "bg-warning/10 text-warning",
};

const statusColors = {
  new: "bg-primary/10 text-primary",
  acknowledged: "bg-warning/10 text-warning",
  acted: "bg-success/10 text-success",
  dismissed: "bg-muted text-muted-foreground",
};

export default function AIRecommendationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(recommendations[0]?.id || null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = recommendations.filter(r => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase()) && !r.client.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selected = recommendations.find(r => r.id === selectedId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">AI Recommendation Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{recommendations.length} AI-generated recommendations</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Left Panel - Recommendation List */}
        <div className="w-[380px] shrink-0 flex flex-col border border-border rounded-xl bg-card overflow-hidden">
          {/* Search & Filters */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search recommendations..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-muted/50 border-none rounded-lg outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {["all", "churn_risk", "upsell", "cross_sell", "action"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                    filterType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type === "all" ? "All" : type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border">
              {filtered.length === 0 ? (
                <EmptyState icon="sparkles" title="No matching recommendations" description="Try adjusting your filters or search query to find relevant recommendations." />
              ) : filtered.map((rec) => {
                const Icon = typeIcons[rec.type];
                return (
                  <button
                    key={rec.id}
                    onClick={() => setSelectedId(rec.id)}
                    className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                      selectedId === rec.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${typeColors[rec.type]} flex items-center justify-center shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{rec.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{rec.client.name}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className={`text-[9px] ${statusColors[rec.status]}`}>{rec.status}</Badge>
                          <span className="text-[9px] text-muted-foreground">{rec.confidence}%</span>
                          <span className="text-[9px] text-muted-foreground">{rec.priority}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Detail View */}
        <div className="flex-1 border border-border rounded-xl bg-card overflow-hidden">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                {/* Detail Header */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const Icon = typeIcons[selected.type];
                      return (
                        <div className={`w-10 h-10 rounded-xl ${typeColors[selected.type]} flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      );
                    })()}
                    <div className="flex-1">
                      <h2 className="text-base font-semibold mb-1">{selected.title}</h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${typeColors[selected.type]}`}>
                          {selected.type.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[selected.status]}`}>
                          {selected.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {selected.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-5 space-y-6">
                    {/* Client Info */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Related Account</p>
                      <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-[10px] bg-muted">{selected.client.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{selected.client.name}</p>
                          <p className="text-[10px] text-muted-foreground">{selected.client.industry} · Health: {selected.client.healthScore}</p>
                        </div>
                      </div>
                    </div>

                    {/* Detected Signals */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detected Signals</p>
                      <div className="space-y-2">
                        {["Declining engagement metrics", "Reduced meeting frequency", "Payment delays observed"].map((signal, i) => (
                          <div key={i} className="flex items-center gap-2.5 bg-muted/30 rounded-lg p-2.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                            <p className="text-xs">{signal}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Reasoning</p>
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                        <p className="text-sm leading-relaxed">{selected.reason}</p>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/10">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <p className="text-[10px] text-primary font-medium">Generated by Retention Signal AI</p>
                        </div>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Confidence Score</p>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Progress value={selected.confidence} className="h-2 flex-1" />
                          <span className="text-lg font-bold">{selected.confidence}%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Based on {selected.confidence > 70 ? 27 : 14} data points analyzed over the last 30 days
                        </p>
                      </div>
                    </div>

                    {/* Next Action */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommended Next Action</p>
                      <div className="bg-success/5 border border-success/10 rounded-lg p-4">
                        <div className="flex items-start gap-2.5">
                          <Target className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{selected.nextAction}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Suggested timeline: Within {selected.priority === "high" ? "24 hours" : selected.priority === "medium" ? "3 days" : "1 week"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Potential Revenue */}
                    {selected.potentialRevenue && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Potential Revenue Impact</p>
                        <div className="bg-success/5 rounded-lg p-4">
                          <p className="text-2xl font-bold text-success">${(selected.potentialRevenue / 1000).toFixed(0)}K</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Estimated additional revenue if action is taken</p>
                        </div>
                      </div>
                    )}

                    {/* Related Tasks */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Related Tasks</p>
                      <div className="space-y-2">
                        {[
                          { title: `Schedule outreach call to ${selected.client.name}`, status: "todo" },
                          { title: `Prepare account review for ${selected.client.name}`, status: "in_progress" },
                        ].map((task, i) => (
                          <div key={i} className="flex items-center gap-2.5 bg-muted/30 rounded-lg p-2.5">
                            <div className={`w-2 h-2 rounded-full ${task.status === "todo" ? "bg-muted-foreground" : "bg-primary"}`} />
                            <p className="text-xs flex-1">{task.title}</p>
                            <Badge variant="outline" className="text-[9px]">{task.status.replace("_", " ")}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" className="text-xs gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Mark as Acted
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Acknowledge
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground">
                        <XCircle className="w-3.5 h-3.5" /> Dismiss
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex items-center justify-center"
              >
                <EmptyState icon="sparkles" title="Select a recommendation" description="Click on any recommendation to view details and take action." />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
