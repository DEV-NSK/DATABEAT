import { Manager, Client, WeeklyReport, Task, Recommendation, Opportunity, Activity, Notification, ContractRenewal, AIInsight, HealthStatus, Priority } from "./types";

// Fixed reference date for deterministic date calculations
const FIXED_NOW = new Date("2026-07-11T12:00:00Z").getTime();

// Deterministic pseudo-random value from index (0-1 range), no state, always pure
function det(i: number, salt: number = 0): number {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Managers
export const managers: Manager[] = [
  { id: "m1", name: "Sarah Chen", email: "sarah.chen@company.com", avatar: "/avatars/sarah.jpg", role: "Senior Account Manager", department: "Enterprise", clientCount: 8 },
  { id: "m2", name: "James Wilson", email: "james.wilson@company.com", avatar: "/avatars/james.jpg", role: "Account Manager", department: "Mid-Market", clientCount: 6 },
  { id: "m3", name: "Priya Sharma", email: "priya.sharma@company.com", avatar: "/avatars/priya.jpg", role: "Delivery Manager", department: "Enterprise", clientCount: 7 },
  { id: "m4", name: "Michael Torres", email: "michael.torres@company.com", avatar: "/avatars/michael.jpg", role: "Customer Success Manager", department: "SMB", clientCount: 5 },
  { id: "m5", name: "Emily Rodriguez", email: "emily.rodriguez@company.com", avatar: "/avatars/emily.jpg", role: "Project Manager", department: "Enterprise", clientCount: 6 },
  { id: "m6", name: "David Kim", email: "david.kim@company.com", avatar: "/avatars/david.jpg", role: "Account Manager", department: "Mid-Market", clientCount: 5 },
  { id: "m7", name: "Lisa Thompson", email: "lisa.thompson@company.com", avatar: "/avatars/lisa.jpg", role: "Senior Account Manager", department: "Enterprise", clientCount: 5 },
  { id: "m8", name: "Robert Chang", email: "robert.chang@company.com", avatar: "/avatars/robert.jpg", role: "Delivery Manager", department: "Mid-Market", clientCount: 4 },
  { id: "m9", name: "Amanda Foster", email: "amanda.foster@company.com", avatar: "/avatars/amanda.jpg", role: "Customer Success Manager", department: "Enterprise", clientCount: 2 },
  { id: "m10", name: "Daniel Park", email: "daniel.park@company.com", avatar: "/avatars/daniel.jpg", role: "Account Manager", department: "SMB", clientCount: 2 },
];

const industries = ["Advertising", "Media", "Retail", "Healthcare", "Finance", "EdTech", "SaaS", "Manufacturing", "Technology", "Logistics"];
const services = ["Cloud Migration", "Data Analytics", "Cybersecurity", "DevOps", "AI/ML Solutions", "Digital Transformation", "Managed Services", "Software Development", "IT Consulting", "Infrastructure"];
const regions = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"];

function getHealthStatus(score: number): HealthStatus {
  if (score >= 80) return "healthy";
  if (score >= 60) return "warning";
  if (score >= 40) return "at_risk";
  return "critical";
}

function generateTrend(base: number, idx: number): number[] {
  return Array.from({ length: 12 }, (_, j) => {
    const variation = Math.sin(j * 0.5 + idx * 0.3) * 10 + Math.sin(j * 1.3 + idx * 0.7) * 5;
    return Math.max(0, Math.min(100, base + variation));
  });
}

const clientNames = [
  "Acme Digital", "Northgate Media", "Pixel Labs", "BlueWave", "Nova Retail",
  "GrowthX", "CloudNest", "Vertex Media", "Zen Analytics", "Orbit Systems",
  "Apex Dynamics", "BrightPath Health", "Cascade Financial", "DataForge", "Elevate EdTech",
  "FusionPoint", "GreenLeaf Retail", "HarborTech", "Innovate Media", "JetStream Logistics",
  "Keystone Analytics", "LunaWave", "Maven Health", "NexGen Solutions", "Optima Finance",
  "PulsePoint Media", "Quantum Leap", "RapidScale", "SilverLine Retail", "TrueNorth SaaS",
  "Upstream Digital", "Vista Analytics", "Wavelength", "Xcelerate", "YieldMax",
  "ArcLight Technologies", "Beacon Manufacturing", "CrestView Media", "DeepBlue AI", "EverGreen Retail",
  "FlexPoint Systems", "GlobeTech", "Highland Analytics", "IronBridge Finance", "Jubilee Health",
  "Kinetic Labs", "LinkLayer", "MetroEdge Media", "NorthStar Digital", "OmegaTech"
];

const contactFirstNames = ["John", "Jane", "Alex", "Maria", "David", "Sarah", "Robert", "Jennifer", "William", "Lisa", "James", "Emily", "Daniel", "Amanda", "Christopher", "Rachel", "Matthew", "Nicole", "Andrew", "Laura"];
const contactLastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris"];

function detDate(i: number, salt: number, start: Date, end: Date): string {
  const t = det(i, salt);
  const date = new Date(start.getTime() + t * (end.getTime() - start.getTime()));
  return date.toISOString().split("T")[0];
}

function detSubset<T>(arr: T[], i: number, salt: number, min: number, max: number): T[] {
  const count = min + Math.floor(det(i, salt) * (max - min + 1));
  // Deterministic shuffle using index-based scoring
  const scored = arr.map((item, j) => ({ item, score: det(i, salt * 100 + j) }));
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, count).map(s => s.item);
}

