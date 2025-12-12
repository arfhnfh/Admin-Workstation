import { supabase } from '@/lib/supabaseClient'

export type CarStatus = 'ACTIVE' | 'INACTIVE' | 'DISPOSED'

export interface CarCore {
  id: string
  vehicleId: string
  plateNumber: string
  vehicleType: string
  brand: string
  model: string
  variant?: string | null
  year?: number | null
  engineCapacity?: number | null
  fuel?: string | null
  chassisNo?: string | null
  engineNo?: string | null
  status: CarStatus
}

export interface CarOwnership {
  registeredOwner?: string | null
  subsidiary?: string | null
  registrationDate?: string | null
  ownershipType?: string | null
  financier?: string | null
  hpEndDate?: string | null
}

export interface CarInsurance {
  insurer?: string | null
  broker?: string | null
  policyNo?: string | null
  coverage?: string | null
  coverageStart?: string | null
  coverageEnd?: string | null
  sumInsured?: number | null
  premium?: number | null
  ncd?: number | null
  windscreen?: boolean | null
  endorsement?: string | null
}

export interface CarRoadTax {
  periodStart?: string | null
  periodEnd?: string | null
  amount?: number | null
  roadtaxType?: string | null
}

export interface CarSummary {
  core: CarCore
  ownership?: CarOwnership
  insurance?: CarInsurance
  roadtax?: CarRoadTax
}

export interface CarUpsertInput {
  core: Omit<CarCore, 'id'>
  ownership?: CarOwnership
  insurance?: CarInsurance
  roadtax?: CarRoadTax
}

export async function fetchCars(): Promise<CarSummary[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('car_master')
    .select(
      `
      id,
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
      status,
      car_ownership (
        registered_owner,
        subsidiary,
        registration_date,
        ownership_type,
        financier,
        hp_end_date
      ),
      car_insurance_master (
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
      ),
      car_roadtax (
        period_start,
        period_end,
        amount,
        roadtax_type
      )
    `
    )
    .order('updated_at', { ascending: false })

  if (error || !data) {
    console.error('Error fetching cars:', error)
    return []
  }

  return (data as any[]).map((row) => ({
    core: {
      id: row.id,
      vehicleId: row.vehicle_id,
      plateNumber: row.plate_number,
      vehicleType: row.vehicle_type,
      brand: row.brand,
      model: row.model,
      variant: row.variant ?? null,
      year: row.year ?? null,
      engineCapacity: row.engine_capacity ?? null,
      fuel: row.fuel ?? null,
      chassisNo: row.chassis_no ?? null,
      engineNo: row.engine_no ?? null,
      status: row.status as CarStatus,
    },
    ownership: row.car_ownership?.[0]
      ? {
          registeredOwner: row.car_ownership[0].registered_owner ?? null,
          subsidiary: row.car_ownership[0].subsidiary ?? null,
          registrationDate: row.car_ownership[0].registration_date ?? null,
          ownershipType: row.car_ownership[0].ownership_type ?? null,
          financier: row.car_ownership[0].financier ?? null,
          hpEndDate: row.car_ownership[0].hp_end_date ?? null,
        }
      : undefined,
    insurance: row.car_insurance_master?.[0]
      ? {
          insurer: row.car_insurance_master[0].insurer ?? null,
          broker: row.car_insurance_master[0].broker ?? null,
          policyNo: row.car_insurance_master[0].policy_no ?? null,
          coverage: row.car_insurance_master[0].coverage ?? null,
          coverageStart: row.car_insurance_master[0].coverage_start ?? null,
          coverageEnd: row.car_insurance_master[0].coverage_end ?? null,
          sumInsured: row.car_insurance_master[0].sum_insured ?? null,
          premium: row.car_insurance_master[0].premium ?? null,
          ncd: row.car_insurance_master[0].ncd ?? null,
          windscreen: row.car_insurance_master[0].windscreen ?? null,
          endorsement: row.car_insurance_master[0].endorsement ?? null,
        }
      : undefined,
    roadtax: row.car_roadtax?.[0]
      ? {
          periodStart: row.car_roadtax[0].period_start ?? null,
          periodEnd: row.car_roadtax[0].period_end ?? null,
          amount: row.car_roadtax[0].amount ?? null,
          roadtaxType: row.car_roadtax[0].roadtax_type ?? null,
        }
      : undefined,
  }))
}

