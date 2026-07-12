"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonMetadata() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-32 h-4" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="w-16 h-3 mb-2" />
            <Skeleton className="w-24 h-4" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SkeletonSummaryCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="w-3.5 h-3.5" />
            <Skeleton className="w-20 h-3" />
          </div>
          <Skeleton className="w-28 h-5" />
        </Card>
      ))}
    </div>
  );
}

export function SkeletonReportTable() {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <Skeleton className="w-28 h-4 mb-2" />
        <Skeleton className="w-48 h-3" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-3">
            <div className="flex items-center gap-2.5 w-48 shrink-0">
              <Skeleton className="w-3.5 h-3.5" />
              <Skeleton className="w-28 h-3" />
            </div>
            <Skeleton className="w-64 h-3" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SkeletonTimeline() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <Skeleton className="w-7 h-7 rounded-lg" />
        <Skeleton className="w-36 h-4" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="w-32 h-3" />
          </div>
        ))}
      </div>
    </Card>
  );
}
