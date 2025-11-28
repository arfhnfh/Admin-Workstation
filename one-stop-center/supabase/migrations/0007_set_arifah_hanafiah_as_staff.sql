-- Set arifah.hanafiah@aafiyatgroup.com as Staff
-- This script updates the role of the staff member with email arifah.hanafiah@aafiyatgroup.com to 'staff'

UPDATE staff
SET 
  role = 'staff',
  updated_at = now()
WHERE id IN (
  SELECT staff_id 
  FROM staff_contact 
  WHERE email = 'arifah.hanafiah@aafiyatgroup.com'
);

-- Verify the update
SELECT 
  s.id,
  s.short_name,
  s.full_name,
  s.role,
  sc.email
FROM staff s
JOIN staff_contact sc ON sc.staff_id = s.id
WHERE sc.email = 'arifah.hanafiah@aafiyatgroup.com';

-- Note: If no rows are returned, the staff record doesn't exist yet.
-- You'll need to create the staff record first, then link it to the auth user.

