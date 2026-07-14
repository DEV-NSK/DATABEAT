"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

/**
 * AI Insights — placeholder until an insights data source is connected.
 * All mock/demo data has been removed.
 */
export function AIInsights() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-semibold">AI Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground text-center py-4">
          AI portfolio insights will appear here once multiple reports have been analysed.
        </p>
      </CardContent>
    </Card>
  );
}
