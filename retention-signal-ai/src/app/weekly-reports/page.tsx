"use client";

import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { AIProcessingPipeline } from "@/components/weekly-reports/ai-processing-pipeline";
import { ReportSummaryPreview } from "@/components/weekly-reports/report-summary-preview";
import { UploadHistory } from "@/components/weekly-reports/upload-history";
import {
  SkeletonMetadata,
  SkeletonSummaryCards,
  SkeletonReportTable,
  SkeletonTimeline,
} from "@/components/weekly-reports/skeletons";
import {
  useWeeklyReportStore,
  type UploadStatus,
} from "@/lib/weekly-report-store";
import type {
  WeeklyReportResponse,
  UploadHistoryEntry,
} from "@/lib/types";
import {
  Upload, Info, FileText,
} from "lucide-react";

const WEBHOOK_URL = "https://poojareddy.app.n8n.cloud/webhook/weekly-report-intake";

export default function WeeklyReportsPage() {
  const {
    selectedFile,
    progress,
    uploadStatus,
    errorMessage,
    pipelineSteps,
    reportData,
    history,
    isLoading,
    setSelectedFile,
    setProgress,
    setUploadStatus,
    setErrorMessage,
    setReportData,
    setIsLoading,
    resetPipeline,
    updatePipelineStep,
    addHistoryEntry,
    deleteHistoryEntry,
    reset,
  } = useWeeklyReportStore();

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploadStatus("uploading");
      setProgress(0);
      setReportData(null);
      setErrorMessage(null);
      setIsLoading(true);
      resetPipeline();

      // Progress animation
      let currentProgress = 0;
      const uploadInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 5, 85);
        setProgress(currentProgress);
      }, 300);
      progressRef.current = uploadInterval;

      try {
        // Step 1: Upload Complete
        updatePipelineStep(0, "processing");
        await new Promise((r) => setTimeout(r, 400));
        updatePipelineStep(0, "completed");

        // Step 2: Sending to n8n
        setUploadStatus("sending");
        updatePipelineStep(1, "processing");

        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(WEBHOOK_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000,
        });

        updatePipelineStep(1, "completed");
        setProgress(40);

        // Step 3: Document Extraction
        setUploadStatus("extracting");
        updatePipelineStep(2, "processing");
        await new Promise((r) => setTimeout(r, 500));
        updatePipelineStep(2, "completed");
        setProgress(55);

        // Step 4: AI Parsing
        setUploadStatus("analyzing");
        updatePipelineStep(3, "processing");
        await new Promise((r) => setTimeout(r, 500));
        updatePipelineStep(3, "completed");
        setProgress(75);

        // Step 5: Saving to Database
        setUploadStatus("saving");
        updatePipelineStep(4, "processing");
        await new Promise((r) => setTimeout(r, 400));
        updatePipelineStep(4, "completed");

        // Step 6: Completed
        updatePipelineStep(5, "processing");
        await new Promise((r) => setTimeout(r, 300));
        updatePipelineStep(5, "completed");
        setProgress(100);

        // Process response
        const data = response.data as WeeklyReportResponse;

        if (data?.success) {
          setUploadStatus("completed");
          setReportData(data);

          // Add to history
          const entry: UploadHistoryEntry = {
            id: `uh-${Date.now()}`,
            reportId: data.reportId || "—",
            uploadDate: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            reportingPeriod: data.report?.reportingPeriod || "—",
            fileName: file.name,
            status: "completed",
          };
          addHistoryEntry(entry);
        } else {
          setUploadStatus("error");
          setErrorMessage(
            data?.message || "Unable to process document. Please try again."
          );
          setProgress(0);
        }
      } catch (err: unknown) {
        clearInterval(uploadInterval);
        setUploadStatus("error");
        setProgress(0);

        if (axios.isAxiosError(err) && err.response?.data) {
          const backendData = err.response.data as { message?: string; success?: boolean };
          setErrorMessage(
            backendData.message || "Unable to process document. Please try again."
          );
        } else {
          setErrorMessage("Unable to process document. Please try again.");
        }
      } finally {
        clearInterval(uploadInterval);
        progressRef.current = null;
        setIsLoading(false);
      }
    },
    [
      setUploadStatus,
      setProgress,
      setReportData,
      setErrorMessage,
      setIsLoading,
      resetPipeline,
      updatePipelineStep,
      addHistoryEntry,
    ]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      setSelectedFile(file);
      uploadFile(file);
    },
    [setSelectedFile, uploadFile]
  );

  const handleFileRemove = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    reset();
  }, [reset]);

  const handleRetry = useCallback(() => {
    if (selectedFile) {
      uploadFile(selectedFile);
    }
  }, [selectedFile, uploadFile]);

  const handleDeleteHistory = useCallback(
    (id: string) => {
      deleteHistoryEntry(id);
    },
    [deleteHistoryEntry]
  );

  const handleViewHistory = useCallback((_entry: UploadHistoryEntry) => {
    // Could navigate to a detail view or re-display data
  }, []);

  const isPipelineActive = uploadStatus !== "idle";
  const showContent = reportData !== null;
  const showEmptyState = !reportData && !isLoading && uploadStatus === "idle";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Weekly Report Upload Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload client weekly reports for automated AI analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              handleFileRemove();
            }}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Report
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
        {/* LEFT PANEL */}
        <div className="space-y-5">
          {/* Upload Card */}
          <Card className="p-6">
            <FileDropzone
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              selectedFile={selectedFile}
              progress={progress}
              status={uploadStatus}
              errorMessage={errorMessage}
              onRetry={handleRetry}
            />
          </Card>

          {/* Loading Skeletons */}
          {isLoading && !reportData && (
            <div className="space-y-5">
              <SkeletonMetadata />
              <SkeletonSummaryCards />
              <SkeletonReportTable />
            </div>
          )}

          {/* Metadata Panel — Only show when data is available */}
          {showContent && reportData && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Extracted Metadata
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetadataItem
                  label="Reporting Period"
                  value={reportData.report.reportingPeriod}
                />
                <MetadataItem
                  label="Upload Date"
                  value={
                    reportData.uploadedFile?.uploadedAt
                      ? new Date(reportData.uploadedFile.uploadedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : new Date().toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                  }
                />
                <MetadataItem
                  label="Document Type"
                  value={reportData.uploadedFile?.fileType?.toUpperCase() || (selectedFile?.name.endsWith(".pdf") ? "PDF" : "DOCX")}
                />
                <MetadataItem
                  label="Processing Status"
                  value="Completed"
                  status="completed"
                />
              </div>
            </Card>
          )}

          {/* Summary Cards + Report Details */}
          {showContent && <ReportSummaryPreview data={reportData} />}

          {/* Empty State */}
          {showEmptyState && (
            <Card className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                No report uploaded yet
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Upload your first weekly report to view extracted information.
              </p>
            </Card>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-5">
          {/* AI Pipeline */}
          {isLoading ? (
            <SkeletonTimeline />
          ) : (
            <AIProcessingPipeline steps={pipelineSteps} isActive={isPipelineActive} />
          )}

          {/* Upload History */}
          <UploadHistory
            entries={history}
            onView={handleViewHistory}
            onDelete={handleDeleteHistory}
          />

          {/* Empty state for right panel when no history and no data */}
          {history.length === 0 && showEmptyState && (
            <Card className="p-6 text-center">
              <p className="text-xs text-muted-foreground">
                Upload your first weekly report to view extracted information.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MetadataItem({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: "pending" | "completed";
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
        {label}
      </p>
      {status ? (
        <Badge
          variant="outline"
          className={`text-[10px] ${
            status === "completed"
              ? "text-success bg-success/10 border-success/20"
              : "text-muted-foreground bg-muted"
          }`}
        >
          {value}
        </Badge>
      ) : (
        <p className="text-xs font-medium text-foreground">{value}</p>
      )}
    </div>
  );
}
