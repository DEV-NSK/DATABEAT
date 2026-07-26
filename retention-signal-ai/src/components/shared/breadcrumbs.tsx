"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const pathLabels: Record<string, string> = {
  "": "Dashboard",
  clients: "My Clients",
  "weekly-reports": "Weekly Reports",
  "account-health": "Health Intelligence",
  "risk-signals": "Risk Signals",
  "cross-sell": "Opportunities",
  tasks: "Tasks",
  reports: "Reports",
  notifications: "Notifications",
  profile: "Profile",
  settings: "Settings",
  login: "Login",
  register: "Register",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Home", href: "/" }];

  segments.forEach((seg, i) => {
    const label = pathLabels[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    crumbs.push({ label, href: "/" + segments.slice(0, i + 1).join("/") });
  });

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
      <Link href="/" className="hover:text-foreground transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.slice(1).map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3" />
          {i === crumbs.length - 2 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
