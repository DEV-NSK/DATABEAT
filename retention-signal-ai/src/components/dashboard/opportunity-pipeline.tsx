"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

/**
 * Opportunity Pipeline — placeholder until opportunity data source is connected.
 * All mock/demo data has been removed.
 */
export function OpportunityPipeline() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Opportunity Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground text-center py-4">
          Upsell and cross-sell opportunities will appear here once detected from report analysis.
        </p>
      </CardContent>
    </Card>
  );
}
