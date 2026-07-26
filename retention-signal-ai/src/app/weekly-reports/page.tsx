"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Upload, Info, FileText, Plus, Building2, User, Calendar, AlertCircle, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { getAuthHeaders } from "@/lib/auth-helpers";
import { HealthScoreHistoryTable } from "@/components/weekly-reports/health-score-history-table";
import { toast } from "sonner";

const WEBHOOK_URL = "https://poojareddy.app.n8n.cloud/webhook/weekly-report-intake";

// ─── Client type from client_health_scores (unique companies) ────────────────
interface ClientOption {
  id: string;
  company_name: string;
}

// ─── Get current week Monday–Sunday range ────────────────────────────────────
function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon ...
  const diff = day === 0 ? -6 : 1 - day; // days to Monday
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(mon), end: fmt(sun) };
}

export default function WeeklyReportsPage() {
  const { user, manager } = useAuth();
  const router = useRouter();
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

  // PRD §21–23: Client selector, week range, notes
  const weekRange = getCurrentWeekRange();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [weekStart, setWeekStart] = useState(weekRange.start);
  const [weekEnd, setWeekEnd] = useState(weekRange.end);
  const [notes, setNotes] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  // Selected client name derived
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Load unique clients from client_health_scores scoped to user_id
  useEffect(() => {
    const loadClients = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("client_health_scores")
        .select("id, company_name")
        .eq("user_id", user.id)
        .order("company_name", { ascending: true });
      if (data) {
        // Deduplicate by company_name
        const seen = new Set<string>();
        const unique: ClientOption[] = [];
        for (const row of data as ClientOption[]) {
          const key = (row.company_name || "").toLowerCase();
          if (!seen.has(key)) { seen.add(key); unique.push(row); }
        }
        setClients(unique);
      }
    };
    loadClients();
  }, [user]);

  // Duplicate check: same client + week
  useEffect(() => {
    const check = async () => {
      if (!user || !selectedClientId || !weekStart) { setDuplicateWarning(false); return; }
      const { data } = await supabase
        .from("weekly_reports")
        .select("id")
        .eq("user_id", user.id)
        .eq("client_name", selectedClient?.company_name || "")
        .gte("report_timestamp", weekStart)
        .lte("report_timestamp", weekEnd + "T23:59:59");
      setDuplicateWarning((data?.length ?? 0) > 0);
    };
    check();
  }, [user, selectedClientId, weekStart, weekEnd, selectedClient]);

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
        client_name: selectedClient?.company_name || data.report?.reportingPeriod?.split(' - ')[0] || 'Unknown Client',
        week: `${weekStart} – ${weekEnd}`,
        manager: manager?.full_name || user.full_name || 'System',
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
      // Validate form before upload
      if (!selectedClientId) {
        toast.error("Please select a client before uploading.");
        return;
      }
      if (!weekStart || !weekEnd) {
        toast.error("Please select a report week.");
        return;
      }
      if (duplicateWarning) {
        toast.error("A report for this client and week already exists. Please view the existing report.");
        return;
      }

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
          formData.append("role",         user.role          ?? "team_lead");
          formData.append("client_name",  selectedClient?.company_name ?? "");
          formData.append("manager_name", manager?.full_name ?? "");
          formData.append("manager_id",   user.manager_id ?? "");
          formData.append("week_start",   weekStart);
          formData.append("week_end",     weekEnd);
          formData.append("notes",        notes);
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
      manager,
      selectedClientId,
      selectedClient,
      weekStart,
      weekEnd,
      notes,
      duplicateWarning,
      refreshData,
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
    setSelectedClientId("");
    setNotes("");
    const wr = getCurrentWeekRange();
    setWeekStart(wr.start);
    setWeekEnd(wr.end);
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
            Weekly Reports
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

      {/* PRD §21–23: Report Submission Form */}
      {showUploadInterface && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Report Submission Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Client <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedClientId}
                onValueChange={(val: string | null) => setSelectedClientId(val ?? "")}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a client…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No clients found — upload a report first
                    </SelectItem>
                  ) : (
                    clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.company_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Manager Display (read-only after client selected) */}
            {selectedClientId && (
              <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 rounded-lg text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="text-foreground font-medium">
                    {selectedClient?.company_name}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  Team Lead:{" "}
                  <span className="text-foreground font-medium ml-0.5">
                    {user?.full_name}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  Manager:{" "}
                  <span className="text-foreground font-medium ml-0.5">
                    {manager?.full_name || "Not assigned"}
                  </span>
                </span>
              </div>
            )}

            {/* Week Range Selector — PRD §23 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  Week Starting <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  Week Ending <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Duplicate warning — PRD §23 */}
            {duplicateWarning && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-warning">
                    A report for this client and week already exists.
                  </p>
                  <button
                    className="text-[10px] text-warning underline"
                    onClick={() => toast.info("View the existing report in the Reports page.")}
                  >
                    View Existing Report
                  </button>
                </div>
              </div>
            )}

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional context for this report…"
                className="text-sm resize-none"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

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

          {/* PRD §27 — Success Screen */}
          {showContent && uploadStatus === "completed" && selectedClient && (
            <Card className="border-success/20 bg-success/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-success mb-0.5">Report Processed Successfully</p>
                    <p className="text-xs text-muted-foreground mb-3">{selectedClient.company_name}</p>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">
                          {reportData?.report?.churnRisk?.score ?? "—"}
                          <span className="text-xs font-normal text-muted-foreground"> / 100</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">Health Score</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => router.push("/clients")}>
                        View Client
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => router.push("/reports")}>
                        View Report
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
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
