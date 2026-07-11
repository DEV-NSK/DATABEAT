"use client";

import { AlertTriangle, RefreshCw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onSupport?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an unexpected error while loading this data. Please try again or contact support if the issue persists.",
  onRetry,
  onSupport,
}: ErrorStateProps) {
  return (
    <Card>
      <CardContent className="py-16 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground max-w-[320px] leading-relaxed mb-4">{description}</p>
        <div className="flex items-center gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={onRetry}>
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </Button>
          )}
          {onSupport && (
            <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={onSupport}>
              <MessageCircle className="w-3.5 h-3.5" />
              Contact Support
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
