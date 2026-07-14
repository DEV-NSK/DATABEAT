-- Fix RLS policies for weekly_reports table to allow anon access
-- Run this in your Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access" ON weekly_reports;
DROP POLICY IF EXISTS "Allow insert" ON weekly_reports;

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
