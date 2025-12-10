-- ===== ROOM BOOKING MODULE ===================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ===== ROOMS TABLE ============================================================
-- Master table for available rooms
create table if not exists rooms (
  id uuid not null default uuid_generate_v4(),
  name text not null,
  level text not null check (level = any (array['LEVEL_6'::text, 'LEVEL_5'::text])),
  type text not null unique check (type = any (array['elaiese'::text, 'olivie'::text, 'power-up'::text, 'phenoliv'::text, 'choco'::text, 'delima'::text, 'sauda-ajwa'::text])),
  capacity integer,
  description text,
  status text default 'ACTIVE'::text check (status = any (array['ACTIVE'::text, 'INACTIVE'::text, 'MAINTENANCE'::text])),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint rooms_pkey primary key (id)
);

-- Insert default rooms
insert into rooms (name, level, type, capacity, description) values
  ('Elaiese', 'LEVEL_6', 'elaiese', 20, 'Meeting Room'),
  ('Olivie', 'LEVEL_6', 'olivie', 30, 'Training Room 1'),
  ('PowerUp', 'LEVEL_6', 'power-up', 30, 'Training Room 2'),
  ('Phenoliv', 'LEVEL_6', 'phenoliv', 10, 'Discussion Room'),
  ('Choco', 'LEVEL_5', 'choco', 15, null),
  ('Delima', 'LEVEL_5', 'delima', 15, null),
  ('Sauda & Ajwa', 'LEVEL_5', 'sauda-ajwa', 20, null)
on conflict (type) do nothing;

