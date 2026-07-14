"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

/**
 * Contract Renewals — placeholder until a contract_renewals data source is connected.
 * All mock/demo data has been removed.
 */
export function ContractRenewals() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Upcoming Contract Renewals</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground text-center py-4">
          Contract renewal data will appear here once a contracts table is connected.
        </p>
      </CardContent>
    </Card>
  );
}
