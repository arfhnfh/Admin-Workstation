-- ============================================================================
-- Car Master Data Module
-- - Captures core vehicle details
-- - Ownership/registration info
-- - Current insurance master + insurance history
-- - Road tax records
-- - Admin-only RLS policies (requires staff.role = 'admin')
-- ============================================================================

-- 1) Core vehicle table
create table if not exists car_master (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id text not null unique,                 -- e.g., VEH-000123
  plate_number text not null unique,
  vehicle_type text not null,                      -- e.g., Car, Van, Truck, MPV
  brand text not null,
  model text not null,
  variant text,
  year int check (year >= 1900),
  engine_capacity int,                             -- in cc
  fuel text,                                       -- Petrol/Diesel/Hybrid/EV
  chassis_no text,
  engine_no text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'DISPOSED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Ownership & registration
create table if not exists car_ownership (
  id uuid primary key default uuid_generate_v4(),
  car_id uuid not null references car_master(id) on delete cascade,
  registered_owner text,                           -- e.g., Aafiyat Holdings Sdn. Bhd.
  subsidiary text,                                 -- e.g., Aafiyat Marketing Sdn. Bhd.
  registration_date date,
  ownership_type text,                             -- e.g., Hire Purchase / Owned / Lease
  financier text,
  hp_end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists car_ownership_car_id_idx on car_ownership(car_id);

-- 3) Insurance master (current/active policy only)
create table if not exists car_insurance_master (
  id uuid primary key default uuid_generate_v4(),
  car_id uuid not null references car_master(id) on delete cascade,
  insurer text,
  broker text,
  policy_no text,
  coverage text,
  coverage_start date,
  coverage_end date,
  sum_insured numeric(14,2),
  premium numeric(14,2),
  ncd numeric(5,2),                                -- percentage
  windscreen boolean default false,
  endorsement text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists car_insurance_master_car_id_idx on car_insurance_master(car_id);

-- 4) Insurance history (all past policies)
create table if not exists car_insurance_history (
  id uuid primary key default uuid_generate_v4(),
  car_id uuid not null references car_master(id) on delete cascade,
  insurer text,
  broker text,
  policy_no text,
  coverage text,
  coverage_start date,
  coverage_end date,
  sum_insured numeric(14,2),
  premium numeric(14,2),
  ncd numeric(5,2),
  windscreen boolean default false,
  endorsement text,
  created_at timestamptz default now()
);

create index if not exists car_ins_history_car_id_idx on car_insurance_history(car_id);

-- 5) Road tax master/history
create table if not exists car_roadtax (
  id uuid primary key default uuid_generate_v4(),
  car_id uuid not null references car_master(id) on delete cascade,
  period_start date,
  period_end date,
  amount numeric(14,2),
  roadtax_type text,                                -- e.g., Company/Personal
  created_at timestamptz default now()
);

create index if not exists car_roadtax_car_id_idx on car_roadtax(car_id);

-- ============================================================================
-- RLS: Admin-only (staff.role = 'admin')
-- ============================================================================

-- Enable RLS
alter table car_master enable row level security;
alter table car_ownership enable row level security;
alter table car_insurance_master enable row level security;
alter table car_insurance_history enable row level security;
alter table car_roadtax enable row level security;

-- Helper: admin check exists in staff
create policy if not exists car_master_admin_select on car_master
  for select using (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'));
create policy if not exists car_master_admin_write on car_master
  for all using (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'))
  with check (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'));

create policy if not exists car_ownership_admin_select on car_ownership
  for select using (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'));
create policy if not exists car_ownership_admin_write on car_ownership
  for all using (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'))
  with check (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'));

create policy if not exists car_ins_master_admin_select on car_insurance_master
  for select using (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'));
create policy if not exists car_ins_master_admin_write on car_insurance_master
  for all using (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'))
  with check (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'));

create policy if not exists car_ins_history_admin_select on car_insurance_history
  for select using (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'));
create policy if not exists car_ins_history_admin_insert on car_insurance_history
  for insert with check (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'));

create policy if not exists car_roadtax_admin_select on car_roadtax
  for select using (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'));
create policy if not exists car_roadtax_admin_write on car_roadtax
  for all using (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'))
  with check (exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role = 'admin'));

-- ============================================================================
-- Notes:
-- - car_insurance_master holds only the current/active policy per car.
-- - car_insurance_history stores all historical policies.
-- - car_roadtax can hold current and historical road tax records.
-- - Adjust fuel/vehicle_type/status enums as needed later.
-- ============================================================================

