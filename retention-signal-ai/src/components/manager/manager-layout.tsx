"use client";

import { useState } from "react";
import { ManagerSidebar } from "@/components/manager/manager-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { CommandPalette } from "@/components/shared/command-palette";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { motion } from "framer-motion";

// PRD §21: Manager Layout — ManagerSidebar + TopNav + main content
export function ManagerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <ManagerSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
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
    </div>
  );
}
