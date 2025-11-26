import type { LoaderFunctionArgs } from 'react-router-dom'
import { fetchStaffProfile, fetchStaffProfileByAuthId } from '@/services/staffService'
import { supabase } from '@/lib/supabaseClient'

export async function staffProfileLoader({ params }: LoaderFunctionArgs) {
  // If staffId is provided, fetch by staff ID
  if (params.staffId) {
    return fetchStaffProfile(params.staffId)
  }

  // Otherwise, fetch current user's profile
  if (!supabase) {
    return null
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return null
  }

  return fetchStaffProfileByAuthId(session.user.id)
}

