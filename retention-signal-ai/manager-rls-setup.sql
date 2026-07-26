-- =====================================================================
-- DATABEAT — Manager Workspace RLS Setup
-- Run this in your Supabase SQL Editor
-- PRD §18–20: Manager RLS Security
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. Ensure manager role exists in profiles (already added by add-team-lead-schema.sql)
-- profiles already has: manager_id UUID, is_active BOOLEAN, role TEXT
-- ─────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────
-- 2. PRD §19: Helper function — get_my_team_lead_ids()
-- Returns all team lead IDs that report to the current Manager
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_team_lead_ids()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT id
  FROM profiles
  WHERE manager_id = auth.uid()
    AND role = 'team_lead';
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. PRD §20: Profiles — Manager can see their own profile + assigned team leads
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR id = (SELECT manager_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    OR manager_id = auth.uid()  -- Manager sees their team leads
  );

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────
-- 4. PRD §18: client_health_scores — Manager sees data for their team leads
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "health_scores_team_lead" ON client_health_scores;
DROP POLICY IF EXISTS "health_scores_manager" ON client_health_scores;

CREATE POLICY "health_scores_access" ON client_health_scores
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IN (SELECT public.get_my_team_lead_ids())
  );

-- ─────────────────────────────────────────────────────────────────────
-- 5. PRD §18: client_cross_sell — Manager sees data for their team leads
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cross_sell_team_lead" ON client_cross_sell;
DROP POLICY IF EXISTS "cross_sell_manager" ON client_cross_sell;

CREATE POLICY "cross_sell_access" ON client_cross_sell
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IN (SELECT public.get_my_team_lead_ids())
  );

-- ─────────────────────────────────────────────────────────────────────
-- 6. PRD §18: weekly_reports — Manager sees reports from their team leads
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "weekly_reports_select_own" ON weekly_reports;
DROP POLICY IF EXISTS "weekly_reports_insert_own" ON weekly_reports;
DROP POLICY IF EXISTS "Allow read access" ON weekly_reports;
DROP POLICY IF EXISTS "Allow insert" ON weekly_reports;

CREATE POLICY "weekly_reports_select" ON weekly_reports
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IN (SELECT public.get_my_team_lead_ids())
  );

CREATE POLICY "weekly_reports_insert_own" ON weekly_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- 7. notifications — Manager sees their own + notifications for their team
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_access" ON notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IN (SELECT public.get_my_team_lead_ids())
  );

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- 8. PRD §3: Route examples — set manager role manually after creating user:
-- UPDATE profiles SET role = 'manager' WHERE email = 'manager@example.com';
-- UPDATE profiles SET manager_id = '<manager_uuid>' WHERE id = '<team_lead_uuid>';
-- ─────────────────────────────────────────────────────────────────────
