"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2, Loader2, Circle, AlertCircle, ArrowDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PipelineStepStatus } from "@/lib/types";
import type { PipelineStepData } from "@/lib/weekly-report-store";

interface AIProcessingPipelineProps {
  steps: PipelineStepData[];
  isActive: boolean;
}

const statusIcons: Record<PipelineStepStatus, React.ReactNode> = {
  pending: <Circle className="w-4 h-4 text-muted-foreground/40" />,
  processing: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
  completed: <CheckCircle2 className="w-4 h-4 text-success" />,
  error: <AlertCircle className="w-4 h-4 text-destructive" />,
};

const statusBg: Record<PipelineStepStatus, string> = {
  pending: "bg-muted/50",
  processing: "bg-primary/5 border-primary/20",
  completed: "bg-success/5 border-success/20",
  error: "bg-destructive/5 border-destructive/20",
};

export function AIProcessingPipeline({ steps, isActive }: AIProcessingPipelineProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI Processing Pipeline</h3>
      </div>

      <div className="space-y-0">
        {steps.map((step, index) => (
          <div key={step.id}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent transition-colors",
                statusBg[step.status]
              )}
            >
              <div className="shrink-0">
                {statusIcons[step.status]}
              </div>
              <span className={cn(
                "text-xs font-medium",
                step.status === "pending" ? "text-muted-foreground" :
                step.status === "processing" ? "text-primary" :
                step.status === "completed" ? "text-success" :
                "text-destructive"
              )}>
                {step.label}
              </span>
              {step.status === "processing" && (
                <motion.div
                  className="ml-auto flex gap-0.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
            {index < steps.length - 1 && (
              <div className="flex justify-center py-0.5">
                <ArrowDown className={cn(
                  "w-3 h-3",
                  step.status === "completed" ? "text-success/40" :
                  step.status === "processing" ? "text-primary/40" :
                  "text-muted-foreground/20"
                )} />
              </div>
            )}
          </div>
        ))}
      </div>

      {!isActive && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground text-center">
            Upload a report to start the AI pipeline
          </p>
        </div>
      )}
    </Card>
  );
}