export async function createCar(input: CarUpsertInput): Promise<{ error?: Error }> {
  if (!supabase) return { error: new Error('Supabase not configured') }
  const { core, ownership, insurance, roadtax } = input

  const { data: carInsert, error: carError } = await supabase
    .from('car_master')
    .insert({
      vehicle_id: core.vehicleId,
      plate_number: core.plateNumber,
      vehicle_type: core.vehicleType,
      brand: core.brand,
      model: core.model,
      variant: core.variant ?? null,
      year: core.year ?? null,
      engine_capacity: core.engineCapacity ?? null,
      fuel: core.fuel ?? null,
      chassis_no: core.chassisNo ?? null,
      engine_no: core.engineNo ?? null,
      status: core.status ?? 'ACTIVE',
    })
    .select('id')
    .single()

  if (carError || !carInsert) return { error: new Error(carError?.message || 'Failed to create car') }
  const carId = carInsert.id as string

  // ownership (1:1)
  if (ownership) {
    const { error } = await supabase.from('car_ownership').upsert({
      car_id: carId,
      registered_owner: ownership.registeredOwner ?? null,
      subsidiary: ownership.subsidiary ?? null,
      registration_date: ownership.registrationDate ?? null,
      ownership_type: ownership.ownershipType ?? null,
      financier: ownership.financier ?? null,
      hp_end_date: ownership.hpEndDate ?? null,
    })
    if (error) return { error: new Error(error.message) }
  }

  // insurance master (current)
  if (insurance) {
    // ensure single row per car
    await supabase.from('car_insurance_master').delete().eq('car_id', carId)
    const { error } = await supabase.from('car_insurance_master').insert({
      car_id: carId,
      insurer: insurance.insurer ?? null,
      broker: insurance.broker ?? null,
      policy_no: insurance.policyNo ?? null,
      coverage: insurance.coverage ?? null,
      coverage_start: insurance.coverageStart ?? null,
      coverage_end: insurance.coverageEnd ?? null,
      sum_insured: insurance.sumInsured ?? null,
      premium: insurance.premium ?? null,
      ncd: insurance.ncd ?? null,
      windscreen: insurance.windscreen ?? null,
      endorsement: insurance.endorsement ?? null,
    })
    if (error) return { error: new Error(error.message) }
  }

  // roadtax (latest)
  if (roadtax) {
    await supabase.from('car_roadtax').delete().eq('car_id', carId)
    const { error } = await supabase.from('car_roadtax').insert({
      car_id: carId,
      period_start: roadtax.periodStart ?? null,
      period_end: roadtax.periodEnd ?? null,
      amount: roadtax.amount ?? null,
      roadtax_type: roadtax.roadtaxType ?? null,
    })
    if (error) return { error: new Error(error.message) }
  }

  return {}
}

export async function updateCar(carId: string, input: CarUpsertInput): Promise<{ error?: Error }> {
  if (!supabase) return { error: new Error('Supabase not configured') }
  const { core, ownership, insurance, roadtax } = input

  const { error: carError } = await supabase
    .from('car_master')
    .update({
      vehicle_id: core.vehicleId,
      plate_number: core.plateNumber,
      vehicle_type: core.vehicleType,
      brand: core.brand,
      model: core.model,
      variant: core.variant ?? null,
      year: core.year ?? null,
      engine_capacity: core.engineCapacity ?? null,
      fuel: core.fuel ?? null,
      chassis_no: core.chassisNo ?? null,
      engine_no: core.engineNo ?? null,
      status: core.status ?? 'ACTIVE',
      updated_at: new Date().toISOString(),
    })
    .eq('id', carId)

  if (carError) return { error: new Error(carError.message) }

  if (ownership) {
    const { error } = await supabase.from('car_ownership').upsert({
      car_id: carId,
      registered_owner: ownership.registeredOwner ?? null,
      subsidiary: ownership.subsidiary ?? null,
      registration_date: ownership.registrationDate ?? null,
      ownership_type: ownership.ownershipType ?? null,
      financier: ownership.financier ?? null,
      hp_end_date: ownership.hpEndDate ?? null,
    })
    if (error) return { error: new Error(error.message) }
  }

  if (insurance) {
    await supabase.from('car_insurance_master').delete().eq('car_id', carId)
    const { error } = await supabase.from('car_insurance_master').insert({
      car_id: carId,
      insurer: insurance.insurer ?? null,
      broker: insurance.broker ?? null,
      policy_no: insurance.policyNo ?? null,
      coverage: insurance.coverage ?? null,
      coverage_start: insurance.coverageStart ?? null,
      coverage_end: insurance.coverageEnd ?? null,
      sum_insured: insurance.sumInsured ?? null,
      premium: insurance.premium ?? null,
      ncd: insurance.ncd ?? null,
      windscreen: insurance.windscreen ?? null,
      endorsement: insurance.endorsement ?? null,
    })
    if (error) return { error: new Error(error.message) }
  }

  if (roadtax) {
    await supabase.from('car_roadtax').delete().eq('car_id', carId)
    const { error } = await supabase.from('car_roadtax').insert({
      car_id: carId,
      period_start: roadtax.periodStart ?? null,
      period_end: roadtax.periodEnd ?? null,
      amount: roadtax.amount ?? null,
      roadtax_type: roadtax.roadtaxType ?? null,
    })
    if (error) return { error: new Error(error.message) }
  }

  return {}
}

export async function deleteCar(carId: string): Promise<{ error?: Error }> {
  if (!supabase) return { error: new Error('Supabase not configured') }
  const { error } = await supabase.from('car_master').delete().eq('id', carId)
  if (error) return { error: new Error(error.message) }
  return {}
}


