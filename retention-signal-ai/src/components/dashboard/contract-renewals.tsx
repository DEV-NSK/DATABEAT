"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { contractRenewals } from "@/lib/mock-data";
import { ArrowRight, Calendar } from "lucide-react";

export function ContractRenewals() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Upcoming Contract Renewals</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {contractRenewals.slice(0, 6).map((renewal) => (
            <div
              key={renewal.client.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-[10px] bg-muted">
                  {renewal.client.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{renewal.client.name}</p>
                <p className="text-[10px] text-muted-foreground">{renewal.client.industry} · ${(renewal.currentValue / 1000).toFixed(0)}K/yr</p>
              </div>
              <div className="text-center shrink-0">
                <div className={`text-sm font-semibold ${renewal.daysLeft < 30 ? "text-destructive" : renewal.daysLeft < 60 ? "text-warning" : "text-foreground"}`}>
                  {renewal.daysLeft}d
                </div>
                <p className="text-[9px] text-muted-foreground">remaining</p>
              </div>
              <div className="text-center shrink-0">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-8 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        renewal.healthScore < 50 ? "bg-destructive" : renewal.healthScore < 70 ? "bg-warning" : "bg-success"
                      }`}
                      style={{ width: `${renewal.healthScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium">{renewal.healthScore}</span>
                </div>
                <p className="text-[9px] text-muted-foreground">health</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] text-muted-foreground">{renewal.manager.name}</p>
                <Badge variant="outline" className="text-[9px] mt-0.5">
                  {renewal.daysLeft < 30 ? "Urgent" : renewal.daysLeft < 60 ? "Soon" : "On track"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
