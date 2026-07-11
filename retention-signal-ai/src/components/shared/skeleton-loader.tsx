"use client";

import { Card, CardContent } from "@/components/ui/card";

export function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted animate-skeleton" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-1/3 animate-skeleton" />
            <div className="h-2 bg-muted rounded w-1/2 animate-skeleton" />
          </div>
        </div>
        <div className="h-6 bg-muted rounded w-2/3 animate-skeleton" />
        <div className="h-2 bg-muted rounded w-full animate-skeleton" />
        <div className="h-2 bg-muted rounded w-4/5 animate-skeleton" />
      </CardContent>
    </Card>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="border-b border-border px-4 py-3 flex items-center gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 bg-muted rounded flex-1 animate-skeleton" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-4 border-b border-border last:border-0">
            <div className="w-8 h-8 rounded-lg bg-muted animate-skeleton shrink-0" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="h-3 bg-muted rounded flex-1 animate-skeleton" />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SkeletonChart() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="h-3 bg-muted rounded w-1/3 mb-4 animate-skeleton" />
        <div className="h-48 bg-muted rounded-lg animate-skeleton" />
      </CardContent>
    </Card>
  );
}

export function SkeletonKPIGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <div className="w-8 h-8 rounded-lg bg-muted animate-skeleton shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-2/3 animate-skeleton" />
            <div className="h-2 bg-muted rounded w-1/2 animate-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonKanban() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, col) => (
        <div key={col} className="rounded-xl p-3 bg-muted/20">
          <div className="h-4 bg-muted rounded w-1/2 mb-3 animate-skeleton" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3 space-y-2">
                  <div className="h-2 bg-muted rounded w-1/3 animate-skeleton" />
                  <div className="h-3 bg-muted rounded w-full animate-skeleton" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-skeleton" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
