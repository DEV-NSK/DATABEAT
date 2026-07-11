"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

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
          {children}
        </main>
      </motion.div>
    </div>
  );
}
