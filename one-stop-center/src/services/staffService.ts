import { supabase } from '@/lib/supabaseClient'
import type { StaffProfile } from '@/types/staff'

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

// Create empty profile template
function createEmptyProfile(userId: string, email: string): StaffProfile {
  return {
    id: userId,
    name: '',
    fullName: '',
    icNo: '',
    gender: 'MALE',
    dob: null,
    age: 0,
    phone: '',
    maritalStatus: '',
    nationality: 'MALAYSIAN',
    work: {
      email,
      location: '',
      department: '',
      position: '',
      employeeNo: '',
      jobGrade: '',
      reportTo: '',
      role: 'staff',
      status: 'ACTIVE',
    },
    passport: {
      passportNo: null,
      expiryDate: null,
    },
    bank: {
      bankName: '',
      accountNo: '',
    },
    allowance: {
      allowance: false,
      claim: false,
    },
    avatarUrl: undefined,
  }
}

export async function fetchStaffProfile(staffId: string): Promise<StaffProfile | null> {
  if (!supabase) {
    return null
  }

  let query = supabase.from('staff_view').select('*').limit(1)

  if (isUuid(staffId)) {
    query = query.eq('id', staffId)
  } else {
    // Allow friendly URLs by matching the short name (aliased as name in the view)
    query = query.ilike('name', staffId)
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return null
  }

  return data as StaffProfile
}

export async function fetchStaffProfileByAuthId(authUserId: string): Promise<StaffProfile | null> {
  if (!supabase) {
    return null
  }

  // First get staff record by auth_user_id
  const { data: staffData, error: staffError } = await supabase
    .from('staff')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single()

  if (staffError || !staffData) {
    return null
  }

  return fetchStaffProfile(staffData.id)
}

export async function fetchAllStaff(): Promise<StaffProfile[]> {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('staff_view')
    .select('*')
    .order('name', { ascending: true })

  if (error || !data) {
    console.error('Error fetching all staff:', error)
    return []
  }

  // Sort by fullName in JavaScript since the view column is "fullName" (quoted identifier)
  const sorted = (data as StaffProfile[]).sort((a, b) => {
    const nameA = (a.fullName || a.name || '').toLowerCase()
    const nameB = (b.fullName || b.name || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })

  return sorted
}

export async function isUserAdmin(authUserId: string): Promise<boolean> {
  if (!supabase) {
    return false
  }

  const { data, error } = await supabase
    .from('staff')
    .select('role')
    .eq('auth_user_id', authUserId)
    .single()

  if (error || !data) {
    return false
  }

  return data.role === 'admin'
}

export async function saveStaffProfile(profile: StaffProfile, authUserId: string, targetStaffId?: string): Promise<{ error?: Error }> {
  if (!supabase) {
    return { error: new Error('Supabase is not configured') }
  }

  try {
    // Check if current user is admin
    const isAdmin = await isUserAdmin(authUserId)
    
    // Determine which staff record to update
    let staffId: string | undefined
    
    if (targetStaffId && isAdmin) {
      // Admin is updating another staff member's profile
      staffId = targetStaffId
    } else {
      // User is updating their own profile
      const { data: existingStaff } = await supabase
        .from('staff')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single()
      
      staffId = existingStaff?.id
    }

    if (!staffId) {
      // Create new staff record (only if updating own profile, not when admin updates others)
      if (targetStaffId && isAdmin) {
        return { error: new Error('Cannot create staff record for another user. Staff ID must exist.') }
      }
      
      const { data: newStaff, error: staffError } = await supabase
        .from('staff')
        .insert({
          short_name: profile.name,
          full_name: profile.fullName,
          ic_no: profile.icNo || `TEMP_${authUserId.substring(0, 8)}`,
          gender: profile.gender,
          dob: profile.dob,
          nationality: profile.nationality,
          marital_status: profile.maritalStatus,
          role: profile.work.role,
          status: profile.work.status,
          auth_user_id: authUserId,
        })
        .select('id')
        .single()

      if (staffError || !newStaff) {
        return { error: new Error(staffError?.message || 'Failed to create staff record') }
      }

      const newStaffId = newStaff.id

      // Insert contact info
      await supabase.from('staff_contact').insert({
        staff_id: newStaffId,
        email: profile.work.email,
        phone: profile.phone,
        location: profile.work.location,
      })

      // Insert employment info
      await supabase.from('staff_employment').insert({
        staff_id: newStaffId,
        department: profile.work.department,
        position: profile.work.position,
        employee_no: profile.work.employeeNo,
        job_grade: profile.work.jobGrade,
        report_to: profile.work.reportTo,
        allowance: profile.allowance.allowance,
        claim: profile.allowance.claim,
      })

      // Insert passport info
      await supabase.from('staff_passport').insert({
        staff_id: newStaffId,
        passport_no: profile.passport.passportNo,
        expiry_date: profile.passport.expiryDate,
      })

      // Insert bank info
      await supabase.from('staff_bank').insert({
        staff_id: newStaffId,
        bank_name: profile.bank.bankName,
        account_no: profile.bank.accountNo,
      })
    } else {
      // Update existing staff record
      await supabase
        .from('staff')
        .update({
          short_name: profile.name,
          full_name: profile.fullName,
          ic_no: profile.icNo,
          gender: profile.gender,
          dob: profile.dob,
          nationality: profile.nationality,
          marital_status: profile.maritalStatus,
          role: profile.work.role,
          status: profile.work.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', staffId)

      // Update contact info
      await supabase
        .from('staff_contact')
        .update({
          email: profile.work.email,
          phone: profile.phone,
          location: profile.work.location,
          updated_at: new Date().toISOString(),
        })
        .eq('staff_id', staffId)

      // Update employment info
      await supabase
        .from('staff_employment')
        .update({
          department: profile.work.department,
          position: profile.work.position,
          employee_no: profile.work.employeeNo,
          job_grade: profile.work.jobGrade,
          report_to: profile.work.reportTo,
          allowance: profile.allowance.allowance,
          claim: profile.allowance.claim,
          updated_at: new Date().toISOString(),
        })
        .eq('staff_id', staffId)

      // Update passport info
      await supabase
        .from('staff_passport')
        .update({
          passport_no: profile.passport.passportNo,
          expiry_date: profile.passport.expiryDate,
          updated_at: new Date().toISOString(),
        })
        .eq('staff_id', staffId)

      // Update bank info
      await supabase
        .from('staff_bank')
        .update({
          bank_name: profile.bank.bankName,
          account_no: profile.bank.accountNo,
          updated_at: new Date().toISOString(),
        })
        .eq('staff_id', staffId)
    }

    return {}
  } catch (error) {
    return { error: error instanceof Error ? error : new Error('Failed to save profile') }
  }
}

export { createEmptyProfile }
