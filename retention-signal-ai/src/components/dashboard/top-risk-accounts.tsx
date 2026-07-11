"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clients } from "@/lib/mock-data";
import { ArrowRight, TrendingDown, TrendingUp, Minus, AlertTriangle } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

function getTrendIcon(trend: number[]) {
  const recent = trend[trend.length - 1];
  const prev = trend[trend.length - 3];
  if (recent > prev + 3) return <TrendingUp className="w-3.5 h-3.5 text-success" />;
  if (recent < prev - 3) return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

function getRiskLevel(score: number) {
  if (score < 45) return { level: "Critical", color: "bg-destructive/10 text-destructive" };
  if (score < 55) return { level: "High", color: "bg-destructive/10 text-destructive" };
  if (score < 65) return { level: "Medium", color: "bg-warning/10 text-warning" };
  return { level: "Low", color: "bg-muted text-muted-foreground" };
}

export function TopRiskAccounts() {
  const riskAccounts = clients
    .filter(c => c.healthScore < 65)
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <CardTitle className="text-sm font-semibold">Top Risk Accounts</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground">Client</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Health</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Trend</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Owner</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Risk Level</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">Recommended Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riskAccounts.map((client) => {
              const risk = getRiskLevel(client.healthScore);
              return (
                <TableRow key={client.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-[10px] bg-muted">{client.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{client.name}</p>
                        <p className="text-[10px] text-muted-foreground">{client.industry}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-10 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            client.healthScore < 45 ? "bg-destructive" : client.healthScore < 60 ? "bg-warning" : "bg-success"
                          }`}
                          style={{ width: `${client.healthScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{client.healthScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTrendIcon(client.trend)}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{client.manager.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${risk.color}`}>
                      {risk.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-muted-foreground">Schedule executive review</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
