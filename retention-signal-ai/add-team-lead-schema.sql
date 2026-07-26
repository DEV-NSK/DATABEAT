-- =====================================================================
-- Team Lead Schema Updates
-- Run this in your Supabase SQL Editor
-- =====================================================================

-- 1. Add manager_id and is_active columns to profiles if they don't exist
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Ensure role column exists and has team_lead as a valid value
-- (If role is an enum type, you may need to add the value first)
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'team_lead';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ceo';

-- 3. RLS policies for profiles — Team Lead can only read their own profile
-- Drop permissive policies first (adjust names to match your existing ones)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR id = (SELECT manager_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. RLS for client_health_scores — scope to user_id
DROP POLICY IF EXISTS "health_scores_team_lead" ON client_health_scores;

CREATE POLICY "health_scores_team_lead" ON client_health_scores
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 5. RLS for client_cross_sell — scope to user_id
DROP POLICY IF EXISTS "cross_sell_team_lead" ON client_cross_sell;

CREATE POLICY "cross_sell_team_lead" ON client_cross_sell
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 6. RLS for weekly_reports — scope to user_id (replace the open policies)
DROP POLICY IF EXISTS "Allow read access" ON weekly_reports;
DROP POLICY IF EXISTS "Allow insert" ON weekly_reports;

CREATE POLICY "weekly_reports_select_own" ON weekly_reports
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "weekly_reports_insert_own" ON weekly_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 7. Example: assign a manager to a team_lead (run manually after creating users)
-- UPDATE profiles SET manager_id = '<manager_uuid>' WHERE id = '<team_lead_uuid>';
-- UPDATE profiles SET role = 'team_lead' WHERE email = 'teamlead@example.com';
-- UPDATE profiles SET role = 'manager' WHERE email = 'manager@example.com';