// Generate 50 clients
export const clients: Client[] = clientNames.map((name, i) => {
  const healthScore = Math.floor(det(i, 1) * 60) + 40;
  const revenue = Math.floor(det(i, 2) * 900 + 100) * 1000;
  const manager = managers[i % managers.length];
  const contractDays = Math.floor(det(i, 3) * 365) + 30;
  const contractEnd = new Date(FIXED_NOW);
  contractEnd.setDate(contractEnd.getDate() + contractDays);
  const contractStart = new Date(contractEnd);
  contractStart.setFullYear(contractStart.getFullYear() - 1);

  return {
    id: `c${i + 1}`,
    name,
    industry: industries[i % industries.length],
    revenue,
    healthScore,
    healthStatus: getHealthStatus(healthScore),
    contractStart: contractStart.toISOString().split("T")[0],
    contractEnd: contractEnd.toISOString().split("T")[0],
    manager,
    services: detSubset(services, i, 4, 1, 4),
    trend: generateTrend(healthScore, i),
    lastActivity: detDate(i, 5, new Date("2026-06-01"), new Date("2026-07-11")),
    contactPerson: `${contactFirstNames[i % 20]} ${contactLastNames[i % 20]}`,
    contactEmail: `${contactFirstNames[i % 20].toLowerCase()}.${contactLastNames[i % 20].toLowerCase()}@${name.toLowerCase().replace(/\s+/g, "")}.com`,
    employeeCount: Math.floor(det(i, 6) * 9000) + 100,
    region: regions[i % regions.length],
  };
});

// Generate weekly reports
export const weeklyReports: WeeklyReport[] = Array.from({ length: 500 }, (_, i) => {
  const client = clients[i % clients.length];
  const weekNum = (i % 52) + 1;
  const statuses: WeeklyReport["status"][] = ["submitted", "reviewed", "escalated"];
  const healthDelta = Math.floor((det(i, 10) - 0.5) * 20);
  return {
    id: `wr${i + 1}`,
    clientId: client.id,
    client,
    weekNumber: weekNum,
    year: 2026,
    submittedAt: `2026-${String(Math.floor(weekNum / 4.3) + 1).padStart(2, "0")}-${String((weekNum % 7) + 1).padStart(2, "0")}`,
    submittedBy: client.manager,
    healthScore: Math.max(0, Math.min(100, client.healthScore + healthDelta)),
    summary: `Weekly health assessment for ${client.name}. ${client.healthScore >= 70 ? "Account performing well with stable metrics." : "Account showing concerning trends requiring attention."}`,
    risks: client.healthScore < 60 ? ["Declining engagement", "Delayed deliverables", "Budget concerns"] : ["Minor timeline adjustments"],
    opportunities: client.healthScore >= 70 ? ["Expansion potential in analytics", "Cross-sell cloud services"] : [],
    actionItems: ["Schedule quarterly review", "Update project roadmap", "Follow up on feedback"],
    status: statuses[i % 3],
  };
});

