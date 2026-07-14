-- =============================================================
-- RETENTION SIGNAL AI — Complete Database Setup
-- Run this entire script in your Supabase SQL Editor
-- =============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE
-- The table may already exist. We create it if it doesn't exist,
-- then add any missing columns with ALTER TABLE.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add every required column safely (no-op if column already exists)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name    text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_name text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS designation  text,
  ADD COLUMN IF NOT EXISTS email        text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url   text,
  ADD COLUMN IF NOT EXISTS role         text        NOT NULL DEFAULT 'Manager',
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_login   timestamptz;

-- ──────────────────────────────────────────────────────────────
-- 2. WEEKLY REPORTS TABLE
-- The table may already exist. We create it if it doesn't exist,
-- then add any missing columns with ALTER TABLE.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id         uuid        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add every required column safely (no-op if column already exists)
ALTER TABLE public.weekly_reports
  ADD COLUMN IF NOT EXISTS user_id                 uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS company_name            text,
  ADD COLUMN IF NOT EXISTS uploaded_by             text,
  ADD COLUMN IF NOT EXISTS client_name             text,
  ADD COLUMN IF NOT EXISTS week                    text,
  ADD COLUMN IF NOT EXISTS manager                 text,
  ADD COLUMN IF NOT EXISTS sla_miss                boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalation              boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rework                  integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scope_creep             boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requirement_fulfillment integer     NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS stakeholder_alignment   integer     NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS communication           integer     NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS meeting_frequency       integer     NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS delivery_comments       text,
  ADD COLUMN IF NOT EXISTS relationship_feedback   text,
  ADD COLUMN IF NOT EXISTS report_timestamp        timestamptz;

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS weekly_reports_user_id_idx   ON public.weekly_reports(user_id);
CREATE INDEX IF NOT EXISTS weekly_reports_created_at_idx ON public.weekly_reports(created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- 3. AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company_name, designation, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    NEW.raw_user_meta_data->>'designation',
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Manager')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop and recreate to ensure it's up to date
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- 4. AUTO-UPDATE updated_at on PROFILES
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY — PROFILES
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own"  ON public.profiles;

-- Authenticated users can only access their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ──────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY — WEEKLY REPORTS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Allow read access"            ON public.weekly_reports;
DROP POLICY IF EXISTS "Allow insert"                 ON public.weekly_reports;
DROP POLICY IF EXISTS "weekly_reports_select_own"    ON public.weekly_reports;
DROP POLICY IF EXISTS "weekly_reports_insert_own"    ON public.weekly_reports;
DROP POLICY IF EXISTS "weekly_reports_update_own"    ON public.weekly_reports;
DROP POLICY IF EXISTS "weekly_reports_delete_own"    ON public.weekly_reports;

-- Authenticated users can only access their own reports
CREATE POLICY "weekly_reports_select_own"
  ON public.weekly_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "weekly_reports_insert_own"
  ON public.weekly_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "weekly_reports_update_own"
  ON public.weekly_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "weekly_reports_delete_own"
  ON public.weekly_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- 7. GRANT PERMISSIONS
-- ──────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.weekly_reports TO authenticated;
