"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, CheckSquare, Clock, AlertCircle, Flag, Calendar, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

type Priority = "high" | "medium" | "low";
type Status = "todo" | "in_progress" | "completed" | "blocked";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  category?: string;
  due_date?: string;
  is_ai_generated?: boolean;
  client_name?: string;
  user_id?: string;
  created_at: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  todo: { label: "To Do", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", color: "bg-primary/10 text-primary" },
  completed: { label: "Completed", color: "bg-success/10 text-success" },
  blocked: { label: "Blocked", color: "bg-destructive/10 text-destructive" },
};

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "text-destructive",
  medium: "text-warning",
  low: "text-muted-foreground",
};

export default function TasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Try fetching from a tasks table scoped to user_id
      // Falls back gracefully if table doesn't exist
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        // Table may not exist yet — show empty state
        console.warn("Tasks table not found or query error:", error.message);
        setTasks([]);
      } else {
        setTasks((data ?? []) as Task[]);
      }
    } catch (e) {
      console.error(e);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("tasks-rt")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `user_id=eq.${user.id}`,
      }, () => fetchTasks())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchTasks]);

  const updateTaskStatus = async (id: string, newStatus: Status) => {
    // Optimistic update
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, status: newStatus } : t));
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update task status");
      fetchTasks(); // revert
    }
  };

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount = tasks.filter((t) => t.status === "completed").length;
  const blockedCount = tasks.filter((t) => t.status === "blocked").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${tasks.length} task${tasks.length !== 1 ? "s" : ""} · ${doneCount} completed`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={fetchTasks}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "To Do", count: todoCount, color: "text-muted-foreground" },
          { label: "In Progress", count: inProgressCount, color: "text-primary" },
          { label: "Completed", count: doneCount, color: "text-success" },
          { label: "Blocked", count: blockedCount, color: "text-destructive" },
        ].map(({ label, count, color }) => (
          <Card
            key={label}
            className="cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => setFilter(label.toLowerCase().replace(" ", "_") as Status | "all")}
          >
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${color}`}>{loading ? "—" : count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 flex-wrap">
        {(["all", "todo", "in_progress", "completed", "blocked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon="check"
              title={filter === "all" ? "No tasks yet" : `No ${filter.replace("_", " ")} tasks`}
              description={
                filter === "all"
                  ? "Tasks generated by AI or created manually will appear here."
                  : "No tasks match this status."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const st = STATUS_CONFIG[task.status] ?? STATUS_CONFIG["todo"];
            return (
              <Card key={task.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Status checkbox */}
                    <button
                      onClick={() =>
                        task.status !== "completed" && updateTaskStatus(task.id, "completed")
                      }
                      className={`w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        task.status === "completed"
                          ? "bg-success border-success"
                          : "border-muted-foreground/30 hover:border-primary"
                      }`}
                      title={task.status === "completed" ? "Completed" : "Mark complete"}
                    >
                      {task.status === "completed" && (
                        <CheckSquare className="w-3 h-3 text-white" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p
                          className={`text-sm font-medium ${
                            task.status === "completed"
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.is_ai_generated && (
                          <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                            <Sparkles className="w-3 h-3" /> AI
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[9px] ${st.color}`}>
                          {st.label}
                        </Badge>
                        {task.category && (
                          <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground">
                            {task.category}
                          </Badge>
                        )}
                        {task.client_name && (
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-primary/5 text-primary border-primary/20 cursor-pointer"
                            onClick={() => router.push("/clients")}
                          >
                            {task.client_name}
                          </Badge>
                        )}
                        {task.due_date && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            Due {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        {task.priority && (
                          <Flag className={`w-3 h-3 ${PRIORITY_COLORS[task.priority] ?? "text-muted-foreground"}`} />
                        )}
                      </div>
                    </div>

                    {task.status === "blocked" && (
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    {task.status === "in_progress" && (
                      <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
