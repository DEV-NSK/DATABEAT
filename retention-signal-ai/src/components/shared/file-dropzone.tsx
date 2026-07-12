"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection, type DropEvent } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, X, RefreshCw, CheckCircle2, AlertCircle,
  File, Loader2, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadStatus } from "@/lib/weekly-report-store";

interface FileDropzoneProps {
  accept?: Record<string, string[]>;
  maxSize?: number;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  progress: number;
  status: UploadStatus;
  errorMessage?: string | null;
  onRetry?: () => void;
}

const statusLabels: Record<string, string> = {
  uploading: "Uploading Report...",
  sending: "Sending to AI...",
  extracting: "Waiting for Analysis...",
  analyzing: "Waiting for Analysis...",
  saving: "Saving results...",
  completed: "Weekly report processed successfully.",
  error: "Upload failed",
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatUploadTime(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FileDropzone({
  accept = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  },
  maxSize = 25 * 1024 * 1024,
  onFileSelect,
  onFileRemove,
  selectedFile,
  progress,
  status,
  errorMessage,
  onRetry,
}: FileDropzoneProps) {
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[], _event: DropEvent) => {
      setFileError(null);
      if (rejectedFiles.length > 0) {
        setFileError(rejectedFiles[0].errors[0]?.message || "Invalid file");
        return;
      }
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    noClick: !!selectedFile,
    noKeyboard: !!selectedFile,
  });

  const isProcessing = status !== "idle" && status !== "completed" && status !== "error";

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div
              {...getRootProps()}
              className={cn(
                "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200",
                "hover:border-primary/40 hover:bg-primary/[0.02]",
                isDragActive
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border/60",
                fileError && "border-destructive/50 bg-destructive/[0.02]"
              )}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center gap-4"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                  isDragActive ? "bg-primary/10" : "bg-muted"
                )}>
                  <Upload className={cn(
                    "w-7 h-7 transition-colors",
                    isDragActive ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground">
                    No weekly report uploaded.
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a DOCX or PDF report to begin AI analysis.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="mt-1 gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                >
                  <File className="w-4 h-4" />
                  Choose File
                </Button>
                <p className="text-xs text-muted-foreground">
                  Supported formats: <span className="font-medium text-foreground/70">DOCX, PDF</span>
                  <span className="mx-1.5 text-border">|</span>
                  Max size: <span className="font-medium text-foreground/70">25 MB</span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="file-selected"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            {/* File Info */}
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  status === "completed" ? "bg-success/10" : status === "error" ? "bg-destructive/10" : "bg-primary/10"
                )}>
                  {status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : status === "error" ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {selectedFile.name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatUploadTime(new Date())}
                        </span>
                        <span className={cn(
                          "text-xs font-medium",
                          status === "completed" ? "text-success" :
                          status === "error" ? "text-destructive" :
                          "text-primary"
                        )}>
                          {status === "idle" ? "Ready" : statusLabels[status]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={open}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Replace File
                        </Button>
                      )}
                      {status === "error" && onRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={onRetry}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Retry
                        </Button>
                      )}
                      {!isProcessing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={onFileRemove}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <AnimatePresence>
                    {(isProcessing || status === "completed") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={cn(
                                "h-full rounded-full",
                                status === "completed" ? "bg-success" : "bg-primary"
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground tabular-nums w-10 text-right">
                            {progress}%
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Animated status messages during upload */}
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 flex items-center gap-2"
                    >
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground">
                        {statusLabels[status]}
                      </span>
                    </motion.div>
                  )}

                  {/* Success message */}
                  {status === "completed" && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-success mt-2 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Weekly report processed successfully.
                    </motion.p>
                  )}

                  {/* Error Message */}
                  {status === "error" && errorMessage && (
                    <p className="text-xs text-destructive mt-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errorMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Error */}
      {fileError && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-destructive flex items-center gap-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {fileError}
        </motion.p>
      )}
    </div>
  );
}
