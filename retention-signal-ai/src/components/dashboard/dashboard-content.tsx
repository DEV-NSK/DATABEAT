"use client";

import { motion } from "framer-motion";
import { AISummaryCard } from "./ai-summary-card";
import { KPICards } from "./kpi-cards";
import { HealthCharts } from "./health-charts";
import { RecentHealthReports } from "./recent-health-reports";
import { RecentActivity } from "./recent-activity";
import { useHealthScores } from "@/hooks/use-health-scores";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function DashboardContent() {
  const healthData = useHealthScores();

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn}>
        <AISummaryCard kpis={healthData.kpis} loading={healthData.loading} />
      </motion.div>

      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.05 }}>
        <KPICards kpis={healthData.kpis} loading={healthData.loading} />
      </motion.div>

      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.1 }}>
        <HealthCharts
          rows={healthData.rows}
          trendData={healthData.trendData}
          kpis={healthData.kpis}
          loading={healthData.loading}
        />
      </motion.div>

      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.15 }}>
        <RecentHealthReports rows={healthData.rows} loading={healthData.loading} />
      </motion.div>

      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.2 }}>
        <RecentActivity />
      </motion.div>
    </div>
  );
}
