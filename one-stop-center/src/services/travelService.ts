import { supabase } from '@/lib/supabaseClient'

export type TravelRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface TravelRequestSummary {
  id: string
  staffId: string | null
  staffName: string | null
  department: string | null
  destination: string
  reason: string | null
  startDateTime: string
  endDateTime: string
  status: TravelRequestStatus
  totalMealAllowance?: number | null
  createdAt: string
}

// NOTE:
// This service assumes you have a Supabase table or view named `travel_requests_view`
// with at least the columns used below. You can adjust the select() shape to match
// your actual schema.

export async function fetchAllTravelRequests(): Promise<TravelRequestSummary[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('travel_requests_view')
    .select(`
      id,
      staff_id,
      staff_name,
      staff_short_name,
      destination,
      reason,
      start_datetime,
      end_datetime,
      status,
      total_meal_allowance,
      department,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('Error fetching travel requests:', error)
    return []
  }

  return (data as any[]).map((row) => ({
    id: row.id,
    staffId: row.staff_id ?? null,
    staffName: row.staff_name || row.staff_short_name || null,
    department: row.department || null,
    destination: row.destination,
    reason: row.reason ?? null,
    startDateTime: row.start_datetime,
    endDateTime: row.end_datetime,
    status: (row.status as TravelRequestStatus) ?? 'PENDING',
    totalMealAllowance: row.total_meal_allowance ?? null,
    createdAt: row.created_at,
  }))
}

export async function createTravelRequest(input: {
  staffId: string
  destination: string
  reason: string
  startDateTime: string
  endDateTime: string
  totalMealAllowance?: number
}): Promise<{ error?: Error }> {
  if (!supabase) {
    return { error: new Error('Supabase is not configured') }
  }

  const { error } = await supabase.from('travel_requests').insert({
    staff_id: input.staffId,
    destination: input.destination,
    reason: input.reason,
    start_datetime: input.startDateTime,
    end_datetime: input.endDateTime,
    total_meal_allowance: input.totalMealAllowance ?? null,
  })

  if (error) {
    return { error: new Error(error.message) }
  }

  return {}
}

export async function updateTravelRequestStatus(
  id: string,
  status: TravelRequestStatus
): Promise<{ error?: Error }> {
  if (!supabase) {
    return { error: new Error('Supabase is not configured') }
  }

  // If you only have a base `travel_requests` table, update that here.
  const { error } = await supabase
    .from('travel_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { error: new Error(error.message) }
  }

  return {}
}


