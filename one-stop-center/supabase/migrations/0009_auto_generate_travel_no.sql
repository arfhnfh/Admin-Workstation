-- ===== AUTO-GENERATE TRAVEL NO ============================================

-- Function to generate travel_no format: TR-YYYYMMDD-XXX
-- Example: TR-20250115-001
create or replace function generate_travel_no()
returns text as $$
declare
  today_date text;
  sequence_num int;
  travel_no_value text;
begin
  -- Get today's date in YYYYMMDD format
  today_date := to_char(current_date, 'YYYYMMDD');
  
  -- Get the next sequence number for today
  -- Count how many travel requests were created today with travel_no
  select coalesce(max(
    case 
      when travel_no ~ ('^TR-' || today_date || '-(\d+)$') 
      then (regexp_match(travel_no, '(\d+)$'))[1]::int
      else 0
    end
  ), 0) + 1
  into sequence_num
  from travel_requests
  where travel_no is not null
    and travel_no like 'TR-' || today_date || '-%';
  
  -- Format: TR-YYYYMMDD-XXX (with leading zeros)
  travel_no_value := 'TR-' || today_date || '-' || lpad(sequence_num::text, 3, '0');
  
  return travel_no_value;
end;
$$ language plpgsql;

-- Trigger function to auto-generate travel_no when status changes to APPROVED
create or replace function auto_generate_travel_no_on_approval()
returns trigger as $$
begin
  -- Only generate travel_no if status is APPROVED and travel_no is null
  if new.status = 'APPROVED' and (new.travel_no is null or new.travel_no = '') then
    new.travel_no := generate_travel_no();
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Create trigger on travel_requests table
drop trigger if exists trigger_auto_generate_travel_no on travel_requests;
create trigger trigger_auto_generate_travel_no
  before insert or update on travel_requests
  for each row
  execute function auto_generate_travel_no_on_approval();

-- Optional: Backfill existing APPROVED travel requests that don't have travel_no
-- Uncomment and run this if you have existing approved requests that need travel_no
/*
update travel_requests
set travel_no = generate_travel_no()
where status = 'APPROVED' 
  and (travel_no is null or travel_no = '');
*/

