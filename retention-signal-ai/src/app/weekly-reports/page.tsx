"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { weeklyReports, clients, managers } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, FileText, MoreHorizontal, Plus, X, CheckCircle, Sparkles } from "lucide-react";

const statusColors = {
  submitted: "bg-primary/10 text-primary",
  reviewed: "bg-success/10 text-success",
  escalated: "bg-destructive/10 text-destructive",
};

const steps = [
  { id: 1, label: "General" },
  { id: 2, label: "Delivery" },
  { id: 3, label: "Relationship" },
  { id: 4, label: "Summary" },
];

export default function WeeklyReportsPage() {
  const [page, setPage] = useState(1);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardSubmitted, setWizardSubmitted] = useState(false);

  // Wizard state
  const [wizClient, setWizClient] = useState("");
  const [wizWeek, setWizWeek] = useState("");
  const [wizManager, setWizManager] = useState("");
  const [wizDelivery, setWizDelivery] = useState(70);
  const [wizReqFulfillment, setWizReqFulfillment] = useState(7);
  const [wizSLAMiss, setWizSLAMiss] = useState(false);
  const [wizEscalation, setWizEscalation] = useState(false);
  const [wizRework, setWizRework] = useState(false);
  const [wizScopeCreep, setWizScopeCreep] = useState(false);
  const [wizDelay, setWizDelay] = useState(false);
  const [wizDeliveryComments, setWizDeliveryComments] = useState("");
  const [wizCommunication, setWizCommunication] = useState(8);
  const [wizStakeholderAlignment, setWizStakeholderAlignment] = useState(7);
  const [wizMeetings, setWizMeetings] = useState(3);
  const [wizRelationshipComments, setWizRelationshipComments] = useState("");

  const pageSize = 12;
  const totalPages = Math.ceil(weeklyReports.length / pageSize);
  const reports = weeklyReports.slice((page - 1) * pageSize, page * pageSize);

  const handleWizardSubmit = () => {
    setWizardSubmitted(true);
    setTimeout(() => {
      setShowWizard(false);
      setWizardSubmitted(false);
      setWizardStep(1);
    }, 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Weekly Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{weeklyReports.length} reports across all accounts</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setShowWizard(true)}>
          <Plus className="w-3.5 h-3.5" /> New Report
        </Button>
      </div>

      {/* Report List */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground">Report</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Client</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Week</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Health</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Submitted By</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id} className="hover:bg-muted/50 cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">WR-{String(report.weekNumber).padStart(3, "0")}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs">{report.client.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">Week {report.weekNumber}, {report.year}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-10 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${report.healthScore >= 70 ? "bg-success" : report.healthScore >= 50 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${report.healthScore}%` }} />
                    </div>
                    <span className="text-xs font-medium">{report.healthScore}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{report.submittedBy.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${statusColors[report.status]}`}>{report.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{report.submittedAt}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, weeklyReports.length)} of {weeklyReports.length}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </Card>

      {/* Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => !wizardSubmitted && setShowWizard(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Wizard Header */}
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
                <div>
                  <h2 className="text-base font-semibold">New Weekly Report</h2>
                  <p className="text-xs text-muted-foreground">Step {wizardStep} of {steps.length}: {steps[wizardStep - 1].label}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowWizard(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="px-6 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  {steps.map((step, i) => (
                    <div key={step.id} className="flex-1">
                      <div className={`h-1.5 rounded-full ${i < wizardStep ? "bg-primary" : "bg-muted"}`} />
                    </div>
                  ))}
                </div>
                <Progress value={(wizardStep / steps.length) * 100} className="h-0 hidden" />
              </div>

              {/* Success Screen */}
              {wizardSubmitted ? (
                <div className="py-16 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">Report Submitted!</h3>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <p className="text-sm">AI is processing your report...</p>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-5">
                  {/* Step 1: General */}
                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Client</Label>
                        <Select value={wizClient} onValueChange={(v) => v && setWizClient(v)}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select client" /></SelectTrigger>
                          <SelectContent>
                            {clients.slice(0, 20).map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Week Number</Label>
                          <Input type="number" value={wizWeek} onChange={e => setWizWeek(e.target.value)} placeholder="28" className="h-9 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Project Manager</Label>
                          <Select value={wizManager} onValueChange={(v) => v && setWizManager(v)}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select manager" /></SelectTrigger>
                            <SelectContent>
                              {managers.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Delivery */}
                  {wizardStep === 2 && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Delivery Score</Label>
                          <span className="text-sm font-semibold">{wizDelivery}%</span>
                        </div>
                        <input type="range" min={0} max={100} value={wizDelivery} onChange={e => setWizDelivery(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Requirement Fulfillment (0-10)</Label>
                          <span className="text-sm font-semibold">{wizReqFulfillment}/10</span>
                        </div>
                        <input type="range" min={0} max={10} value={wizReqFulfillment} onChange={e => setWizReqFulfillment(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { label: "SLA Miss", state: wizSLAMiss, set: setWizSLAMiss },
                          { label: "Escalation", state: wizEscalation, set: setWizEscalation },
                          { label: "Rework", state: wizRework, set: setWizRework },
                          { label: "Scope Creep", state: wizScopeCreep, set: setWizScopeCreep },
                          { label: "Delay", state: wizDelay, set: setWizDelay },
                        ].map(item => (
                          <button
                            key={item.label}
                            onClick={() => item.set(!item.state)}
                            className={`p-2 rounded-lg text-[10px] font-medium border transition-colors ${
                              item.state ? "border-destructive bg-destructive/10 text-destructive" : "border-border hover:bg-muted"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Comments</Label>
                        <Textarea value={wizDeliveryComments} onChange={e => setWizDeliveryComments(e.target.value)} placeholder="Delivery notes..." className="text-sm min-h-[80px]" />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Relationship */}
                  {wizardStep === 3 && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Communication Quality (0-10)</Label>
                          <span className="text-sm font-semibold">{wizCommunication}/10</span>
                        </div>
                        <input type="range" min={0} max={10} value={wizCommunication} onChange={e => setWizCommunication(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Stakeholder Alignment (0-10)</Label>
                          <span className="text-sm font-semibold">{wizStakeholderAlignment}/10</span>
                        </div>
                        <input type="range" min={0} max={10} value={wizStakeholderAlignment} onChange={e => setWizStakeholderAlignment(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Meetings This Week</Label>
                        <Input type="number" value={wizMeetings} onChange={e => setWizMeetings(Number(e.target.value))} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Comments</Label>
                        <Textarea value={wizRelationshipComments} onChange={e => setWizRelationshipComments(e.target.value)} placeholder="Relationship notes..." className="text-sm min-h-[80px]" />
                      </div>
                    </div>
                  )}

                  {/* Step 4: Summary */}
                  {wizardStep === 4 && (
                    <div className="space-y-4">
                      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                        <h3 className="text-sm font-semibold">Report Summary</h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{clients.find(c => c.id === wizClient)?.name || "Not selected"}</span></div>
                          <div><span className="text-muted-foreground">Week:</span> <span className="font-medium">{wizWeek || "Not set"}</span></div>
                          <div><span className="text-muted-foreground">Delivery Score:</span> <span className="font-medium">{wizDelivery}%</span></div>
                          <div><span className="text-muted-foreground">Req. Fulfillment:</span> <span className="font-medium">{wizReqFulfillment}/10</span></div>
                          <div><span className="text-muted-foreground">Communication:</span> <span className="font-medium">{wizCommunication}/10</span></div>
                          <div><span className="text-muted-foreground">Stakeholder Alignment:</span> <span className="font-medium">{wizStakeholderAlignment}/10</span></div>
                          <div><span className="text-muted-foreground">Meetings:</span> <span className="font-medium">{wizMeetings}</span></div>
                          <div>
                            <span className="text-muted-foreground">Flags:</span>{" "}
                            {[wizSLAMiss && "SLA Miss", wizEscalation && "Escalation", wizRework && "Rework", wizScopeCreep && "Scope Creep", wizDelay && "Delay"].filter(Boolean).join(", ") || "None"}
                          </div>
                        </div>
                      </div>
                      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <p className="text-xs font-semibold text-primary">AI Prediction</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Based on the data provided, AI predicts this account will maintain a stable health score over the next 4 weeks. No immediate risk factors detected.</p>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setWizardStep(s => Math.max(1, s - 1))}
                      disabled={wizardStep === 1}
                    >
                      Previous
                    </Button>
                    {wizardStep < 4 ? (
                      <Button size="sm" className="text-xs" onClick={() => setWizardStep(s => Math.min(4, s + 1))}>
                        Next Step
                      </Button>
                    ) : (
                      <Button size="sm" className="text-xs gap-1.5" onClick={handleWizardSubmit}>
                        <CheckCircle className="w-3.5 h-3.5" /> Submit Report
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
