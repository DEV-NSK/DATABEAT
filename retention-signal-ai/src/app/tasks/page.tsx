"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { tasks } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List, Calendar, Flag, Plus, MoreHorizontal, Sparkles } from "lucide-react";
import type { TaskStatus } from "@/lib/types";

const statusConfig: Record<TaskStatus | "backlog", { label: string; color: string; column: string }> = {
  backlog: { label: "Backlog", color: "bg-muted/50 text-muted-foreground", column: "bg-muted/20" },
  todo: { label: "To Do", color: "bg-muted text-muted-foreground", column: "bg-muted/30" },
  in_progress: { label: "In Progress", color: "bg-primary/10 text-primary", column: "bg-primary/5" },
  done: { label: "Done", color: "bg-success/10 text-success", column: "bg-success/5" },
  blocked: { label: "Blocked", color: "bg-destructive/10 text-destructive", column: "bg-destructive/5" },
};

const priorityColors = {
  high: "text-destructive",
  medium: "text-warning",
  low: "text-muted-foreground",
};

export default function TasksPage() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const columns: (TaskStatus | "backlog")[] = ["backlog", "todo", "in_progress", "done", "blocked"];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Work Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tasks.length} tasks · {tasks.filter(t => t.status === "done").length} completed</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <button onClick={() => setView("kanban")} className={`p-1.5 rounded-md ${view === "kanban" ? "bg-background shadow-sm" : ""}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setView("table")} className={`p-1.5 rounded-md ${view === "table" ? "bg-background shadow-sm" : ""}`}><List className="w-4 h-4" /></button>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1"><Plus className="w-3.5 h-3.5" />New Task</Button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {columns.map((status) => {
            const config = statusConfig[status];
            const statusTasks = status === "backlog"
              ? tasks.filter(t => t.status === "todo").slice(8, 16)
              : tasks.filter(t => t.status === status).slice(0, 8);
            return (
              <div key={status} className={`rounded-xl p-3 ${config.column}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{config.label}</h3>
                    <Badge variant="outline" className="text-[10px]">{statusTasks.length}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="w-3 h-3" /></Button>
                </div>
                <div className="space-y-2">
                  {statusTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className={`text-[10px] ${statusConfig[task.status].color}`}>{task.category}</Badge>
                          <Flag className={`w-3 h-3 ${priorityColors[task.priority]}`} />
                        </div>
                        <p className="text-xs font-medium mb-2 line-clamp-2">{task.title}</p>
                        {parseInt(task.id.slice(1)) % 3 !== 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-[9px] text-primary font-medium">AI Generated</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Avatar className="w-5 h-5"><AvatarFallback className="text-[8px] bg-muted">{task.assignee.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                            <span className="text-[10px] text-muted-foreground">{task.assignee.name.split(" ")[0]}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {task.dueDate.slice(5)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Task</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Priority</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Assignee</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Client</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Due Date</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Category</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.slice(0, 20).map((task) => (
                <TableRow key={task.id} className="hover:bg-muted/50">
                  <TableCell className="text-sm font-medium max-w-[200px] truncate">{task.title}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${statusConfig[task.status].color}`}>{statusConfig[task.status].label}</Badge></TableCell>
                  <TableCell><div className="flex items-center gap-1"><Flag className={`w-3 h-3 ${priorityColors[task.priority]}`} /><span className="text-xs capitalize">{task.priority}</span></div></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{task.assignee.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{task.client?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{task.dueDate}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{task.category}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
