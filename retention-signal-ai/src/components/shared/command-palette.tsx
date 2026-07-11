"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Heart, TrendingUp,
  Shuffle, CheckSquare, BarChart3, Bell, Settings, ArrowRight,
  Sparkles, Command
} from "lucide-react";
import { clients, tasks, recommendations } from "@/lib/mock-data";

interface SearchResult {
  id: string;
  type: "page" | "client" | "task" | "recommendation" | "setting";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const pages: SearchResult[] = [
  { id: "p1", type: "page", title: "Command Center", description: "Executive AI dashboard", icon: LayoutDashboard, href: "/" },
  { id: "p2", type: "page", title: "Accounts", description: "Manage all client accounts", icon: Users, href: "/clients" },
  { id: "p3", type: "page", title: "Weekly Reports", description: "Submit and review reports", icon: FileText, href: "/weekly-reports" },
  { id: "p4", type: "page", title: "Health Intelligence", description: "Account health analytics", icon: Heart, href: "/account-health" },
  { id: "p5", type: "page", title: "Upsell Center", description: "Revenue expansion pipeline", icon: TrendingUp, href: "/upsell" },
  { id: "p6", type: "page", title: "Cross-Sell Center", description: "Service expansion opportunities", icon: Shuffle, href: "/cross-sell" },
  { id: "p7", type: "page", title: "Work Queue", description: "Tasks and assignments", icon: CheckSquare, href: "/tasks" },
  { id: "p8", type: "page", title: "Reports", description: "Generate and download reports", icon: BarChart3, href: "/reports" },
  { id: "p9", type: "page", title: "Notifications", description: "Alerts and updates", icon: Bell, href: "/notifications" },
  { id: "p10", type: "page", title: "AI Recommendations", description: "AI-powered insights", icon: Sparkles, href: "/ai-recommendations" },
  { id: "p11", type: "page", title: "Settings", description: "Workspace configuration", icon: Settings, href: "/settings" },
];

const clientResults: SearchResult[] = clients.slice(0, 20).map(c => ({
  id: `c-${c.id}`,
  type: "client",
  title: c.name,
  description: `${c.industry} · Health: ${c.healthScore} · ${c.manager.name}`,
  icon: Users,
  href: `/clients/${c.id}`,
}));

const taskResults: SearchResult[] = tasks.slice(0, 15).map(t => ({
  id: `t-${t.id}`,
  type: "task",
  title: t.title,
  description: `${t.status.replace("_", " ")} · ${t.assignee.name} · Due: ${t.dueDate}`,
  icon: CheckSquare,
  href: "/tasks",
}));

const recResults: SearchResult[] = recommendations.slice(0, 10).map(r => ({
  id: `r-${r.id}`,
  type: "recommendation",
  title: r.title,
  description: `Confidence: ${r.confidence}% · ${r.client.name}`,
  icon: Sparkles,
  href: "/ai-recommendations",
}));

const allResults = [...pages, ...clientResults, ...taskResults, ...recResults];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const filtered = query.length > 0
    ? allResults.filter(r =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 12)
    : pages;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      setOpen(prev => !prev);
      setQuery("");
      setSelectedIndex(0);
    }
    if (e.key === "Escape" && open) {
      setOpen(false);
    }
  }, [open]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    router.push(result.href);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  if (!open) return null;

  const groupedResults = filtered.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const type = r.type === "page" ? "Pages" : r.type === "client" ? "Clients" : r.type === "task" ? "Tasks" : "Recommendations";
    if (!acc[type]) acc[type] = [];
    acc[type].push(r);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Command className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search everything..."
            className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {Object.entries(groupedResults).map(([group, results]) => (
            <div key={group}>
              <div className="px-4 py-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{group}</p>
              </div>
              {results.map((result) => {
                flatIndex++;
                const isSelected = flatIndex === selectedIndex;
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{result.description}</p>
                    </div>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No results found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-muted/30">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <kbd className="bg-background px-1 py-0.5 rounded border border-border">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <kbd className="bg-background px-1 py-0.5 rounded border border-border">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <kbd className="bg-background px-1 py-0.5 rounded border border-border">esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
