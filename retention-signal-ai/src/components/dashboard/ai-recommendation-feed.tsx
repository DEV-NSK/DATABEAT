"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

/**
 * AI Recommendation Feed — placeholder until recommendations data source is connected.
 * All mock/demo data has been removed.
 */
export function AIRecommendationFeed() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-semibold">AI Recommendations</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground text-center py-4">
          AI-generated recommendations will appear here after report analysis.
        </p>
      </CardContent>
    </Card>
  );
}
