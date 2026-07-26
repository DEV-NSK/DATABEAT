"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { CommandPalette } from "@/components/shared/command-palette";
import { RightDrawer } from "@/components/shared/right-drawer";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

const authRoutes = ["/login", "/register", "/reset-password"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Auth pages render without shell
  if (authRoutes.includes(pathname)) {
    return (
      <>
        {children}
        <CommandPalette />
      </>
    );
  }

  // PRD §21: Manager routes use their own ManagerLayout — AppShell is skipped
  if (pathname.startsWith("/manager")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <motion.div
        initial={false}
        animate={{ marginLeft: collapsed ? 68 : 260 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex flex-col min-h-screen"
      >
        <TopNav />
        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto">
          <Breadcrumbs />
          {children}
        </main>
      </motion.div>
      <CommandPalette />
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        content={null}
      />
    </div>
  );
}
