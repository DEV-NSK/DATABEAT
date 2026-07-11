"use client";

import { motion } from "framer-motion";
import { AISummaryCard } from "./ai-summary-card";
import { KPICards } from "./kpi-cards";
import { HealthCharts } from "./health-charts";
import { AIRecommendationFeed } from "./ai-recommendation-feed";
import { TopRiskAccounts } from "./top-risk-accounts";
import { OpportunityPipeline } from "./opportunity-pipeline";
import { RecentActivity } from "./recent-activity";
import { ContractRenewals } from "./contract-renewals";
import { AIInsights } from "./ai-insights";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function DashboardContent() {
  return (
    <div className="space-y-6">
      <motion.div {...fadeIn}>
        <AISummaryCard />
      </motion.div>

      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.05 }}>
        <KPICards />
      </motion.div>

      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.1 }}>
        <HealthCharts />
      </motion.div>

      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.15 }}>
        <AIRecommendationFeed />
      </motion.div>

      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.2 }}>
        <TopRiskAccounts />
      </motion.div>

      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.25 }}>
        <OpportunityPipeline />
      </motion.div>

      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.3 }}>
        <RecentActivity />
      </motion.div>

      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.35 }}>
        <ContractRenewals />
      </motion.div>

      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.4 }}>
        <AIInsights />
      </motion.div>
    </div>
  );
}
