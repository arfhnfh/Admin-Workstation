# Cara Membuat Akaun Admin

Akaun admin perlu dibuat dengan:
- **Email**: Admin@aafiyatgroup.com
- **Password**: AafiyatTech@2025

## Kaedah 1: Menggunakan Supabase Dashboard (Disyorkan)

1. Buka Supabase Dashboard anda
2. Pergi ke **Authentication** > **Users**
3. Klik **Add User** > **Create new user**
4. Isi maklumat:
   - **Email**: `Admin@aafiyatgroup.com`
   - **Password**: `AafiyatTech@2025`
   - **Auto Confirm User**: ✅ (centang ini)
5. Klik **Create User**
6. Salin **User UUID** yang diberikan
7. Pergi ke **SQL Editor** di Supabase Dashboard
8. Jalankan SQL di bawah (gantikan `USER_UUID_HERE` dengan UUID yang disalin):

```sql
-- Gantikan USER_UUID_HERE dengan UUID dari langkah 6
DO $$
DECLARE
  v_staff_id uuid;
BEGIN
  -- Create staff record
  INSERT INTO staff (
    short_name,
    full_name,
    ic_no,
    gender,
    nationality,
    role,
    status,
    auth_user_id
  ) VALUES (
    'Admin',
    'ADMIN USER',
    'ADMIN001',
    'MALE',
    'MALAYSIAN',
    'admin',
    'ACTIVE',
    'USER_UUID_HERE'  -- Gantikan dengan UUID sebenar
  )
  RETURNING id INTO v_staff_id;

  -- Create contact record
  INSERT INTO staff_contact (
    staff_id,
    email,
    phone,
    location
  ) VALUES (
    v_staff_id,
    'admin@aafiyatgroup.com',
    '',
    'Head Office'
  );

  -- Create employment record
  INSERT INTO staff_employment (
    staff_id,
    department,
    position,
    employee_no,
    job_grade,
    allowance,
    claim
  ) VALUES (
    v_staff_id,
    'Administration',
    'System Administrator',
    'ADMIN001',
    'A1',
    true,
    true
  );

  RAISE NOTICE 'Admin account created successfully! Staff ID: %', v_staff_id;
END $$;
```

## Kaedah 2: Menggunakan Script Node.js

1. Dapatkan **Service Role Key** dari Supabase Dashboard > Settings > API
2. Jalankan script:

```bash
SUPABASE_URL=your-project-url \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
node scripts/create-admin-account.js
```

**Nota**: Service Role Key adalah sangat sensitif. Jangan dedahkan dalam kod atau commit ke git.

## Kaedah 3: Menggunakan Migration SQL

Jalankan migration file `supabase/migrations/0004_create_admin_account.sql` di SQL Editor.

**Nota**: Anda masih perlu membuat auth user terlebih dahulu di Dashboard sebelum migration ini berfungsi.

## Verifikasi

Selepas membuat akaun, cuba log masuk dengan:
- Email: `Admin@aafiyatgroup.com`
- Password: `AafiyatTech@2025`

Anda sepatutnya boleh log masuk dan melihat profil admin.