// Generate tasks
export const tasks: Task[] = Array.from({ length: 100 }, (_, i) => {
  const client = clients[i % clients.length];
  const statuses: Task["status"][] = ["todo", "in_progress", "done", "blocked"];
  const priorities: Task["priority"][] = ["high", "medium", "low"];
  const categories = ["Account Review", "Client Meeting", "Risk Mitigation", "Upsell Proposal", "Contract Renewal", "Onboarding", "Escalation", "QBR Prep"];
  const titles = [
    `Review ${client.name} quarterly performance`,
    `Prepare risk assessment for ${client.name}`,
    `Schedule executive meeting with ${client.name}`,
    `Draft upsell proposal for ${client.name}`,
    `Follow up on ${client.name} contract renewal`,
    `Address ${client.name} service concerns`,
    `Update ${client.name} account health report`,
    `Plan QBR presentation for ${client.name}`,
  ];
  const dayOffset = Math.floor(det(i, 11) * 30) - 5;
  const dueDate = new Date(FIXED_NOW);
  dueDate.setDate(dueDate.getDate() + dayOffset);

  return {
    id: `t${i + 1}`,
    title: titles[i % titles.length],
    description: `Task related to ${client.name} account management and relationship building.`,
    status: statuses[i % 4],
    priority: priorities[i % 3],
    assignee: client.manager,
    client,
    dueDate: dueDate.toISOString().split("T")[0],
    createdAt: detDate(i, 12, new Date("2026-06-01"), new Date("2026-07-11")),
    completedAt: i % 4 === 2 ? detDate(i, 13, new Date("2026-07-01"), new Date("2026-07-11")) : undefined,
    category: categories[i % categories.length],
  };
});

// Generate recommendations
export const recommendations: Recommendation[] = Array.from({ length: 200 }, (_, i) => {
  const client = clients[i % clients.length];
  const types: Recommendation["type"][] = ["churn_risk", "upsell", "cross_sell", "action"];
  const type = types[i % 4];
  const priorities: Priority[] = ["high", "medium", "low"];

  const churnReasons = [
    `${client.name} has shown declining response rates over the last three weeks.`,
    `Engagement scores for ${client.name} dropped 15% this month.`,
    `${client.name} has delayed payments for the second consecutive month.`,
    `Key stakeholder at ${client.name} recently departed the organization.`,
  ];
  const upsellReasons = [
    `${client.name} is expanding rapidly and is a strong upsell candidate.`,
    `${client.name} has exceeded usage thresholds, indicating growth potential.`,
    `Recent project success at ${client.name} creates upsell momentum.`,
  ];
  const crossSellReasons = [
    `${client.name} could benefit from additional cybersecurity services.`,
    `${client.name}'s infrastructure suggests readiness for cloud migration.`,
    `Market analysis indicates ${client.name} needs data analytics capabilities.`,
  ];
  const actionReasons = [
    `Schedule executive check-in with ${client.name} to maintain relationship.`,
    `${client.name}'s contract renewal is approaching - begin preparation.`,
    `Proactive outreach recommended for ${client.name} based on engagement patterns.`,
  ];

  const reasonMap = { churn_risk: churnReasons, upsell: upsellReasons, cross_sell: crossSellReasons, action: actionReasons };
  const reason = reasonMap[type][i % reasonMap[type].length];
  const confidence = Math.floor(det(i, 14) * 30) + 70;

  return {
    id: `r${i + 1}`,
    type,
    clientId: client.id,
    client,
    title: `${type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())} - ${client.name}`,
    reason,
    confidence,
    nextAction: type === "churn_risk" ? "Schedule immediate outreach call" : type === "upsell" ? "Prepare expansion proposal" : type === "cross_sell" ? "Create service assessment" : "Schedule quarterly review",
    priority: priorities[i % 3],
    createdAt: detDate(i, 15, new Date("2026-06-15"), new Date("2026-07-11")),
    status: (["new", "acknowledged", "acted", "dismissed"] as const)[i % 4],
    potentialRevenue: type !== "churn_risk" ? Math.floor(det(i, 16) * 500 + 50) * 1000 : undefined,
  };
});

// Generate opportunities
export const opportunities: Opportunity[] = Array.from({ length: 60 }, (_, i) => {
  const client = clients[i % clients.length];
  const type = i < 30 ? "upsell" : "cross_sell";
  const statuses: Opportunity["status"][] = ["identified", "qualified", "proposed", "won", "lost"];
  const upsellServices = ["Enterprise Analytics Suite", "Advanced Security Package", "Premium Support Tier", "Extended Cloud Infrastructure", "AI-Powered Insights Module"];
  const crossSellServices = ["Managed DevOps", "Data Lake Implementation", "Compliance Framework", "Digital Workplace Solution", "API Integration Platform"];

  return {
    id: `o${i + 1}`,
    type,
    client,
    service: type === "upsell" ? upsellServices[i % upsellServices.length] : crossSellServices[i % crossSellServices.length],
    potentialRevenue: Math.floor(det(i, 17) * 800 + 100) * 1000,
    confidence: Math.floor(det(i, 18) * 40) + 60,
    status: statuses[i % 5],
    owner: client.manager,
    createdAt: detDate(i, 19, new Date("2026-05-01"), new Date("2026-07-11")),
    notes: `${type === "upsell" ? "Upsell" : "Cross-sell"} opportunity identified through AI analysis of ${client.name}'s usage patterns and growth trajectory.`,
  };
});

