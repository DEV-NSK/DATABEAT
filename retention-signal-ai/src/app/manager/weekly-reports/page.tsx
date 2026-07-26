"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FileText, RefreshCw, Calendar, CheckCircle2, AlertCircle, Clock, Building2, User } from "lucide-react";

// PRD §13: Weekly Reports — /manager/weekly-reports
// Manager can VIEW reports submitted by Team Leads under them
// Manager CANNOT submit or modify reports

interface ReportRow {
  id: string;
  user_id: string;
  client_name: string;
  week: string;
  created_at: string;
  manager: string;
  sla_miss: boolean;
  escalation: boolean;
  rework: number;
  scope_creep: boolean;
  requirement_fulfillment: number;
  relationship_feedback: string;
  delivery_comments: string;
}

interface TeamLeadOption { id: string; full_name: string; }

type StatusFilter = "all" | "completed" | "processing" | "failed";

function getReportStatus(row: ReportRow): { label: string; cls: string; icon: typeof CheckCircle2 } {
  // In this system all stored rows are completed processing
  if (row.escalation && row.sla_miss) {
    return { label: "Failed", cls: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle };
  }
  if (row.escalation || row.sla_miss) {
    return { label: "Processing", cls: "bg-warning/10 text-warning border-warning/20", icon: Clock };
  }
  return { label: "Completed", cls: "bg-success/10 text-success border-success/20", icon: CheckCircle2 };
}

export default function ManagerWeeklyReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [teamLeads, setTeamLeads] = useState<TeamLeadOption[]>([]);
  const [teamLeadMap, setTeamLeadMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTL, setFilterTL] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: tls } = await supabase.from("profiles").select("id, full_name").eq("manager_id", user.id).eq("role", "team_lead");
      const leads = (tls ?? []) as TeamLeadOption[];
      setTeamLeads(leads);
      const tlMap = new Map<string, string>();
      leads.forEach((l) => tlMap.set(l.id, l.full_name));
      setTeamLeadMap(tlMap);

      if (leads.length === 0) { setReports([]); setLoading(false); return; }
      const leadIds = leads.map((l) => l.id);

      const { data, error: dbErr } = await supabase
        .from("weekly_reports")
        .select("*")
        .in("user_id", leadIds)
        .order("created_at", { ascending: false });
      if (dbErr) throw dbErr;
      setReports((data ?? []) as ReportRow[]);
    } catch (e) { console.error(e); setError("Unable to load weekly reports. Please try again."); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("mgr-reports-list-rt").on("postgres_changes", { event: "INSERT", schema: "public", table: "weekly_reports" }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchData]);

  const filtered = reports.filter((r) => {
    const matchTL = filterTL === "all" || r.user_id === filterTL;
    const status = getReportStatus(r).label.toLowerCase();
    const matchStatus: boolean = filterStatus === "all" ||
      (filterStatus === "completed" && status === "completed") ||
      (filterStatus === "processing" && status === "processing") ||
      (filterStatus === "failed" && status === "failed");
    return matchTL && matchStatus;
  });

  if (error) return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold">Weekly Reports</h1></div>
      <ErrorState title="Unable to load weekly reports" description={error} onRetry={fetchData} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Weekly Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review reports submitted by your Team Leads. View-only — you cannot submit or modify reports.
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* PRD §13: Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status filter */}
        <div className="flex items-center gap-1">
          {(["all", "completed", "processing", "failed"] as const).map((f) => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterStatus === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Team Lead filter */}
        {teamLeads.length > 1 && (
          <Select value={filterTL} onValueChange={(v: string | null) => setFilterTL(v ?? "all")}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue placeholder="All Team Leads" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team Leads</SelectItem>
              {teamLeads.map((tl) => <SelectItem key={tl.id} value={tl.id}>{tl.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* PRD §13 Report List */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-0">
          <EmptyState
            icon="file"
            title={reports.length === 0 ? "No reports yet" : "No matching reports"}
            description={reports.length === 0 ? "Reports will appear here when your Team Leads submit them." : "Try adjusting the filters."}
          />
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {["Team Lead", "Client", "Week", "Status", "Details"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((report) => {
                    const status = getReportStatus(report);
                    const StatusIcon = status.icon;
                    const tlName = teamLeadMap.get(report.user_id) || "—";
                    const isExpanded = expanded === report.id;
                    return (
                      <>
                        <tr
                          key={report.id}
                          className="hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => setExpanded(isExpanded ? null : report.id)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                <User className="w-3 h-3 text-primary" />
                              </div>
                              <span className="font-medium text-foreground">{tlName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground">{report.client_name || "—"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{report.week || new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={`text-[9px] flex items-center gap-1 w-fit ${status.cls}`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary">
                              {isExpanded ? "Hide" : "View"}
                            </Button>
                          </td>
                        </tr>
                        {/* PRD §13 Manager can VIEW: Report details, processing status, health analysis, AI recommendations */}
                        {isExpanded && (
                          <tr key={`${report.id}-details`}>
                            <td colSpan={5} className="px-4 py-4 bg-muted/20">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <DetailItem label="SLA Miss" value={report.sla_miss ? "Yes" : "No"} highlight={report.sla_miss} />
                                <DetailItem label="Escalation" value={report.escalation ? "Yes" : "No"} highlight={report.escalation} />
                                <DetailItem label="Scope Creep" value={report.scope_creep ? "Yes" : "No"} highlight={report.scope_creep} />
                                <DetailItem label="Rework" value={String(report.rework ?? 0)} />
                                <DetailItem label="Requirement Fulfillment" value={`${report.requirement_fulfillment ?? 0}%`} />
                                <DetailItem label="Client Sentiment" value={report.relationship_feedback || "—"} />
                                {report.delivery_comments && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Delivery Comments</p>
                                    <p className="text-xs text-foreground">{report.delivery_comments}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-2 bg-card rounded-lg border border-border">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-xs font-medium ${highlight ? "text-destructive" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
