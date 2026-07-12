import type { Manager, Client, WeeklyReport, Task, Recommendation, Opportunity, Activity, Notification, ContractRenewal, AIInsight } from "./types";

export const managers: Manager[] = [];
export const clients: Client[] = [];
export const weeklyReports: WeeklyReport[] = [];
export const tasks: Task[] = [];
export const recommendations: Recommendation[] = [];
export const opportunities: Opportunity[] = [];
export const activities: Activity[] = [];
export const notifications: Notification[] = [];
export const contractRenewals: ContractRenewal[] = [];
export const aiInsights: AIInsight[] = [];

export const kpiSummary = {
  totalClients: 0,
  healthyAccounts: 0,
  riskAccounts: 0,
  openTasks: 0,
  totalRevenue: 0,
  avgHealthScore: 0,
  upsellOpportunities: 0,
  crossSellOpportunities: 0,
};

export const healthTrendData = {
  weekly: [] as { period: string; healthy: number; warning: number; atRisk: number; critical: number }[],
  monthly: [] as { period: string; healthy: number; warning: number; atRisk: number; critical: number }[],
  quarterly: [] as { period: string; healthy: number; warning: number; atRisk: number; critical: number }[],
  yearly: [] as { period: string; healthy: number; warning: number; atRisk: number; critical: number }[],
};

export const healthDistribution: { name: string; value: number; color: string }[] = [];

