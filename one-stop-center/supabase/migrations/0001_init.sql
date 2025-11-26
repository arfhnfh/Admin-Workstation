-- Enable uuid helpers
create extension if not exists "uuid-ossp";

-- ===== STAFF MODULE =======================================================
create table if not exists staff (
  id uuid primary key default uuid_generate_v4(),
  short_name text not null,
  full_name text not null,
  ic_no text unique not null,
  gender text check (gender in ('MALE', 'FEMALE')),
  dob date,
  nationality text default 'MALAYSIAN',
  marital_status text,
  avatar_url text,
  role text default 'staff' check (role in ('staff', 'admin')),
  status text default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists staff_contact (
  staff_id uuid primary key references staff(id) on delete cascade,
  phone text,
  email text,
  location text,
  address text,
  emergency_name text,
  emergency_phone text,
  updated_at timestamptz default now()
);

create table if not exists staff_employment (
  staff_id uuid primary key references staff(id) on delete cascade,
  department text,
  position text,
  employee_no text,
  job_grade text,
  report_to text,
  allowance bool default false,
  claim bool default false,
  updated_at timestamptz default now()
);

create table if not exists staff_bank (
  staff_id uuid primary key references staff(id) on delete cascade,
  bank_name text,
  account_no text,
  updated_at timestamptz default now()
);

create table if not exists staff_passport (
  staff_id uuid primary key references staff(id) on delete cascade,
  passport_no text,
  expiry_date date,
  updated_at timestamptz default now()
);

create table if not exists staff_allowance (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid references staff(id) on delete cascade,
  allowance_type text,
  amount numeric(12, 2),
  remarks text,
  created_at timestamptz default now()
);

create or replace view staff_view as
select
  s.id,
  s.short_name as name,
  s.full_name as "fullName",
  s.ic_no as "icNo",
  s.gender,
  s.dob,
  coalesce(date_part('year', age(coalesce(s.dob, now()))), 0)::int as age,
  coalesce(sc.phone, '') as phone,
  coalesce(s.marital_status, '') as "maritalStatus",
  coalesce(s.nationality, '') as nationality,
  jsonb_build_object(
    'email', coalesce(sc.email, ''),
    'location', coalesce(sc.location, ''),
    'department', coalesce(se.department, ''),
    'position', coalesce(se.position, ''),
    'employeeNo', coalesce(se.employee_no, ''),
    'jobGrade', coalesce(se.job_grade, ''),
    'reportTo', coalesce(se.report_to, ''),
    'role', coalesce(s.role, 'staff'),
    'status', coalesce(s.status, 'ACTIVE')
  ) as work,
  jsonb_build_object(
    'passportNo', sp.passport_no,
    'expiryDate', sp.expiry_date
  ) as passport,
  jsonb_build_object(
    'bankName', coalesce(sb.bank_name, ''),
    'accountNo', coalesce(sb.account_no, '')
  ) as bank,
  jsonb_build_object(
    'allowance', coalesce(se.allowance, false),
    'claim', coalesce(se.claim, false)
  ) as allowance,
  s.avatar_url as "avatarUrl"
from staff s
  left join staff_contact sc on sc.staff_id = s.id
  left join staff_employment se on se.staff_id = s.id
  left join staff_passport sp on sp.staff_id = s.id
  left join staff_bank sb on sb.staff_id = s.id;

-- ===== LIBRARY MODULE =====================================================
create table if not exists book_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon text,
  color text,
  created_at timestamptz default now()
);

create table if not exists books (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references book_categories(id) on delete set null,
  title text not null,
  author text not null,
  cover_url text,
  synopsis text,
  total_copies int default 1 check (total_copies >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists book_copies (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid references books(id) on delete cascade,
  inventory_code text,
  status text default 'AVAILABLE' check (status in ('AVAILABLE', 'ON_LOAN', 'MAINTENANCE')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists book_loans (
  id uuid primary key default uuid_generate_v4(),
  copy_id uuid references book_copies(id) on delete cascade,
  borrower_id uuid references staff(id) on delete set null,
  loan_status text default 'ON_LOAN' check (loan_status in ('ON_LOAN', 'RETURNED', 'OVERDUE')),
  loaned_at timestamptz default now(),
  due_at timestamptz,
  returned_at timestamptz,
  notes text,
  created_by uuid references staff(id),
  updated_at timestamptz default now()
);

create or replace view loan_history as
select
  l.id,
  b.title,
  s.short_name as borrower,
  l.loan_status,
  l.loaned_at,
  l.due_at,
  l.returned_at,
  l.notes
from book_loans l
  left join book_copies c on c.id = l.copy_id
  left join books b on b.id = c.book_id
  left join staff s on s.id = l.borrower_id;

-- ===== RLS ================================================================
alter table staff enable row level security;
alter table staff_contact enable row level security;
alter table staff_employment enable row level security;
alter table staff_bank enable row level security;
alter table staff_passport enable row level security;
alter table staff_allowance enable row level security;
alter table book_categories enable row level security;
alter table books enable row level security;
alter table book_copies enable row level security;
alter table book_loans enable row level security;

-- Staff can read their own profile
create policy if not exists staff_read_self on staff
  for select
  using (auth.uid() = auth_user_id or exists (select 1 from staff st where st.auth_user_id = auth.uid() and st.role = 'admin'));

create policy if not exists staff_admin_full on staff
  for all
  using (exists (select 1 from staff st where st.auth_user_id = auth.uid() and st.role = 'admin'));

-- Simple library policies
create policy if not exists library_read_all on books
  for select using (true);

create policy if not exists library_admin_write on books
  for all using (exists (select 1 from staff st where st.auth_user_id = auth.uid() and st.role = 'admin'));

create policy if not exists loan_read_self on book_loans
  for select using (
    auth.uid() = (select auth_user_id from staff where id = borrower_id)
    or exists (select 1 from staff st where st.auth_user_id = auth.uid() and st.role = 'admin')
  );

create policy if not exists loan_admin_write on book_loans
  for all using (exists (select 1 from staff st where st.auth_user_id = auth.uid() and st.role = 'admin'));