// Generate activities
export const activities: Activity[] = Array.from({ length: 50 }, (_, i) => {
  const client = clients[i % clients.length];
  const types: Activity["type"][] = ["task_created", "score_changed", "manager_assigned", "report_submitted", "opportunity_found"];
  const type = types[i % 5];
  const titles: Record<Activity["type"], string> = {
    task_created: `New task created for ${client.name}`,
    score_changed: `${client.name} health score changed to ${client.healthScore}`,
    manager_assigned: `${client.manager.name} assigned to ${client.name}`,
    report_submitted: `Weekly report submitted for ${client.name}`,
    opportunity_found: `New ${i % 2 === 0 ? "upsell" : "cross-sell"} opportunity for ${client.name}`,
  };

  return {
    id: `a${i + 1}`,
    type,
    title: titles[type],
    description: `Activity logged for ${client.name} account.`,
    client,
    createdAt: new Date(FIXED_NOW - i * 3600000 * 2).toISOString(),
  };
});

// Generate notifications
export const notifications: Notification[] = Array.from({ length: 40 }, (_, i) => {
  const client = clients[i % clients.length];
  const types: Notification["type"][] = ["alert", "recommendation", "system", "task"];
  const type = types[i % 4];
  const alertTitles = [
    `${client.name} health score dropped below 50`,
    `Critical: ${client.name} contract expiring in 30 days`,
    `${client.name} flagged for executive review`,
  ];
  const recTitles = [
    `AI recommends outreach to ${client.name}`,
    `Upsell opportunity detected for ${client.name}`,
    `Cross-sell analysis ready for ${client.name}`,
  ];
  const sysTitles = [
    "Weekly analysis complete - 3 accounts flagged",
    "System maintenance scheduled for Saturday 2AM",
    "New AI model deployed - improved accuracy by 12%",
  ];
  const taskTitles = [
    `Task overdue: Review ${client.name} proposal`,
    `New task assigned: ${client.name} QBR prep`,
    `Task completed: ${client.name} health assessment`,
  ];

  const titleMap = { alert: alertTitles, recommendation: recTitles, system: sysTitles, task: taskTitles };
  const title = titleMap[type][i % titleMap[type].length];

  return {
    id: `n${i + 1}`,
    type,
    title,
    message: `Detailed notification regarding ${client.name}. Review and take appropriate action.`,
    read: i > 15,
    createdAt: new Date(FIXED_NOW - i * 3600000 * 3).toISOString(),
    client,
    actionUrl: `/clients/${client.id}`,
  };
});

// Generate contract renewals
export const contractRenewals: ContractRenewal[] = clients
  .filter(c => {
    const end = new Date(c.contractEnd);
    const now = new Date(FIXED_NOW);
    const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 180;
  })
  .slice(0, 15)
  .map(c => {
    const daysLeft = Math.floor((new Date(c.contractEnd).getTime() - FIXED_NOW) / (1000 * 60 * 60 * 24));
    return {
      client: c,
      daysLeft,
      renewalDate: c.contractEnd,
      currentValue: c.revenue,
      healthScore: c.healthScore,
      manager: c.manager,
    };
  })
  .sort((a, b) => a.daysLeft - b.daysLeft);

