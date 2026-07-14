import { create } from "zustand";
import type {
  PipelineStepStatus,
  WeeklyReportResponse,
  UploadHistoryEntry,
} from "@/lib/types";

export type UploadStatus =
  | "idle"
  | "uploading"
  | "sending"
  | "extracting"
  | "analyzing"
  | "saving"
  | "completed"
  | "error";

export interface PipelineStepData {
  id: string;
  label: string;
  status: PipelineStepStatus;
}

const DEFAULT_PIPELINE_STEPS: PipelineStepData[] = [
  { id: "upload", label: "Upload Complete", status: "pending" },
  { id: "n8n", label: "Sending to n8n", status: "pending" },
  { id: "extraction", label: "Document Extraction", status: "pending" },
  { id: "parsing", label: "AI Parsing", status: "pending" },
  { id: "saving", label: "Saving to Database", status: "pending" },
  { id: "done", label: "Completed", status: "pending" },
];

interface WeeklyReportState {
  // File
  selectedFile: File | null;
  // Upload
  progress: number;
  uploadStatus: UploadStatus;
  errorMessage: string | null;
  // Pipeline
  pipelineSteps: PipelineStepData[];
  // Response data
  reportData: WeeklyReportResponse | null;
  // History
  history: UploadHistoryEntry[];
  // Loading
  isLoading: boolean;

  // Actions
  setSelectedFile: (file: File | null) => void;
  setProgress: (progress: number) => void;
  setUploadStatus: (status: UploadStatus) => void;
  setErrorMessage: (msg: string | null) => void;
  setReportData: (data: WeeklyReportResponse | null) => void;
  setIsLoading: (loading: boolean) => void;
  resetPipeline: () => void;
  updatePipelineStep: (stepIndex: number, status: PipelineStepStatus) => void;
  addHistoryEntry: (entry: UploadHistoryEntry) => void;
  setHistory: (entries: UploadHistoryEntry[]) => void;
  deleteHistoryEntry: (id: string) => void;
  reset: () => void;
}

export const useWeeklyReportStore = create<WeeklyReportState>((set) => ({
  selectedFile: null,
  progress: 0,
  uploadStatus: "idle",
  errorMessage: null,
  pipelineSteps: DEFAULT_PIPELINE_STEPS,
  reportData: null,
  history: [],
  isLoading: false,

  setSelectedFile: (file) => set({ selectedFile: file }),
  setProgress: (progress) => set({ progress }),
  setUploadStatus: (uploadStatus) => set({ uploadStatus }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setReportData: (reportData) => set({ reportData }),
  setIsLoading: (isLoading) => set({ isLoading }),

  resetPipeline: () =>
    set({
      pipelineSteps: DEFAULT_PIPELINE_STEPS,
      progress: 0,
      uploadStatus: "idle",
      errorMessage: null,
    }),

  updatePipelineStep: (stepIndex, status) =>
    set((state) => ({
      pipelineSteps: state.pipelineSteps.map((step, i) => {
        if (i < stepIndex) return { ...step, status: "completed" };
        if (i === stepIndex) return { ...step, status };
        return step;
      }),
    })),

  addHistoryEntry: (entry) =>
    set((state) => ({ history: [entry, ...state.history] })),

  setHistory: (entries) =>
    set({ history: entries }),

  deleteHistoryEntry: (id) =>
    set((state) => ({
      history: state.history.filter((e) => e.id !== id),
    })),

  reset: () =>
    set({
      selectedFile: null,
      progress: 0,
      uploadStatus: "idle",
      errorMessage: null,
      pipelineSteps: DEFAULT_PIPELINE_STEPS,
      reportData: null,
      isLoading: false,
    }),
}));
