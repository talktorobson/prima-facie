-- =====================================================
-- Prima Facie - Fix RLS Policies for User Registration
-- Run this in Supabase SQL Editor to fix registration issues
-- =====================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_insert_policy" ON users;

-- Create a new policy that allows users to insert their own profile during registration
CREATE POLICY "users_insert_own_profile" ON users
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Also allow users to update their own profile
DROP POLICY IF EXISTS "users_update_own_policy" ON users;
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Success message
SELECT 'RLS policies fixed for user registration!' as result;