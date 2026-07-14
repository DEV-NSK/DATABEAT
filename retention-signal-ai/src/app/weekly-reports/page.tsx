"use client";

import { useCallback, useRef, useEffect, useState } from "react";
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
  Upload, Info, FileText, Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { getAuthHeaders } from "@/lib/auth-helpers";
import { HealthScoreHistoryTable } from "@/components/weekly-reports/health-score-history-table";

const WEBHOOK_URL = "https://poojareddy.app.n8n.cloud/webhook/weekly-report-intake";

export default function WeeklyReportsPage() {
  const { user } = useAuth();
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
    setHistory,
    deleteHistoryEntry,
    reset,
  } = useWeeklyReportStore();

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Fetch latest report and history on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsInitialLoading(true);
        
        const headers = await getAuthHeaders();
        
        // Fetch latest report
        const latestResponse = await fetch('/api/weekly-reports/latest', { headers });
        const latestData = await latestResponse.json();
        
        if (latestData.success && latestData.data) {
          // Map actual database structure to expected WeeklyReportResponse format
          const mappedData = mapDatabaseToResponse(latestData.data);
          setReportData(mappedData);
        }

        // Fetch upload history
        const historyResponse = await fetch('/api/weekly-reports/history', { headers });
        const historyData = await historyResponse.json();
        
        if (historyData.success && historyData.data) {
          // Convert database records to UploadHistoryEntry format
          const historyEntries: UploadHistoryEntry[] = historyData.data.map((item: any) => ({
            id: item.id,
            reportId: item.id,
            uploadDate: new Date(item.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            reportingPeriod: item.week || "—",
            fileName: `${item.client_name || 'Unknown'} - ${item.week || 'Unknown'}`,
            status: "completed",
          }));
          
          // Set history from backend
          setHistory(historyEntries);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [setReportData, setHistory]);

  // Function to map database structure to WeeklyReportResponse format
  const mapDatabaseToResponse = (dbRecord: any): WeeklyReportResponse => {
    return {
      success: true,
      reportId: dbRecord.id,
      processingStatus: "completed",
      uploadedFile: {
        fileName: `${dbRecord.client_name || 'Unknown'} - ${dbRecord.week || 'Unknown'}`,
        fileType: "PDF",
        uploadedAt: dbRecord.created_at || dbRecord.report_timestamp,
      },
      report: {
        reportingPeriod: dbRecord.week || "—",
        churnRisk: {
          score: dbRecord.escalation ? 70 : 30,
          level: dbRecord.escalation ? "High" : "Low",
        },
        crossSell: dbRecord.scope_creep ? "Yes" : "No",
        clientRequirement: `${dbRecord.requirement_fulfillment || 0}/100`,
        completionStatus: dbRecord.rework > 0 ? "With Rework" : "Completed",
        onTimeDelivery: dbRecord.sla_miss ? "No" : "Yes",
        slaCommitmentBreach: dbRecord.sla_miss ? "Yes" : "No",
        escalations: dbRecord.escalation ? "Yes" : "No",
        clientSentiment: dbRecord.relationship_feedback || "N/A",
        scopeVsCapacity: dbRecord.scope_creep ? "Yes" : "No",
        openRisksFlags: dbRecord.escalation ? "Yes" : "No",
        notes: dbRecord.delivery_comments || "No comments",
      },
    };
  };

  // Function to save report data to Supabase
  const saveToSupabase = async (data: WeeklyReportResponse, file: File) => {
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    try {
      // Extract relevant data from the n8n response
      // Map the response to your database schema
      const dbRecord = {
        user_id: user.id,
        company_name: user.company_name,
        uploaded_by: user.full_name,
        client_name: data.report?.reportingPeriod?.split(' - ')[0] || 'Unknown Client',
        week: data.report?.reportingPeriod || 'Unknown Week',
        manager: user.full_name || 'System',
        sla_miss: data.report?.onTimeDelivery === 'No',
        escalation: data.report?.escalations === 'Yes' || data.report?.churnRisk?.level === 'High',
        rework: data.report?.completionStatus === 'With Rework' ? 1 : 0,
        scope_creep: data.report?.crossSell === 'Yes' || data.report?.scopeVsCapacity === 'Yes',
        requirement_fulfillment: parseInt(data.report?.clientRequirement?.split('/')[0]) || 100,
        stakeholder_alignment: 80, // Default value
        communication: 80, // Default value
        meeting_frequency: 80, // Default value
        delivery_comments: data.report?.notes || '',
        relationship_feedback: data.report?.clientSentiment || '',
        report_timestamp: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('weekly_reports')
        .insert([dbRecord]);

      if (error) {
        console.error('Error saving to Supabase:', error);
        // Don't throw error - we still want to show the data from n8n response
      } else {
        console.log('Successfully saved to Supabase');
      }
    } catch (error) {
      console.error('Error in saveToSupabase:', error);
      // Don't throw error - we still want to show the data from n8n response
    }
  };

  // Function to refresh data from backend
  const refreshData = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      
      // Fetch latest report
      const latestResponse = await fetch('/api/weekly-reports/latest', { headers });
      const latestData = await latestResponse.json();
      
      if (latestData.success && latestData.data) {
        // Map actual database structure to expected WeeklyReportResponse format
        const mappedData = mapDatabaseToResponse(latestData.data);
        setReportData(mappedData);
      }

      // Fetch upload history
      const historyResponse = await fetch('/api/weekly-reports/history', { headers });
      const historyData = await historyResponse.json();
      
      if (historyData.success && historyData.data) {
        // Convert database records to UploadHistoryEntry format
        const historyEntries: UploadHistoryEntry[] = historyData.data.map((item: any) => ({
          id: item.id,
          reportId: item.id,
          uploadDate: new Date(item.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          reportingPeriod: item.week || "—",
          fileName: `${item.client_name || 'Unknown'} - ${item.week || 'Unknown'}`,
          status: "completed",
        }));
        
        // Set history from backend
        setHistory(historyEntries);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [setReportData, setHistory]);

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

        // Attach authenticated user context so n8n can associate
        // the report with the correct user and company.
        if (user) {
          formData.append("user_id",      user.id);
          formData.append("company_name", user.company_name  ?? "");
          formData.append("uploaded_by",  user.full_name     ?? "");
          formData.append("email",        user.email         ?? "");
          formData.append("designation",  user.designation   ?? "");
          formData.append("role",         user.role          ?? "Manager");
        }

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

          // Save to Supabase database
          await saveToSupabase(data, file);

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

          // Refresh data from backend after successful upload
          await refreshData();
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
      user,
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

  const handleUploadNewReport = useCallback(() => {
    setShowUploadDialog(true);
    reset();
  }, [reset]);

  const isPipelineActive = uploadStatus !== "idle";
  const showContent = reportData !== null;
  const showEmptyState = !reportData && !isLoading && !isInitialLoading && uploadStatus === "idle";
  const showUploadInterface = !reportData && !isInitialLoading;

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
          {showContent && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleUploadNewReport}
            >
              <Plus className="w-3.5 h-3.5" />
              Upload New Report
            </Button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
        {/* LEFT PANEL */}
        <div className="space-y-5">
          {/* Upload Card - Only show when no reports exist */}
          {showUploadInterface && (
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
          )}

          {/* Loading Skeletons - Show during initial load or upload */}
          {(isInitialLoading || (isLoading && !reportData)) && (
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
                No reports found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No weekly reports have been uploaded yet. Upload your first report to get started.
              </p>
            </Card>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-5">
          {/* AI Pipeline */}
          {isLoading || isInitialLoading ? (
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

      {/* AI Health Score History — sourced from client_health_scores */}
      <HealthScoreHistoryTable />
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
