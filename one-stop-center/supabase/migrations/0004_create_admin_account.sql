-- ===== CREATE ADMIN ACCOUNT ============================================
-- This script creates the admin account with email Admin@aafiyatgroup.com
-- Password: AafiyatTech@2025
--
-- IMPORTANT: This must be run using Supabase Admin API or Dashboard
-- The auth.users table cannot be directly inserted into via SQL
--
-- To create this account:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" > "Create new user"
-- 3. Enter:
--    - Email: Admin@aafiyatgroup.com
--    - Password: AafiyatTech@2025
--    - Auto Confirm User: ✅ (check this)
-- 4. Copy the User UUID
-- 5. Run the SQL below to create the staff record and link it

-- After creating the auth user, run this to create the staff record:
-- Replace 'ADMIN_USER_UUID_HERE' with the actual UUID from step 4

-- Create admin staff record
do $$
declare
  v_auth_user_id uuid;
  v_staff_id uuid;
begin
  -- Get the auth user ID for Admin@aafiyatgroup.com
  select id into v_auth_user_id
  from auth.users
  where email = 'admin@aafiyatgroup.com'
  limit 1;

  if v_auth_user_id is null then
    raise exception 'Admin user not found. Please create the auth user first in Supabase Dashboard > Authentication > Users';
  end if;

  -- Create staff record
  insert into staff (
    short_name,
    full_name,
    ic_no,
    gender,
    nationality,
    role,
    status,
    auth_user_id
  ) values (
    'Admin',
    'ADMIN USER',
    'ADMIN001',
    'MALE',
    'MALAYSIAN',
    'admin',
    'ACTIVE',
    v_auth_user_id
  )
  returning id into v_staff_id;

  -- Create contact record
  insert into staff_contact (
    staff_id,
    email,
    phone,
    location
  ) values (
    v_staff_id,
    'admin@aafiyatgroup.com',
    '',
    'Head Office'
  );

  -- Create employment record
  insert into staff_employment (
    staff_id,
    department,
    position,
    employee_no,
    job_grade,
    allowance,
    claim
  ) values (
    v_staff_id,
    'Administration',
    'System Administrator',
    'ADMIN001',
    'A1',
    true,
    true
  );

  raise notice 'Admin account created successfully! Staff ID: %', v_staff_id;
end $$;

-- ===== ALTERNATIVE: Manual Creation Steps =============================
--
-- If the above doesn't work, create manually:
--
-- 1. Create auth user in Dashboard:
--    Email: Admin@aafiyatgroup.com
--    Password: AafiyatTech@2025
--    Auto Confirm: Yes
--
-- 2. Get the user UUID from auth.users table
--
-- 3. Insert staff record:
-- INSERT INTO staff (short_name, full_name, ic_no, gender, nationality, role, status, auth_user_id)
-- VALUES ('Admin', 'ADMIN USER', 'ADMIN001', 'MALE', 'MALAYSIAN', 'admin', 'ACTIVE', 'USER_UUID_HERE');
--
-- 4. Get the staff ID and insert related records:
-- INSERT INTO staff_contact (staff_id, email, phone, location)
-- VALUES (staff_id, 'admin@aafiyatgroup.com', '', 'Head Office');
--
-- INSERT INTO staff_employment (staff_id, department, position, employee_no, job_grade, allowance, claim)
-- VALUES (staff_id, 'Administration', 'System Administrator', 'ADMIN001', 'A1', true, true);

