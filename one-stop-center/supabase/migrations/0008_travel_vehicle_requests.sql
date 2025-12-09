-- ===== TRAVEL REQUESTS MODULE ============================================
create table if not exists travel_requests (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid references staff(id) on delete set null,
  destination text not null,
  reason text,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  status text default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  total_meal_allowance numeric(12, 2),
  travel_no text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create travel_requests_view
create or replace view travel_requests_view as
select
  tr.id,
  tr.staff_id,
  s.short_name as staff_short_name,
  s.full_name as staff_name,
  tr.destination,
  tr.reason,
  tr.start_datetime,
  tr.end_datetime,
  tr.status,
  tr.total_meal_allowance,
  tr.travel_no,
  se.department,
  tr.created_at
from travel_requests tr
  left join staff s on s.id = tr.staff_id
  left join staff_employment se on se.staff_id = tr.staff_id;

-- ===== VEHICLE REQUESTS MODULE ==========================================
create table if not exists vehicle_requests (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid references staff(id) on delete set null,
  purpose text not null,
  destination text,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  vehicle_type text default 'CAR',
  driver_required boolean default false,
  passenger_count int,
  team_members text,
  remarks text,
  travel_no text,
  status text default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create vehicle_requests_view
create or replace view vehicle_requests_view as
select
  vr.id,
  vr.staff_id,
  s.short_name as staff_short_name,
  s.full_name as staff_name,
  vr.purpose,
  vr.destination,
  vr.start_datetime,
  vr.end_datetime,
  vr.vehicle_type,
  vr.driver_required,
  vr.status,
  se.department,
  vr.created_at
from vehicle_requests vr
  left join staff s on s.id = vr.staff_id
  left join staff_employment se on se.staff_id = vr.staff_id;

-- ===== RLS POLICIES =====================================================
alter table travel_requests enable row level security;
alter table vehicle_requests enable row level security;

-- Staff can read their own travel requests
create policy if not exists travel_requests_read_self on travel_requests
  for select
  using (
    auth.uid() = (select auth_user_id from staff where id = staff_id)
    or exists (select 1 from staff st where st.auth_user_id = auth.uid() and st.role = 'admin')
  );

-- Admins can read all travel requests
create policy if not exists travel_requests_admin_read on travel_requests
  for select
  using (exists (select 1 from staff st where st.auth_user_id = auth.uid() and st.role = 'admin'));

-- Staff can create their own travel requests
create policy if not exists travel_requests_insert_self on travel_requests
  for insert
  with check (
    auth.uid() = (select auth_user_id from staff where id = staff_id)
  );

-- Admins can update travel requests
create policy if not exists travel_requests_admin_update on travel_requests
  for update
  using (exists (select 1 from staff st where st.auth_user_id = auth.uid() and st.role = 'admin'));

-- Staff can read their own vehicle requests
create policy if not exists vehicle_requests_read_self on vehicle_requests
  for select
  using (
    auth.uid() = (select auth_user_id from staff where id = staff_id)
    or exists (select 1 from staff st where st.auth_user_id = auth.uid() and st.role = 'admin')
  );

-- Admins can read all vehicle requests
create policy if not exists vehicle_requests_admin_read on vehicle_requests
  for select
  using (exists (select 1 from staff st where st.auth_user_id = auth.uid() and st.role = 'admin'));

-- Staff can create their own vehicle requests
create policy if not exists vehicle_requests_insert_self on vehicle_requests
  for insert
  with check (
    auth.uid() = (select auth_user_id from staff where id = staff_id)
  );

-- Admins can update vehicle requests
create policy if not exists vehicle_requests_admin_update on vehicle_requests
  for update
  using (exists (select 1 from staff st where st.auth_user_id = auth.uid() and st.role = 'admin'));
