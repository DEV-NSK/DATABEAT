"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { clients, tasks, recommendations } from "@/lib/mock-data";
import Link from "next/link";

interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
  content: { type: string; id: string } | null;
}

export function RightDrawer({ open, onClose, content }: RightDrawerProps) {
  const renderContent = () => {
    if (!content) return null;

    if (content.type === "client") {
      const client = clients.find(c => c.id === content.id);
      if (!client) return <p className="text-sm text-muted-foreground p-4">Client not found</p>;
      return (
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{client.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-semibold">{client.name}</h3>
              <p className="text-xs text-muted-foreground">{client.industry} · {client.region}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground">Health Score</p>
              <p className="text-lg font-bold">{client.healthScore}</p>
              <Progress value={client.healthScore} className="h-1.5 mt-1" />
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground">Revenue</p>
              <p className="text-lg font-bold">${(client.revenue / 1000).toFixed(0)}K</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {client.services.map(s => (
                <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Manager</p>
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6"><AvatarFallback className="text-[9px] bg-muted">{client.manager.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
              <div>
                <p className="text-xs font-medium">{client.manager.name}</p>
                <p className="text-[10px] text-muted-foreground">{client.manager.role}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Contract</p>
            <p className="text-xs">{client.contractStart} → {client.contractEnd}</p>
          </div>
          <Link href={`/clients/${client.id}`}>
            <Button size="sm" className="w-full text-xs gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              Open Full Details
            </Button>
          </Link>
        </div>
      );
    }

    if (content.type === "task") {
      const task = tasks.find(t => t.id === content.id);
      if (!task) return <p className="text-sm text-muted-foreground p-4">Task not found</p>;
      return (
        <div className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">{task.title}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{task.status.replace("_", " ")}</Badge>
            <Badge variant="outline" className={`text-[10px] ${task.priority === "high" ? "text-destructive" : ""}`}>{task.priority}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{task.description}</p>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Assignee: {task.assignee.name}</p>
            <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>
            <p className="text-xs text-muted-foreground">Client: {task.client?.name}</p>
          </div>
        </div>
      );
    }

    if (content.type === "recommendation") {
      const rec = recommendations.find(r => r.id === content.id);
      if (!rec) return <p className="text-sm text-muted-foreground p-4">Recommendation not found</p>;
      return (
        <div className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">{rec.title}</h3>
          <Badge variant="outline" className="text-[10px]">{rec.type.replace("_", " ")}</Badge>
          <p className="text-xs text-muted-foreground">{rec.reason}</p>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <Progress value={rec.confidence} className="h-1.5 flex-1" />
              <span className="text-xs font-semibold">{rec.confidence}%</span>
            </div>
          </div>
          <p className="text-xs"><span className="text-muted-foreground">Next Action:</span> {rec.nextAction}</p>
          <Link href="/ai-recommendations">
            <Button size="sm" className="w-full text-xs gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              View in AI Center
            </Button>
          </Link>
        </div>
      );
    }

    return null;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-[400px] bg-card border-l border-border z-50 shadow-xl overflow-y-auto"
          >
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
              <p className="text-sm font-medium">Quick Preview</p>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            {renderContent()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