// Generate AI insights
export const aiInsights: AIInsight[] = [
  { id: "ai1", title: "Declining Engagement Pattern", content: "Acme Digital has shown declining response rates over the last three weeks. Communication frequency dropped by 40%, and meeting attendance has decreased. Recommend proactive outreach from senior management.", category: "risk", confidence: 89, relatedClients: [clients[0], clients[5]], createdAt: "2026-07-11T08:00:00Z" },
  { id: "ai2", title: "High-Value Expansion Signal", content: "Northgate Media is expanding rapidly with 3 new office locations and 200+ new hires. Strong upsell candidate for Enterprise Analytics Suite and Premium Support.", category: "opportunity", confidence: 92, relatedClients: [clients[1]], createdAt: "2026-07-11T07:30:00Z" },
  { id: "ai3", title: "Industry-Wide Risk Detected", content: "Healthcare sector clients showing 15% average health score decline this quarter. Regulatory changes may be impacting project timelines. Consider proactive engagement with all healthcare accounts.", category: "trend", confidence: 78, relatedClients: [clients[2], clients[12], clients[22]], createdAt: "2026-07-10T16:00:00Z" },
  { id: "ai4", title: "Cross-Sell Cluster Identified", content: "4 clients in the Finance sector currently lack cybersecurity services but show infrastructure maturity suggesting readiness. Estimated combined revenue opportunity: $2.4M.", category: "opportunity", confidence: 85, relatedClients: [clients[4], clients[14], clients[24], clients[34]], createdAt: "2026-07-10T14:00:00Z" },
  { id: "ai5", title: "Manager Workload Imbalance", content: "Sarah Chen is managing 8 enterprise accounts with 3 showing warning signs. Consider redistributing 1-2 accounts to prevent service quality degradation.", category: "observation", confidence: 91, relatedClients: [clients[0], clients[10], clients[20]], createdAt: "2026-07-10T10:00:00Z" },
  { id: "ai6", title: "Contract Renewal Risk", content: "5 contracts expiring within 90 days belong to clients with health scores below 65. These accounts require immediate executive engagement to ensure renewal.", category: "risk", confidence: 87, relatedClients: [clients[3], clients[8], clients[13]], createdAt: "2026-07-09T15:00:00Z" },
];

// KPI summary data
export const kpiSummary = {
  totalClients: clients.length,
  healthyAccounts: clients.filter(c => c.healthStatus === "healthy").length,
  riskAccounts: clients.filter(c => c.healthStatus === "at_risk" || c.healthStatus === "critical").length,
  openTasks: tasks.filter(t => t.status !== "done").length,
  totalRevenue: clients.reduce((sum, c) => sum + c.revenue, 0),
  avgHealthScore: Math.round(clients.reduce((sum, c) => sum + c.healthScore, 0) / clients.length),
  upsellOpportunities: opportunities.filter(o => o.type === "upsell").length,
  crossSellOpportunities: opportunities.filter(o => o.type === "cross_sell").length,
};

// Health trend data for charts
export const healthTrendData = {
  weekly: [
    { period: "W1", healthy: 22, warning: 12, atRisk: 10, critical: 6 },
    { period: "W2", healthy: 24, warning: 11, atRisk: 9, critical: 6 },
    { period: "W3", healthy: 21, warning: 14, atRisk: 10, critical: 5 },
    { period: "W4", healthy: 23, warning: 12, atRisk: 11, critical: 4 },
  ],
  monthly: [
    { period: "Jan", healthy: 20, warning: 13, atRisk: 11, critical: 6 },
    { period: "Feb", healthy: 22, warning: 12, atRisk: 10, critical: 6 },
    { period: "Mar", healthy: 21, warning: 14, atRisk: 9, critical: 6 },
    { period: "Apr", healthy: 23, warning: 12, atRisk: 10, critical: 5 },
    { period: "May", healthy: 24, warning: 11, atRisk: 10, critical: 5 },
    { period: "Jun", healthy: 22, warning: 13, atRisk: 9, critical: 6 },
    { period: "Jul", healthy: 23, warning: 12, atRisk: 10, critical: 5 },
  ],
  quarterly: [
    { period: "Q1", healthy: 21, warning: 13, atRisk: 10, critical: 6 },
    { period: "Q2", healthy: 23, warning: 12, atRisk: 10, critical: 5 },
    { period: "Q3", healthy: 22, warning: 12, atRisk: 11, critical: 5 },
    { period: "Q4", healthy: 24, warning: 11, atRisk: 10, critical: 5 },
  ],
  yearly: [
    { period: "2023", healthy: 18, warning: 14, atRisk: 12, critical: 6 },
    { period: "2024", healthy: 20, warning: 13, atRisk: 11, critical: 6 },
    { period: "2025", healthy: 22, warning: 12, atRisk: 10, critical: 6 },
    { period: "2026", healthy: 23, warning: 12, atRisk: 10, critical: 5 },
  ],
};

export const healthDistribution = [
  { name: "Healthy", value: clients.filter(c => c.healthStatus === "healthy").length, color: "#10b981" },
  { name: "Warning", value: clients.filter(c => c.healthStatus === "warning").length, color: "#f59e0b" },
  { name: "At Risk", value: clients.filter(c => c.healthStatus === "at_risk").length, color: "#ef4444" },
  { name: "Critical", value: clients.filter(c => c.healthStatus === "critical").length, color: "#dc2626" },
];
