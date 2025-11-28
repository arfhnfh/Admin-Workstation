-- Set hamiduddin@aafiyatgroup.com as Admin
-- This script updates the role of the staff member with email hamiduddin@aafiyatgroup.com to 'admin'

UPDATE staff
SET 
  role = 'admin',
  updated_at = now()
WHERE id IN (
  SELECT staff_id 
  FROM staff_contact 
  WHERE email = 'hamiduddin@aafiyatgroup.com'
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
WHERE sc.email = 'hamiduddin@aafiyatgroup.com';

