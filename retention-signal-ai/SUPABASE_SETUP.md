# Supabase Setup for Weekly Reports

## Database Schema

The Weekly Reports feature uses the following Supabase table schema:

### Table: `weekly_reports`

```sql
CREATE TABLE weekly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT,
  client_name TEXT,
  manager TEXT,
  week TEXT,
  sla_miss BOOLEAN,
  escalation BOOLEAN,
  rework INTEGER,
  scope_creep BOOLEAN,
  requirement_fulfillment INTEGER,
  stakeholder_alignment INTEGER,
  communication INTEGER,
  meeting_frequency INTEGER,
  delivery_comments TEXT,
  relationship_feedback TEXT,
  report_timestamp TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for ordering by creation date
CREATE INDEX idx_weekly_reports_created_at ON weekly_reports(created_at DESC);
```

### Column Descriptions

- `id`: Unique identifier for each report (UUID)
- `client_id`: Client identifier
- `client_name`: Name of the client
- `manager`: Assigned manager
- `week`: Reporting period/week
- `sla_miss`: Boolean indicating if SLA was missed
- `escalation`: Boolean indicating if there was an escalation
- `rework`: Number of rework iterations
- `scope_creep`: Boolean indicating scope creep occurred
- `requirement_fulfillment`: Requirement fulfillment score (0-100)
- `stakeholder_alignment`: Stakeholder alignment score
- `communication`: Communication score
- `meeting_frequency`: Meeting frequency score
- `delivery_comments`: Comments about delivery
- `relationship_feedback`: Feedback about the relationship
- `report_timestamp`: Timestamp when the report was generated
- `created_at`: Timestamp when the record was created

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Update the following variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key

## Row Level Security (RLS)

Enable RLS and create policies for the `weekly_reports` table:

```sql
-- Enable RLS
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users (including anon)
CREATE POLICY "Allow read access" ON weekly_reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow insert for all users (including anon)
CREATE POLICY "Allow insert" ON weekly_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

## API Endpoints

The application uses the following API endpoints:

- `GET /api/weekly-reports/latest` - Fetches the most recent report (ordered by created_at DESC)
- `GET /api/weekly-reports/history` - Fetches all reports ordered by creation date

## Data Mapping

The frontend maps the database structure to the expected `WeeklyReportResponse` format:

- `week` → `report.reportingPeriod`
- `client_name` → `uploadedFile.fileName`
- `created_at` → `uploadedFile.uploadedAt`
- `escalation` → `report.churnRisk` (derived)
- `scope_creep` → `report.crossSell` (derived)
- `sla_miss` → `report.onTimeDelivery` (derived)
- `delivery_comments` → `report.notes`
- `relationship_feedback` → `report.clientSentiment`

## Integration with n8n Webhook

The current implementation uploads files to an n8n webhook. The n8n workflow should:

1. Process the uploaded document
2. Extract the relevant fields
3. Insert the data into the Supabase `weekly_reports` table
4. Return a response that the frontend can use

The frontend automatically fetches the latest report from Supabase after successful upload, so the n8n workflow should ensure data is persisted to the database before returning.