-- ===== ROOM BOOKINGS TABLE ===================================================
-- Main table for room booking requests
create table if not exists room_bookings (
  id uuid not null default uuid_generate_v4(),
  requestor_id uuid not null,
  requestor_name text not null,
  division text not null,
  request_date date not null default current_date,
  event_name text not null,
  selected_rooms text[] not null check (array_length(selected_rooms, 1) > 0),
  extra_items text,
  room_arrangement text[] check (room_arrangement <@ array['classroom'::text, 'ushape'::text, 'island'::text]),
  
  -- Requestor signature
  requestor_signature_name text,
  requestor_signature_date date,
  
  -- HOD approval
  hod_approval text check (hod_approval = any (array['approved'::text, 'not-approved'::text])),
  hod_name text,
  hod_approval_date date,
  
  -- Facility team
  received_by_name text,
  received_by_date date,
  
  -- Final approval
  final_approval text check (final_approval = any (array['approved'::text, 'not-approved'::text])),
  final_approver_name text,
  final_approval_date date,
  
  -- Status tracking
  status text not null default 'PENDING'::text check (status = any (array['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'COMPLETED'::text, 'CANCELLED'::text])),
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint room_bookings_pkey primary key (id),
  constraint room_bookings_requestor_id_fkey foreign key (requestor_id) references public.staff(id) on delete restrict
);

-- ===== EVENT SCHEDULES TABLE ==================================================
-- Stores individual schedule entries for each booking
create table if not exists event_schedules (
  id uuid not null default uuid_generate_v4(),
  booking_id uuid not null,
  date date not null,
  start_time time not null,
  end_time time not null check (end_time > start_time),
  participants integer not null default 0 check (participants >= 0),
  
  -- Refreshment options
  refreshment_bf_lunch boolean default false,
  refreshment_bf_dinner boolean default false,
  refreshment_atb_lunch boolean default false,
  refreshment_atb_dinner boolean default false,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint event_schedules_pkey primary key (id),
  constraint event_schedules_booking_id_fkey foreign key (booking_id) references public.room_bookings(id) on delete cascade
);

-- ===== BOOKING LOGS TABLE =====================================================
-- Audit trail for all booking actions
create table if not exists booking_logs (
  id uuid not null default uuid_generate_v4(),
  booking_id uuid not null,
  action text not null check (action = any (array['CREATED'::text, 'APPROVED'::text, 'REJECTED'::text, 'UPDATED'::text, 'CANCELLED'::text])),
  performed_by uuid,
  performed_by_name text not null,
  timestamp timestamp with time zone default now(),
  notes text,
  changes jsonb, -- Stores field changes as {field: {old: value, new: value}}
  constraint booking_logs_pkey primary key (id),
  constraint booking_logs_booking_id_fkey foreign key (booking_id) references public.room_bookings(id) on delete cascade,
  constraint booking_logs_performed_by_fkey foreign key (performed_by) references public.staff(id) on delete set null
);

-- ===== INDEXES ================================================================
-- Indexes for better query performance
create index if not exists idx_room_bookings_requestor on room_bookings(requestor_id);
create index if not exists idx_room_bookings_status on room_bookings(status);
create index if not exists idx_room_bookings_request_date on room_bookings(request_date);
create index if not exists idx_event_schedules_booking on event_schedules(booking_id);
create index if not exists idx_event_schedules_date on event_schedules(date);
create index if not exists idx_event_schedules_time_range on event_schedules(date, start_time, end_time);
create index if not exists idx_booking_logs_booking on booking_logs(booking_id);
create index if not exists idx_booking_logs_timestamp on booking_logs(timestamp desc);

-- GIN index for array searches
create index if not exists idx_room_bookings_selected_rooms on room_bookings using gin(selected_rooms);

-- ===== VIEWS ==================================================================
-- View for booking details with schedules
create or replace view room_booking_details as
select 
  rb.id,
  rb.requestor_id,
  rb.requestor_name,
  rb.division,
  rb.request_date,
  rb.event_name,
  rb.selected_rooms,
  rb.extra_items,
  rb.room_arrangement,
  rb.requestor_signature_name,
  rb.requestor_signature_date,
  rb.hod_approval,
  rb.hod_name,
  rb.hod_approval_date,
  rb.received_by_name,
  rb.received_by_date,
  rb.final_approval,
  rb.final_approver_name,
  rb.final_approval_date,
  rb.status,
  rb.created_at,
  rb.updated_at,
  json_agg(
    json_build_object(
      'id', es.id,
      'date', es.date,
      'startTime', es.start_time::text,
      'endTime', es.end_time::text,
      'participants', es.participants,
      'refreshment', json_build_object(
        'bf', json_build_object(
          'lunch', es.refreshment_bf_lunch,
          'dinner', es.refreshment_bf_dinner
        ),
        'atb', json_build_object(
          'lunch', es.refreshment_atb_lunch,
          'dinner', es.refreshment_atb_dinner
        )
      )
    ) order by es.date, es.start_time
  ) filter (where es.id is not null) as schedules
from room_bookings rb
left join event_schedules es on es.booking_id = rb.id
group by rb.id;

-- View for room availability by date
create or replace view room_availability_by_date as
select 
  r.id as room_id,
  r.name as room_name,
  r.level,
  r.type,
  r.capacity,
  r.description,
  es.date,
  count(rb.id) as booking_count,
  array_agg(distinct rb.id) as booking_ids,
  bool_or(rb.status in ('APPROVED', 'PENDING')) as is_booked
from rooms r
cross join (
  select distinct date from event_schedules
  union
  select current_date as date
) es
left join event_schedules es2 on es2.date = es.date
left join room_bookings rb on 
  rb.id = es2.booking_id 
  and r.type = any(rb.selected_rooms)
  and rb.status in ('APPROVED', 'PENDING')
group by r.id, r.name, r.level, r.type, r.capacity, r.description, es.date;

-- ===== FUNCTIONS ==============================================================
-- Function to check room availability for a specific date and time range
create or replace function check_room_availability(
  p_room_type text,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_exclude_booking_id uuid default null
)
returns boolean
language plpgsql
as $$
declare
  conflict_count integer;
begin
  -- Check for overlapping bookings
  select count(*)
  into conflict_count
  from event_schedules es
  join room_bookings rb on rb.id = es.booking_id
  where rb.status in ('APPROVED', 'PENDING')
    and p_room_type = any(rb.selected_rooms)
    and es.date = p_date
    and (rb.id != p_exclude_booking_id or p_exclude_booking_id is null)
    and (
      -- Time overlap conditions
      (es.start_time <= p_start_time and es.end_time > p_start_time) or
      (es.start_time < p_end_time and es.end_time >= p_end_time) or
      (es.start_time >= p_start_time and es.end_time <= p_end_time)
    );
  
  return conflict_count = 0;
end;
$$;

-- Function to get room availability summary for a date
create or replace function get_room_availability_by_date(p_date date)
returns table (
  room_type text,
  room_name text,
  is_available boolean,
  booking_count bigint
)
language plpgsql
as $$
begin
  return query
  select 
    r.type::text as room_type,
    r.name::text as room_name,
    not exists(
      select 1
      from event_schedules es
      join room_bookings rb on rb.id = es.booking_id
      where rb.status in ('APPROVED', 'PENDING')
        and r.type = any(rb.selected_rooms)
        and es.date = p_date
    ) as is_available,
    count(rb.id) as booking_count
  from rooms r
  left join event_schedules es on es.date = p_date
  left join room_bookings rb on 
    rb.id = es.booking_id 
    and r.type = any(rb.selected_rooms)
    and rb.status in ('APPROVED', 'PENDING')
  where r.status = 'ACTIVE'
  group by r.type, r.name
  order by r.level, r.name;
end;
$$;

-- Function to create booking log entry
create or replace function create_booking_log(
  p_booking_id uuid,
  p_action text,
  p_performed_by uuid,
  p_performed_by_name text,
  p_notes text default null,
  p_changes jsonb default null
)
returns uuid
language plpgsql
as $$
declare
  log_id uuid;
begin
  insert into booking_logs (
    booking_id,
    action,
    performed_by,
    performed_by_name,
    notes,
    changes
  ) values (
    p_booking_id,
    p_action,
    p_performed_by,
    p_performed_by_name,
    p_notes,
    p_changes
  )
  returning id into log_id;
  
  return log_id;
end;
$$;

-- Trigger function to automatically create log on booking creation
create or replace function log_booking_creation()
returns trigger
language plpgsql
as $$
begin
  perform create_booking_log(
    new.id,
    'CREATED',
    new.requestor_id,
    new.requestor_name,
    'Booking request created'
  );
  return new;
end;
$$;

-- Trigger function to log status changes
create or replace function log_booking_status_change()
returns trigger
language plpgsql
as $$
declare
  changes_json jsonb;
begin
  if old.status != new.status then
    changes_json := jsonb_build_object(
      'status', jsonb_build_object(
        'old', old.status,
        'new', new.status
      )
    );
    
    perform create_booking_log(
      new.id,
      case 
        when new.status = 'APPROVED' then 'APPROVED'
        when new.status = 'REJECTED' then 'REJECTED'
        when new.status = 'CANCELLED' then 'CANCELLED'
        else 'UPDATED'
      end,
      new.requestor_id, -- This should be updated to actual approver ID in application
      coalesce(new.final_approver_name, new.hod_name, new.requestor_name),
      'Status changed',
      changes_json
    );
  end if;
  
  return new;
end;
$$;

-- Create triggers
create trigger trigger_log_booking_creation
  after insert on room_bookings
  for each row
  execute function log_booking_creation();

create trigger trigger_log_booking_status_change
  after update on room_bookings
  for each row
  execute function log_booking_status_change();

-- Trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trigger_update_room_bookings_updated_at
  before update on room_bookings
  for each row
  execute function update_updated_at_column();

create trigger trigger_update_event_schedules_updated_at
  before update on event_schedules
  for each row
  execute function update_updated_at_column();

create trigger trigger_update_rooms_updated_at
  before update on rooms
  for each row
  execute function update_updated_at_column();

-- ===== ROW LEVEL SECURITY (RLS) ==============================================
-- Enable RLS
alter table rooms enable row level security;
alter table room_bookings enable row level security;
alter table event_schedules enable row level security;
alter table booking_logs enable row level security;

-- Rooms: Everyone can read active rooms
create policy "Rooms are viewable by everyone"
  on rooms for select
  using (status = 'ACTIVE');

-- Room Bookings: Staff can view their own bookings, admins can view all
create policy "Staff can view their own bookings"
  on room_bookings for select
  using (
    auth.uid() in (select auth_user_id from staff where id = requestor_id)
    or
    exists (select 1 from staff where auth_user_id = auth.uid() and role = 'admin')
  );

-- Room Bookings: Staff can create bookings
create policy "Staff can create bookings"
  on room_bookings for insert
  with check (
    auth.uid() in (select auth_user_id from staff where id = requestor_id)
  );

-- Room Bookings: Staff can update their own pending bookings, admins can update any
create policy "Staff can update own pending bookings"
  on room_bookings for update
  using (
    (
      auth.uid() in (select auth_user_id from staff where id = requestor_id)
      and status = 'PENDING'
    )
    or
    exists (select 1 from staff where auth_user_id = auth.uid() and role = 'admin')
  );

-- Event Schedules: Follow parent booking policies
create policy "Event schedules follow booking policies"
  on event_schedules for all
  using (
    exists (
      select 1 from room_bookings rb
      where rb.id = event_schedules.booking_id
      and (
        auth.uid() in (select auth_user_id from staff where id = rb.requestor_id)
        or
        exists (select 1 from staff where auth_user_id = auth.uid() and role = 'admin')
      )
    )
  );

-- Booking Logs: Follow parent booking policies
create policy "Booking logs follow booking policies"
  on booking_logs for all
  using (
    exists (
      select 1 from room_bookings rb
      where rb.id = booking_logs.booking_id
      and (
        auth.uid() in (select auth_user_id from staff where id = rb.requestor_id)
        or
        exists (select 1 from staff where auth_user_id = auth.uid() and role = 'admin')
      )
    )
  );

-- ===== COMMENTS ===============================================================
comment on table rooms is 'Master table for available meeting/training rooms';
comment on table room_bookings is 'Main table for room booking requests';
comment on table event_schedules is 'Individual schedule entries for each booking';
comment on table booking_logs is 'Audit trail for all booking actions and changes';
comment on function check_room_availability is 'Checks if a room is available for a specific date and time range';
comment on function get_room_availability_by_date is 'Returns availability summary for all rooms on a specific date';
comment on function create_booking_log is 'Creates an audit log entry for booking actions';
