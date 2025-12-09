import { supabase } from '@/lib/supabaseClient'

export type VehicleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface VehicleRequestSummary {
  id: string
  staffId: string | null
  staffName: string | null
  department: string | null
  purpose: string
  destination: string | null
  startDateTime: string
  endDateTime: string
  vehicleType: string | null
  driverRequired: boolean
  status: VehicleRequestStatus
  createdAt: string
}

export interface VehicleRequestInput {
  staffId: string
  purpose: string
  destination: string
  startDateTime: string
  endDateTime: string
  vehicleType: string
  driverRequired: boolean
  passengerCount?: number
  teamMembers?: string
  remarks?: string
  travelNo?: string
}

// NOTE:
// This service assumes you have a Supabase table or view named `vehicle_requests_view`
// with at least the columns used below. You can adjust the select() shape to match
// your actual schema.

export async function fetchAllVehicleRequests(): Promise<VehicleRequestSummary[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vehicle_requests_view')
    .select(`
      id,
      staff_id,
      staff_name,
      staff_short_name,
      purpose,
      destination,
      start_datetime,
      end_datetime,
      vehicle_type,
      driver_required,
      status,
      department,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('Error fetching vehicle requests:', error)
    return []
  }

  return (data as any[]).map((row) => ({
    id: row.id,
    staffId: row.staff_id ?? null,
    staffName: row.staff_name || row.staff_short_name || null,
    department: row.department || null,
    purpose: row.purpose,
    destination: row.destination ?? null,
    startDateTime: row.start_datetime,
    endDateTime: row.end_datetime,
    vehicleType: row.vehicle_type ?? null,
    driverRequired: row.driver_required ?? false,
    status: (row.status as VehicleRequestStatus) ?? 'PENDING',
    createdAt: row.created_at,
  }))
}

export async function createVehicleRequest(
  input: VehicleRequestInput
): Promise<{ error?: Error }> {
  if (!supabase) {
    return { error: new Error('Supabase is not configured') }
  }

  const { error } = await supabase.from('vehicle_requests').insert({
    staff_id: input.staffId,
    purpose: input.purpose,
    destination: input.destination,
    start_datetime: input.startDateTime,
    end_datetime: input.endDateTime,
    vehicle_type: input.vehicleType,
    driver_required: input.driverRequired,
    passenger_count: input.passengerCount ?? null,
    team_members: input.teamMembers ?? null,
    remarks: input.remarks ?? null,
    travel_no: input.travelNo ?? null,
  })

  if (error) {
    return { error: new Error(error.message) }
  }

  return {}
}

export async function updateVehicleRequestStatus(
  id: string,
  status: VehicleRequestStatus
): Promise<{ error?: Error }> {
  if (!supabase) {
    return { error: new Error('Supabase is not configured') }
  }

  const { error } = await supabase
    .from('vehicle_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { error: new Error(error.message) }
  }

  return {}
}

