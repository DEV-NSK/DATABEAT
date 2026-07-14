"use client";

import { Search, Bell, Plus, ChevronDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notifications } from "@/lib/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export function TopNav() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const unreadCount = notifications.filter(n => !n.read).length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfileClick = () => {
    router.push("/settings");
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-card/80 backdrop-blur-sm border-b border-border flex items-center px-6 gap-4">
      {/* Global Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients, reports, tasks..."
            className="pl-9 h-8 text-sm bg-muted/50 border-none focus-visible:ring-1"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Date Filter */}
        <Popover>
          <PopoverTrigger
            render={
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted" />
            }
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Last 30 days</span>
            <ChevronDown className="w-3 h-3" />
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="end">
            {["Today", "Last 7 days", "Last 30 days", "Last quarter", "This year", "Custom range"].map((period) => (
              <button key={period} className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-muted">
                {period}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Workspace/Company Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted"
          >
            <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary">RS</span>
            </div>
            <span className="hidden sm:inline">{user?.company_name || "Workspace"}</span>
            <ChevronDown className="w-3 h-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{user?.company_name || "Default"}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Create */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem>New Task</DropdownMenuItem>
            <DropdownMenuItem>New Report</DropdownMenuItem>
            <DropdownMenuItem>Add Client</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[9px] bg-destructive text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">Mark all read</Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.slice(0, 8).map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2">
                <div className="flex items-center gap-2 w-full">
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  <p className="text-xs font-medium truncate flex-1">{n.title}</p>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1 pl-3.5">{n.message}</p>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-7 h-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {user ? getInitials(user.full_name) : "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={handleProfileClick}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
