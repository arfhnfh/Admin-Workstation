-- Seed: Single dummy car with ownership, current insurance, and road tax
-- Run this after the car master tables/migration are in place.

-- Cleanup by unique keys to avoid duplicates on rerun
delete from car_roadtax where car_id in (select id from car_master where plate_number = 'ABC 1234');
delete from car_insurance_master where car_id in (select id from car_master where plate_number = 'ABC 1234');
delete from car_ownership where car_id in (select id from car_master where plate_number = 'ABC 1234');
delete from car_master where plate_number = 'ABC 1234' or vehicle_id = 'VEH-000123';

-- Insert core vehicle
with inserted_car as (
  insert into car_master (
    vehicle_id,
    plate_number,
    vehicle_type,
    brand,
    model,
    variant,
    year,
    engine_capacity,
    fuel,
    chassis_no,
    engine_no,
    status
  )
  values (
    'VEH-000123',
    'ABC 1234',
    'Car',
    'Toyota',
    'Corolla Altis',
    '1.8G',
    2021,
    1798,
    'Petrol',
    'JTDBR32E402345678',
    '2ZR1234567',
    'ACTIVE'
  )
  returning id
)
-- Insert ownership (1:1)
insert into car_ownership (
  car_id,
  registered_owner,
  subsidiary,
  registration_date,
  ownership_type,
  financier,
  hp_end_date
)
select
  id,
  'Aafiyat Holdings Sdn. Bhd.',
  'Aafiyat Marketing Sdn. Bhd.',
  '2021-06-15',
  'Hire Purchase',
  'Maybank Islamic',
  '2026-06-30'
from inserted_car;

-- Insert current insurance master
with c as (select id from car_master where plate_number = 'ABC 1234')
insert into car_insurance_master (
  car_id,
  insurer,
  broker,
  policy_no,
  coverage,
  coverage_start,
  coverage_end,
  sum_insured,
  premium,
  ncd,
  windscreen,
  endorsement
)
select
  id,
  'Takaful Ikhlas',
  'IGSB Brokers Sdn. Bhd.',
  'TIK/MC/2024/001234',
  'Comprehensive',
  '2024-08-01',
  '2025-07-31',
  65000,
  1850,
  55,
  true,
  'Flood cover included'
from c;

-- Insert road tax
with c as (select id from car_master where plate_number = 'ABC 1234')
insert into car_roadtax (
  car_id,
  period_start,
  period_end,
  amount,
  roadtax_type
)
select
  id,
  '2024-08-01',
  '2025-07-31',
  90,
  'Company'
from c;

