"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, TrendingUp, AlertTriangle, FileText,
  BarChart3, Bell, LogOut, Moon, Sun, ChevronLeft, Activity, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";

interface NavItem {
  label?: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  sectionLabel?: string;
}

// PRD §4 — Manager sidebar navigation (no Submit Weekly Report, no My Clients)
const managerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
  { label: "Team Leads", href: "/manager/team-leads", icon: Users },
  { label: "Clients", href: "/manager/clients", icon: Activity },
  { label: "Risk Signals", href: "/manager/risk-signals", icon: AlertTriangle },
  { label: "Opportunities", href: "/manager/opportunities", icon: TrendingUp },
  { label: "Weekly Reports", href: "/manager/weekly-reports", icon: FileText },
  { label: "Performance", href: "/manager/performance", icon: BarChart3 },
  { label: "Notifications", href: "/manager/notifications", icon: Bell },
  { sectionLabel: "Account" },
  { label: "Profile", href: "/manager/profile", icon: User },
];

interface ManagerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function ManagerSidebar({ collapsed, onToggle }: ManagerSidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";
  const toggleDark = () => setTheme(isDark ? "light" : "dark");

  const isItemActive = (href: string) =>
    pathname === href || (href !== "/manager/dashboard" && pathname.startsWith(href));

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    await signOut();
  };

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
          <Activity className="w-4 h-4 text-primary-foreground" />
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
              <p className="text-[10px] text-muted-foreground whitespace-nowrap">Manager Workspace</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {managerNavItems.map((item, idx) => {
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

          const Icon = item.icon!;
          const isActive = item.href ? isItemActive(item.href) : false;

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                  layoutId="manager-sidebar-active"
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
        {/* User info */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted cursor-default",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {user ? getInitials(user.full_name) : "M"}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-foreground truncate">{user?.full_name || "Manager"}</p>
                <p className="text-[10px] text-muted-foreground truncate">Manager</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDark}
          className={cn("w-full justify-start gap-2.5 text-muted-foreground", collapsed && "justify-center px-0")}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">{isDark ? "Light mode" : "Dark mode"}</span>}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn("w-full justify-start gap-2.5 text-muted-foreground", collapsed && "justify-center px-0")}
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="text-xs">Collapse</span>}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-2.5 text-muted-foreground hover:text-destructive",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-xs">Logout</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
