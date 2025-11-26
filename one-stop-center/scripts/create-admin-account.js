/**
 * Script to create admin account in Supabase
 * 
 * Usage:
 * 1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment
 * 2. Run: node scripts/create-admin-account.js
 * 
 * Or use Supabase Dashboard:
 * 1. Go to Authentication > Users > Add User
 * 2. Email: Admin@aafiyatgroup.com
 * 3. Password: AafiyatTech@2025
 * 4. Auto Confirm: Yes
 * 5. Then run the SQL in migrations/0004_create_admin_account.sql
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  console.error('Usage: SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/create-admin-account.js')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAdminAccount() {
  try {
    console.log('Creating admin account...')

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@aafiyatgroup.com',
      password: 'AafiyatTech@2025',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('Admin user already exists, fetching existing user...')
        const { data: existingUser } = await supabase.auth.admin.listUsers()
        const adminUser = existingUser.users.find(u => u.email === 'admin@aafiyatgroup.com')
        if (!adminUser) {
          throw new Error('Admin user not found')
        }
        authData.user = adminUser
      } else {
        throw authError
      }
    }

    if (!authData.user) {
      throw new Error('Failed to create or find admin user')
    }

    console.log('Auth user created/found:', authData.user.id)

    // Check if staff record exists
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('id')
      .eq('auth_user_id', authData.user.id)
      .single()

    if (existingStaff) {
      console.log('Staff record already exists for this user')
      return
    }

    // Create staff record
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .insert({
        short_name: 'Admin',
        full_name: 'ADMIN USER',
        ic_no: 'ADMIN001',
        gender: 'MALE',
        nationality: 'MALAYSIAN',
        role: 'admin',
        status: 'ACTIVE',
        auth_user_id: authData.user.id,
      })
      .select('id')
      .single()

    if (staffError) {
      throw staffError
    }

    console.log('Staff record created:', staffData.id)

    // Create contact record
    const { error: contactError } = await supabase.from('staff_contact').insert({
      staff_id: staffData.id,
      email: 'admin@aafiyatgroup.com',
      phone: '',
      location: 'Head Office',
    })

    if (contactError) {
      throw contactError
    }

    // Create employment record
    const { error: employmentError } = await supabase.from('staff_employment').insert({
      staff_id: staffData.id,
      department: 'Administration',
      position: 'System Administrator',
      employee_no: 'ADMIN001',
      job_grade: 'A1',
      allowance: true,
      claim: true,
    })

    if (employmentError) {
      throw employmentError
    }

    console.log('✅ Admin account created successfully!')
    console.log('Email: Admin@aafiyatgroup.com')
    console.log('Password: AafiyatTech@2025')
    console.log('Staff ID:', staffData.id)
  } catch (error) {
    console.error('Error creating admin account:', error.message)
    process.exit(1)
  }
}

createAdminAccount()

