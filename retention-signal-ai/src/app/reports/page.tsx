"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { managers } from "@/lib/mock-data";
import { FileText, Download, BarChart3, PieChart, Users, TrendingUp, Calendar, Printer } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

const reportTemplates = [
  { id: "r1", title: "Account Health Summary", description: "Overview of all account health scores and trends", icon: BarChart3, category: "Health", lastGenerated: "2026-07-10" },
  { id: "r2", title: "Revenue & Pipeline Report", description: "Pipeline value, upsell and cross-sell opportunities", icon: TrendingUp, category: "Revenue", lastGenerated: "2026-07-09" },
  { id: "r3", title: "Manager Performance Report", description: "Account distribution and performance by manager", icon: Users, category: "Performance", lastGenerated: "2026-07-08" },
  { id: "r4", title: "Churn Risk Analysis", description: "Detailed risk assessment across all accounts", icon: PieChart, category: "Risk", lastGenerated: "2026-07-07" },
  { id: "r5", title: "Weekly Activity Summary", description: "Summary of all activities and tasks completed", icon: FileText, category: "Activity", lastGenerated: "2026-07-11" },
  { id: "r6", title: "Contract Renewal Forecast", description: "Upcoming renewals and revenue at risk", icon: Calendar, category: "Contracts", lastGenerated: "2026-07-06" },
];

const periods = ["Weekly", "Monthly", "Quarterly", "Yearly"];

const generatedReports = Array.from({ length: 12 }, (_, i) => ({
  id: `gr${i}`,
  title: `${reportTemplates[i % 6].title} - Week ${28 - i}`,
  template: reportTemplates[i % 6].title,
  generatedAt: `2026-07-${String(11 - i).padStart(2, "0")}`,
  generatedBy: managers[i % managers.length].name,
  status: i < 3 ? "ready" : "archived",
}));

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Generate, download, and print reports</p>
        </div>
        <div className="flex items-center gap-2">
          {periods.map(p => (
            <button key={p} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors first:bg-primary first:text-primary-foreground">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="hover:shadow-sm transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-0.5">{template.title}</p>
                      <p className="text-[10px] text-muted-foreground mb-2">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">{template.category}</Badge>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1">
                            <Download className="w-3 h-3" /> Generate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Generated Reports */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Generated Reports</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {generatedReports.length === 0 ? (
                <EmptyState icon="file" title="No reports generated" description="Generate a report from a template above to see it here." />
              ) : generatedReports.map((report) => (
                <div key={report.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{report.title}</p>
                    <p className="text-[10px] text-muted-foreground">Generated by {report.generatedBy} on {report.generatedAt}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${report.status === "ready" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {report.status}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
