"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Heart, TrendingUp, Shuffle,
  CheckSquare, BarChart3, Bell, Settings, LogOut, Moon, Sun, ChevronLeft,
  Activity, Sparkles, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NavChild {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  label?: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
  sectionLabel?: string;
}

const navItems: NavItem[] = [
  { label: "Command Center", href: "/", icon: LayoutDashboard },
  { label: "Accounts", href: "/clients", icon: Users },
  { label: "Health Intelligence", href: "/account-health", icon: Heart },
  {
    label: "Growth Intelligence",
    icon: TrendingUp,
    children: [
      { label: "Upsell Center", href: "/upsell", icon: TrendingUp },
      { label: "Cross-Sell Center", href: "/cross-sell", icon: Shuffle },
    ],
  },
  { label: "Work Queue", href: "/tasks", icon: CheckSquare },
  { label: "Weekly Reports", href: "/weekly-reports", icon: FileText },
  {
    label: "Insights",
    icon: Sparkles,
    children: [
      { label: "AI Recommendations", href: "/ai-recommendations", icon: Sparkles },
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { sectionLabel: "Administration" },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Growth Intelligence", "Insights"]);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev =>
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    );
  };

  const isItemActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col z-40"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Activity className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-semibold text-foreground whitespace-nowrap">Retention Signal</p>
              <p className="text-[10px] text-muted-foreground whitespace-nowrap">Account Intelligence</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {navItems.map((item, idx) => {
          if (item.sectionLabel) {
            if (collapsed) return <Separator key={idx} className="my-2" />;
            return (
              <div key={idx} className="mt-4 mb-1 px-2.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {item.sectionLabel}
                </p>
              </div>
            );
          }

          if (item.children) {
            const Icon = item.icon!;
            const isExpanded = expandedGroups.includes(item.label!);
            const anyChildActive = item.children.some(c => isItemActive(c.href));

            return (
              <div key={item.label}>
                <button
                  onClick={() => !collapsed && toggleGroup(item.label!)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                    anyChildActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("w-[18px] h-[18px] shrink-0", anyChildActive && "text-primary")} />
                  {!collapsed && (
                    <>
                      <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
                    </>
                  )}
                </button>
                <AnimatePresence>
                  {isExpanded && !collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden ml-4 space-y-0.5 mt-0.5"
                    >
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const active = isItemActive(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors relative",
                              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="whitespace-nowrap">{child.label}</span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          const Icon = item.icon!;
          const isActive = item.href ? isItemActive(item.href) : false;

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "text-primary")} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-2.5 space-y-1 shrink-0">
        <div className={cn("flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted cursor-pointer", collapsed && "justify-center")}>
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">SK</AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">Sai Kiran</p>
                <p className="text-[10px] text-muted-foreground truncate">Director</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button variant="ghost" size="sm" onClick={toggleDark} className={cn("w-full justify-start gap-2.5 text-muted-foreground", collapsed && "justify-center px-0")}>
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">Theme</span>}
        </Button>

        <Button variant="ghost" size="sm" onClick={onToggle} className={cn("w-full justify-start gap-2.5 text-muted-foreground", collapsed && "justify-center px-0")}>
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="text-xs">Collapse</span>}
        </Button>

        <Button variant="ghost" size="sm" className={cn("w-full justify-start gap-2.5 text-muted-foreground hover:text-destructive", collapsed && "justify-center px-0")}>
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-xs">Logout</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
