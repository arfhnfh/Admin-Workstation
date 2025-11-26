-- ===== AUTHENTICATION SETUP ============================================
-- This migration sets up authentication for the staff system
-- 
-- IMPORTANT: Supabase Auth is already enabled by default in Supabase projects.
-- This file contains additional setup and instructions.

-- ===== EMAIL AUTHENTICATION ============================================
-- Supabase Auth supports email/password authentication out of the box.
-- No additional SQL is required for basic email auth.

-- ===== LINKING STAFF TO AUTH USERS =====================================
-- The staff table already has an auth_user_id column that references auth.users(id)
-- This allows linking staff profiles to authenticated users.

-- Function to automatically link staff to auth user when they sign up
-- This can be called via a database trigger or manually by admins
create or replace function link_staff_to_auth_user(
  staff_email text,
  auth_user_id uuid
) returns void as $$
begin
  update staff
  set auth_user_id = link_staff_to_auth_user.auth_user_id
  where exists (
    select 1
    from staff_contact sc
    where sc.staff_id = staff.id
    and lower(sc.email) = lower(link_staff_to_auth_user.staff_email)
  );
end;
$$ language plpgsql security definer;

-- ===== RLS POLICIES FOR AUTH ===========================================
-- The existing RLS policies in 0001_init.sql already check auth.uid()
-- They allow:
-- - Staff to read their own profile (where auth_user_id = auth.uid())
-- - Admins to read/write all profiles (where role = 'admin' and auth_user_id = auth.uid())

-- Additional policy to allow staff to update their own contact info
create policy if not exists staff_update_own_contact on staff_contact
  for update
  using (
    exists (
      select 1 from staff s
      where s.id = staff_contact.staff_id
      and s.auth_user_id = auth.uid()
    )
  );

-- ===== SETUP INSTRUCTIONS ==============================================
-- 
-- 1. In Supabase Dashboard:
--    - Go to Authentication > Settings
--    - Ensure "Enable Email Signup" is enabled
--    - Configure email templates if needed
--    - Set up email confirmation (recommended for production)
--
-- 2. For Staff Accounts (@aafiyatgroup.com):
--    - Staff should sign up or be created by admins
--    - After creating auth user, link them to staff record:
--      SELECT link_staff_to_auth_user('staff@aafiyatgroup.com', 'auth-user-uuid');
--    - Or create a trigger to auto-link based on email match
--
-- 3. For External Users (non-@aafiyatgroup.com):
--    - They can sign up via the signup page
--    - They will need email confirmation (if enabled)
--    - Admins can later create staff records and link them if needed
--
-- 4. Environment Variables:
--    - VITE_SUPABASE_URL: Your Supabase project URL
--    - VITE_SUPABASE_ANON_KEY: Your Supabase anon/public key
--    - Both can be found in Supabase Dashboard > Settings > API
--
-- 5. Email Configuration (Production):
--    - Set up SMTP in Supabase Dashboard > Authentication > Settings
--    - Or use Supabase's built-in email service (limited)
--    - Configure email templates for signup, password reset, etc.
--
-- 6. Password Requirements:
--    - Minimum 6 characters (can be configured in Supabase Dashboard)
--    - Consider enabling password strength requirements
--
-- 7. Session Management:
--    - Sessions are automatically managed by Supabase
--    - Default session duration: 1 hour (configurable)
--    - Refresh tokens are handled automatically

-- ===== HELPER FUNCTION FOR ADMIN USER CREATION ========================
-- Admins can use this function to create staff accounts with auth users
create or replace function create_staff_with_auth(
  p_email text,
  p_password text,
  p_short_name text,
  p_full_name text,
  p_ic_no text
) returns uuid as $$
declare
  v_auth_user_id uuid;
  v_staff_id uuid;
begin
  -- Note: This function requires service role key to create auth users
  -- In practice, you would create auth users via Supabase Admin API or Dashboard
  -- This is just a placeholder showing the concept
  
  -- For now, return an error suggesting manual creation
  raise exception 'Use Supabase Admin API or Dashboard to create auth users. Then link them using link_staff_to_auth_user()';
  
  return v_staff_id;
end;
$$ language plpgsql;

-- ===== NOTES ===========================================================
-- 
-- Security:
-- - All RLS policies check auth.uid() to ensure users can only access their own data
-- - Admins can access all data via the admin policies
-- - The link_staff_to_auth_user function uses SECURITY DEFINER for admin operations
--
-- Best Practices:
-- - Always verify email addresses
-- - Use strong password requirements
-- - Enable 2FA for admin accounts (can be configured in Supabase)
-- - Regularly audit auth_user_id links in staff table
-- - Consider adding audit logging for auth events

