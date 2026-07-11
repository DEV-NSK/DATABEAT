# DATABEAT — Retention Signal AI

An enterprise-grade **AI-powered client retention platform** built for Customer Success teams. DATABEAT surfaces actionable retention signals, churn risk scores, expansion opportunities, and AI-driven recommendations — all through a modern, real-time dashboard.

---

## Features

- **AI Insights Dashboard** — Executive summary with KPI cards, health distribution charts, and top risk accounts
- **Account Health Monitoring** — Real-time health scores with trend indicators and risk-level badges
- **Churn Risk Detection** — Early warning signals powered by AI analysis of engagement, usage, and sentiment data
- **Upsell & Cross-Sell Opportunities** — AI-identified expansion revenue pipeline with win-probability scoring
- **AI Recommendations Feed** — Context-aware action items ranked by impact and urgency
- **Client Management** — Detailed client profiles with signal timelines, contact information, and contract data
- **Task Management** — AI-generated task prioritization and workflow automation
- **Notifications & Alerts** — Real-time notification center for risk alerts, opportunities, and system updates
- **Reports & Analytics** — Exportable reports with health trend visualization and cohort analysis
- **Weekly Reports** — Automated weekly digest with key metrics and AI-curated insights

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, SSR) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Charts | [Recharts](https://recharts.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Theming | [next-themes](https://github.com/pacocoursey/next-themes) |

## Project Structure

```
DATABEAT/
├── retention-signal-ai/        # Main Next.js application
│   ├── src/
│   │   ├── app/                # App Router pages & layouts
│   │   │   ├── dashboard-layout.tsx
│   │   │   ├── page.tsx        # Dashboard home
│   │   │   ├── clients/        # Client list & detail pages
│   │   │   ├── ai-recommendations/
│   │   │   ├── cross-sell/
│   │   │   ├── upsell/
│   │   │   ├── tasks/
│   │   │   ├── notifications/
│   │   │   ├── reports/
│   │   │   ├── weekly-reports/
│   │   │   ├── account-health/
│   │   │   └── settings/
│   │   ├── components/
│   │   │   ├── dashboard/      # Dashboard-specific widgets
│   │   │   ├── layout/         # Sidebar, TopNav
│   │   │   ├── shared/         # Reusable UI components
│   │   │   └── ui/             # shadcn/ui primitives
│   │   └── lib/
│   │       ├── mock-data.ts    # Deterministic seed data
│   │       ├── types.ts        # TypeScript domain models
│   │       └── utils.ts        # Utility helpers
│   ├── public/                 # Static assets
│   └── package.json
├── PRD-UI-UX/                  # Product requirement documents (PDFs)
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9

### Installation

```bash
# Clone the repository
git clone https://github.com/DEV-NSK/DATABEAT.git
cd DATABEAT

# Install dependencies
cd retention-signal-ai
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Production

```bash
# Create production build
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | AI Insights Dashboard |
| `/clients` | Client list with health indicators |
| `/clients/[id]` | Individual client detail view |
| `/ai-recommendations` | AI-generated action recommendations |
| `/cross-sell` | Cross-sell opportunity pipeline |
| `/upsell` | Upsell opportunity pipeline |
| `/tasks` | Task management & prioritization |
| `/notifications` | Alert & notification center |
| `/reports` | Analytics & exportable reports |
| `/weekly-reports` | Automated weekly digest |
| `/account-health` | Account health overview |
| `/settings` | User & system settings |

## License

This project is proprietary. All rights reserved.
