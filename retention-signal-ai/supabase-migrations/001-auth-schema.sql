-- ============================================
-- Authentication and Multi-Tenant Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  designation TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'Manager',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- UPDATE WEEKLY_REPORTS TABLE TO INCLUDE USER_ID
-- ============================================
ALTER TABLE weekly_reports 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by TEXT;

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_id ON weekly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_company ON weekly_reports(company_name);

-- ============================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES RLS POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- WEEKLY_REPORTS RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access" ON weekly_reports;
DROP POLICY IF EXISTS "Allow insert" ON weekly_reports;

-- Users can read only their own reports
CREATE POLICY "Users can read own reports" ON weekly_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert only their own reports
CREATE POLICY "Users can insert own reports" ON weekly_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own reports
CREATE POLICY "Users can update own reports" ON weekly_reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own reports
CREATE POLICY "Users can delete own reports" ON weekly_reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ============================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company_name, designation, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Company'),
    COALESCE(NEW.raw_user_meta_data->>'designation', 'Employee'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Manager')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- UPDATED_AT TRIGGER FOR PROFILES
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- BACKFILL EXISTING DATA (OPTIONAL)
-- ============================================
-- If you have existing weekly_reports without user_id, 
-- you can backfill them with a default user or leave them as NULL
-- Uncomment and modify as needed:

-- UPDATE weekly_reports 
-- SET user_id = 'YOUR_DEFAULT_USER_ID', 
--     company_name = 'Default Company',
--     uploaded_by = 'System'
-- WHERE user_id IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the setup:

-- Check profiles table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- ORDER BY ordinal_position;

-- Check weekly_reports table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'weekly_reports' 
-- ORDER BY ordinal_position;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('profiles', 'weekly_reports')
-- ORDER BY tablename, policyname;
