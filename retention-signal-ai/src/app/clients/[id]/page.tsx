"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { clients, weeklyReports, tasks, recommendations, activities } from "@/lib/mock-data";
import {
  ArrowLeft, Edit, FileText, CheckSquare, TrendingUp,
  MessageSquare, Lightbulb,
  DollarSign, Users, MapPin, Building2
} from "lucide-react";
import { HealthGauge } from "@/components/shared/health-gauge";
import { SignalTimeline, type SignalEvent } from "@/components/shared/signal-timeline";
import { EmptyState } from "@/components/shared/empty-state";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";

const CURRENT_TIME = new Date("2026-07-11T12:00:00Z").getTime();

const tabs = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "weekly-reports", label: "Weekly Reports", icon: FileText },
  { id: "health-timeline", label: "Health Timeline", icon: TrendingUp },
  { id: "ai-insights", label: "AI Insights", icon: Lightbulb },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "recommendations", label: "Recommendations", icon: MessageSquare },
  { id: "notes", label: "Notes", icon: MessageSquare },
];

const healthColors = {
  healthy: "text-success",
  warning: "text-warning",
  at_risk: "text-destructive",
  critical: "text-destructive",
};

const signals: SignalEvent[] = [
  { signalType: "SLA Miss", source: "internal", description: "Response time exceeded 4-hour SLA threshold", timestamp: "2026-06-15", severity: "warning" },
  { signalType: "Slow Reply", source: "external", description: "Average client reply time increased to 48 hours", timestamp: "2026-06-22", severity: "info" },
  { signalType: "Escalation", source: "external", description: "Formal escalation regarding project delays", timestamp: "2026-07-01", severity: "critical" },
  { signalType: "Leadership Change", source: "external", description: "Client VP of Engineering replaced", timestamp: "2026-07-05", severity: "warning" },
  { signalType: "Budget Pressure", source: "ai", description: "AI detected budget constraints affecting project scope", timestamp: "2026-07-08", severity: "critical" },
];

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const client = clients.find(c => c.id === params.id);
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <EmptyState
          icon="users"
          title="Client not found"
          description="The client you are looking for does not exist or may have been removed."
          action={{ label: "Back to Accounts", onClick: () => router.push("/clients") }}
        />
      </div>
    );
  }

  const clientReports = weeklyReports.filter(r => r.clientId === client.id).slice(0, 10);
  const clientTasks = tasks.filter(t => t.client?.id === client.id).slice(0, 10);
  const clientRecs = recommendations.filter(r => r.clientId === client.id).slice(0, 8);
  const clientActivities = activities.filter(a => a.client?.id === client.id).slice(0, 10);

  const trendData = client.trend.map((val, i) => ({
    month: `M${i + 1}`,
    score: Math.round(val),
  }));

  const daysLeft = Math.floor((new Date(client.contractEnd).getTime() - CURRENT_TIME) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2" onClick={() => router.push("/clients")}>
        <ArrowLeft className="w-4 h-4" /> Back to Accounts
      </Button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Company info */}
              <div className="flex items-start gap-4 flex-1">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                    {client.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-bold text-foreground">{client.name}</h1>
                    <Badge variant="outline" className={`text-xs ${healthColors[client.healthStatus]}`}>
                      {client.healthStatus.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{client.industry}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${(client.revenue / 1000).toFixed(0)}K Revenue</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{client.employeeCount.toLocaleString()} employees</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{client.region}</span>
                  </div>
                </div>
              </div>

              {/* Health gauge */}
              <div className="flex items-center gap-4 shrink-0">
                <HealthGauge
                  score={client.healthScore}
                  size="md"
                  showTrend
                  trend={client.trend[client.trend.length - 1] - client.trend[client.trend.length - 3]}
                  showRecommendation
                />
                <div className="space-y-1.5">
                  <Button size="sm" className="w-full text-xs gap-1.5"><Edit className="w-3.5 h-3.5" /> Edit</Button>
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5"><FileText className="w-3.5 h-3.5" /> Generate Report</Button>
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5"><CheckSquare className="w-3.5 h-3.5" /> Assign Task</Button>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground">Contract</p>
                <p className="text-xs font-medium">{client.contractStart} → {client.contractEnd}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{daysLeft} days remaining</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground">Account Manager</p>
                <p className="text-xs font-medium">{client.manager.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{client.manager.role}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground">Services</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {client.services.slice(0, 2).map(s => <Badge key={s} variant="outline" className="text-[9px]">{s}</Badge>)}
                  {client.services.length > 2 && <Badge variant="outline" className="text-[9px]">+{client.services.length - 2}</Badge>}
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground">Contact</p>
                <p className="text-xs font-medium">{client.contactPerson}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{client.contactEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Health Trend (12 months)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                      <Area type="monotone" dataKey="score" stroke="#2563eb" fill="url(#healthGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clientActivities.slice(0, 6).map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "weekly-reports" && (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {clientReports.length === 0 ? (
                  <EmptyState icon="file" title="No reports yet" description="Weekly reports will appear here once submitted." />
                ) : clientReports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Week {r.weekNumber} Report</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{r.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                      <span className="text-xs font-medium">Score: {r.healthScore}</span>
                      <span className="text-[10px] text-muted-foreground">{r.submittedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "health-timeline" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Health Score Timeline</CardTitle>
                  <div className="flex items-center gap-1">
                    {["6M", "12M", "Custom"].map((f) => (
                      <button key={f} className="px-2.5 py-1 text-[10px] font-medium rounded-md bg-muted hover:bg-muted/80">{f}</button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                      <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: "#2563eb", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Signal Timeline</CardTitle></CardHeader>
              <CardContent>
                <SignalTimeline events={signals} />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "ai-insights" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientRecs.length === 0 ? (
              <Card className="col-span-2">
                <CardContent>
                  <EmptyState icon="sparkles" title="No AI insights yet" description="AI analysis will generate insights for this account." />
                </CardContent>
              </Card>
            ) : clientRecs.map((rec) => (
              <Card key={rec.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-[10px]">{rec.type.replace("_", " ")}</Badge>
                    <span className="text-[10px] text-muted-foreground">{rec.confidence}% confidence</span>
                  </div>
                  <p className="text-sm font-medium mb-1">{rec.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{rec.reason}</p>
                  <div className="bg-muted/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-muted-foreground">Next Action</p>
                    <p className="text-xs font-medium">{rec.nextAction}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "tasks" && (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {clientTasks.length === 0 ? (
                  <EmptyState icon="check" title="No tasks assigned" description="Tasks for this account will appear here." />
                ) : clientTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      task.status === "done" ? "bg-success" : task.status === "in_progress" ? "bg-primary" : task.status === "blocked" ? "bg-destructive" : "bg-muted-foreground"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">{task.assignee.name} · {task.category}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{task.priority}</Badge>
                    <span className="text-[10px] text-muted-foreground shrink-0">Due: {task.dueDate}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "recommendations" && (
          <div className="space-y-3">
            {clientRecs.length === 0 ? (
              <Card>
                <CardContent>
                  <EmptyState icon="inbox" title="No recommendations" description="AI recommendations will be generated here." />
                </CardContent>
              </Card>
            ) : clientRecs.map((rec) => (
              <Card key={rec.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{rec.type.replace("_", " ")}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${rec.status === "new" ? "bg-primary/10 text-primary" : ""}`}>{rec.status}</Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(rec.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium mb-1">{rec.title}</p>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Progress value={rec.confidence} className="h-1.5 w-24" />
                      <span className="text-[10px] text-muted-foreground">{rec.confidence}%</span>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-[10px]">Take Action</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "notes" && (
          <Card>
            <CardContent>
              <EmptyState
                icon="inbox"
                title="No notes yet"
                description="Add notes about this account for your team."
                action={{ label: "Add Note", onClick: () => {} }}
              />
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
