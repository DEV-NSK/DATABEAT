export type HealthStatus = "healthy" | "at_risk" | "critical" | "warning";
export type Priority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type OpportunityType = "upsell" | "cross_sell";
export type OpportunityStatus = "identified" | "qualified" | "proposed" | "won" | "lost";
export type NotificationType = "alert" | "recommendation" | "system" | "task";

export interface Manager {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
  clientCount: number;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  revenue: number;
  healthScore: number;
  healthStatus: HealthStatus;
  contractStart: string;
  contractEnd: string;
  manager: Manager;
  services: string[];
  trend: number[];
  lastActivity: string;
  contactPerson: string;
  contactEmail: string;
  employeeCount: number;
  region: string;
}

export interface WeeklyReport {
  id: string;
  clientId: string;
  client: Client;
  weekNumber: number;
  year: number;
  submittedAt: string;
  submittedBy: Manager;
  healthScore: number;
  summary: string;
  risks: string[];
  opportunities: string[];
  actionItems: string[];
  status: "submitted" | "reviewed" | "escalated";
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: Manager;
  client?: Client;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  category: string;
}

export interface Recommendation {
  id: string;
  type: "churn_risk" | "upsell" | "cross_sell" | "action";
  clientId: string;
  client: Client;
  title: string;
  reason: string;
  confidence: number;
  nextAction: string;
  priority: Priority;
  createdAt: string;
  status: "new" | "acknowledged" | "acted" | "dismissed";
  potentialRevenue?: number;
}

export interface Opportunity {
  id: string;
  type: OpportunityType;
  client: Client;
  service: string;
  potentialRevenue: number;
  confidence: number;
  status: OpportunityStatus;
  owner: Manager;
  createdAt: string;
  notes: string;
}

export interface Activity {
  id: string;
  type: "task_created" | "score_changed" | "manager_assigned" | "report_submitted" | "opportunity_found";
  title: string;
  description: string;
  client?: Client;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  client?: Client;
  actionUrl?: string;
}

export interface ContractRenewal {
  client: Client;
  daysLeft: number;
  renewalDate: string;
  currentValue: number;
  healthScore: number;
  manager: Manager;
}

export interface AIInsight {
  id: string;
  title: string;
  content: string;
  category: "risk" | "opportunity" | "trend" | "observation";
  confidence: number;
  relatedClients: Client[];
  createdAt: string;
}

// Weekly Report Upload types
export type PipelineStepStatus = "pending" | "processing" | "completed" | "error";

export interface PipelineStep {
  id: string;
  label: string;
  status: PipelineStepStatus;
}

export interface ReportData {
  reportingPeriod: string;
  churnRisk: {
    score: number;
    level: string;
  };
  crossSell: string;
  clientRequirement: string;
  completionStatus: string;
  onTimeDelivery: string;
  slaCommitmentBreach: string;
  escalations: string;
  clientSentiment: string;
  scopeVsCapacity: string;
  openRisksFlags: string;
  notes: string;
}

export interface UploadedFileMeta {
  fileName: string;
  fileType: string;
  uploadedAt: string;
}

export interface WeeklyReportResponse {
  success: boolean;
  reportId: string;
  processingStatus: string;
  uploadedFile: UploadedFileMeta;
  report: ReportData;
  message?: string;
}

export interface UploadHistoryEntry {
  id: string;
  reportId: string;
  uploadDate: string;
  reportingPeriod: string;
  fileName: string;
  status: "completed" | "processing" | "error";
}
