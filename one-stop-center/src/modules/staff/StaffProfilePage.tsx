import { useState, useEffect } from 'react'
import { useNavigation, useLoaderData, useRevalidator } from 'react-router-dom'
import { BadgeCheck, CalendarDays, Mail, Phone, UserRound, Save, Edit2 } from 'lucide-react'
import type { StaffProfile } from '@/types/staff'
import { RoleToggle } from '@/components/ui/RoleToggle'
import { useAuthContext } from '@/hooks/useAuthContext'
import { fetchStaffProfileByAuthId, saveStaffProfile, createEmptyProfile } from '@/services/staffService'

const labelClass = 'text-xs uppercase tracking-[0.2em] text-text-muted'

function EditableField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  options,
}: {
  label: string
  value: string | number | null
  onChange: (value: string) => void
  type?: string
  required?: boolean
  options?: string[]
}) {
  const displayValue = value ?? ''
  
  if (options) {
    return (
      <div className="flex flex-col gap-1">
        <span className={labelClass}>{label}</span>
        <select
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="rounded-xl border border-card-border bg-white px-3 py-2 text-sm font-semibold focus:border-brand.violet focus:outline-none"
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (type === 'date') {
    return (
      <div className="flex flex-col gap-1">
        <span className={labelClass}>{label}</span>
        <input
          type="date"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="rounded-xl border border-card-border bg-white px-3 py-2 text-sm font-semibold focus:border-brand.violet focus:outline-none"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="rounded-xl border border-card-border bg-white px-3 py-2 text-sm font-semibold focus:border-brand.violet focus:outline-none"
      />
    </div>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card backdrop-blur">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-charcoal">{title}</h3>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}

export default function StaffProfilePage() {
  const initialProfile = useLoaderData() as StaffProfile | null
  const navigation = useNavigation()
  const revalidator = useRevalidator()
  const { user } = useAuthContext()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [profile, setProfile] = useState<StaffProfile | null>(initialProfile)

  const isLoading = navigation.state === 'loading'

  // Load profile if not in loader data
  useEffect(() => {
    if (!profile && user) {
      fetchStaffProfileByAuthId(user.id).then((data) => {
        if (data) {
          setProfile(data)
        } else {
          // Create empty profile for new user
          setProfile(createEmptyProfile(user.id, user.email))
          setIsEditing(true)
        }
      })
    }
  }, [user, profile])

  if (!profile || isLoading) {
    return (
      <div className="flex h-full min-h-[70vh] items-center justify-center rounded-3xl bg-white/70 shadow-card">
        <div className="animate-pulse text-text-muted">Loading staff profile…</div>
      </div>
    )
  }

  const handleSave = async () => {
    if (!user || !profile) return

    setIsSaving(true)
    setSaveMessage(null)

    const { error } = await saveStaffProfile(profile, user.id)
    
    if (error) {
      setSaveMessage(`Error: ${error.message}`)
    } else {
      setSaveMessage('Profile saved successfully!')
      setIsEditing(false)
      revalidator.revalidate()
    }

    setIsSaving(false)
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const updateProfile = (updates: Partial<StaffProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const updateWork = (updates: Partial<StaffProfile['work']>) => {
    setProfile((prev) => (prev ? { ...prev, work: { ...prev.work, ...updates } } : null))
  }

  const updatePassport = (updates: Partial<StaffProfile['passport']>) => {
    setProfile((prev) => (prev ? { ...prev, passport: { ...prev.passport, ...updates } } : null))
  }

  const updateBank = (updates: Partial<StaffProfile['bank']>) => {
    setProfile((prev) => (prev ? { ...prev, bank: { ...prev.bank, ...updates } } : null))
  }

  const updateAllowance = (updates: Partial<StaffProfile['allowance']>) => {
    setProfile((prev) => (prev ? { ...prev, allowance: { ...prev.allowance, ...updates } } : null))
  }

  // Calculate age from DOB
  const calculateAge = (dob: string | null): number => {
    if (!dob) return 0
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleDobChange = (dob: string) => {
    updateProfile({ dob, age: calculateAge(dob) })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 p-6 shadow-card">
        <div>
          <nav className="text-sm text-text-muted">
            Home / Admin / Staff / <span className="text-brand.violet">View</span>
          </nav>
          <h1 className="mt-2 text-3xl font-semibold text-charcoal">
            {isEditing ? 'Edit Staff Profile' : 'View Staff'}
          </h1>
          <p className="text-sm text-text-muted">
            {isEditing ? 'Update your profile information' : `Comprehensive profile for ${profile.fullName || 'New User'}`}
          </p>
        </div>
        <RoleToggle />
      </div>

      {saveMessage && (
        <div className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold ${
          saveMessage.includes('Error') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {saveMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-3xl border border-card-border bg-white/90 p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-3xl bg-brand.violet/10 flex items-center justify-center">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="h-20 w-20 rounded-3xl object-cover" />
              ) : (
                <UserRound className="h-10 w-10 text-brand.violet" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-muted">Personal Info</p>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateProfile({ name: e.target.value })}
                    placeholder="Short Name"
                    className="mt-1 w-full rounded-xl border border-card-border bg-white px-3 py-2 text-lg font-semibold focus:border-brand.violet focus:outline-none"
                  />
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => updateProfile({ fullName: e.target.value })}
                    placeholder="Full Name"
                    className="mt-1 w-full rounded-xl border border-card-border bg-white px-2 py-1 text-sm text-text-muted focus:border-brand.violet focus:outline-none"
                  />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold">{profile.name || 'Not set'}</h2>
                  <p className="text-sm text-text-muted">{profile.fullName || 'Not set'}</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {isEditing ? (
              <>
                <EditableField label="IC NO" value={profile.icNo} onChange={(v) => updateProfile({ icNo: v })} required />
                <EditableField 
                  label="Gender" 
                  value={profile.gender} 
                  onChange={(v) => updateProfile({ gender: v as 'MALE' | 'FEMALE' })} 
                  options={['MALE', 'FEMALE']}
                />
                <EditableField label="DOB" value={profile.dob} onChange={handleDobChange} type="date" />
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Age</span>
                  <span className="font-semibold">{profile.age || 0}</span>
                </div>
                <EditableField label="Phone" value={profile.phone} onChange={(v) => updateProfile({ phone: v })} />
                <EditableField label="Marital Status" value={profile.maritalStatus} onChange={(v) => updateProfile({ maritalStatus: v })} />
                <EditableField label="Nationality" value={profile.nationality} onChange={(v) => updateProfile({ nationality: v })} />
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>IC NO</span>
                  <span className="font-semibold">{profile.icNo || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Gender</span>
                  <span className="font-semibold">{profile.gender || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>DOB</span>
                  <span className="font-semibold">{profile.dob || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Age</span>
                  <span className="font-semibold">{profile.age || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Phone</span>
                  <span className="font-semibold">{profile.phone || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Marital Status</span>
                  <span className="font-semibold">{profile.maritalStatus || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Nationality</span>
                  <span className="font-semibold">{profile.nationality || '-'}</span>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-card-border bg-white/90 p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand.violet/10 p-3 text-brand.violet">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-muted">Work Info</p>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.work.position}
                  onChange={(e) => updateWork({ position: e.target.value })}
                  placeholder="Position"
                  className="mt-1 w-full rounded-xl border border-card-border bg-white px-3 py-2 text-lg font-semibold focus:border-brand.violet focus:outline-none"
                />
              ) : (
                <h2 className="text-2xl font-semibold">{profile.work.position || 'Not set'}</h2>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {isEditing ? (
              <>
                <EditableField label="Email" value={profile.work.email} onChange={(v) => updateWork({ email: v })} type="email" />
                <EditableField label="Location" value={profile.work.location} onChange={(v) => updateWork({ location: v })} />
                <EditableField label="Department" value={profile.work.department} onChange={(v) => updateWork({ department: v })} />
                <EditableField label="Employee No" value={profile.work.employeeNo} onChange={(v) => updateWork({ employeeNo: v })} />
                <EditableField label="Job Grade" value={profile.work.jobGrade} onChange={(v) => updateWork({ jobGrade: v })} />
                <EditableField label="Report To" value={profile.work.reportTo} onChange={(v) => updateWork({ reportTo: v })} />
                <EditableField 
                  label="Role" 
                  value={profile.work.role} 
                  onChange={(v) => updateWork({ role: v as 'staff' | 'admin' })} 
                  options={['staff', 'admin']}
                />
                <EditableField 
                  label="Status" 
                  value={profile.work.status} 
                  onChange={(v) => updateWork({ status: v as 'ACTIVE' | 'INACTIVE' })} 
                  options={['ACTIVE', 'INACTIVE']}
                />
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Email</span>
                  <span className="font-semibold">{profile.work.email || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Location</span>
                  <span className="font-semibold">{profile.work.location || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Department</span>
                  <span className="font-semibold">{profile.work.department || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Employee No</span>
                  <span className="font-semibold">{profile.work.employeeNo || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Job Grade</span>
                  <span className="font-semibold">{profile.work.jobGrade || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Report To</span>
                  <span className="font-semibold">{profile.work.reportTo || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Role</span>
                  <span className="font-semibold text-brand.violet">{profile.work.role || '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Status</span>
                  <span className="font-semibold text-brand.violet">{profile.work.status || '-'}</span>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Passport Info">
          {isEditing ? (
            <>
              <EditableField label="Passport No." value={profile.passport.passportNo} onChange={(v) => updatePassport({ passportNo: v })} />
              <EditableField label="Expiry Date" value={profile.passport.expiryDate} onChange={(v) => updatePassport({ expiryDate: v })} type="date" />
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Passport No.</span>
                <span className="font-semibold">{profile.passport.passportNo || '-'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Expiry Date</span>
                <span className="font-semibold">{profile.passport.expiryDate || '-'}</span>
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="Bank Info">
          {isEditing ? (
            <>
              <EditableField label="Bank Name" value={profile.bank.bankName} onChange={(v) => updateBank({ bankName: v })} />
              <EditableField label="Account No." value={profile.bank.accountNo} onChange={(v) => updateBank({ accountNo: v })} />
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Bank Name</span>
                <span className="font-semibold">{profile.bank.bankName || '-'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Account No.</span>
                <span className="font-semibold">{profile.bank.accountNo || '-'}</span>
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="Allowance & Claim">
          {isEditing ? (
            <>
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Allowance</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profile.allowance.allowance}
                    onChange={(e) => updateAllowance({ allowance: e.target.checked })}
                    className="h-4 w-4 rounded border-card-border text-brand.violet focus:ring-brand.violet"
                  />
                  <span className="font-semibold">{profile.allowance.allowance ? 'YES' : 'NO'}</span>
                </label>
              </div>
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Claim</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profile.allowance.claim}
                    onChange={(e) => updateAllowance({ claim: e.target.checked })}
                    className="h-4 w-4 rounded border-card-border text-brand.violet focus:ring-brand.violet"
                  />
                  <span className="font-semibold">{profile.allowance.claim ? 'YES' : 'NO'}</span>
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Allowance</span>
                <span className="font-semibold">{profile.allowance.allowance ? 'YES' : 'NO'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Claim</span>
                <span className="font-semibold">{profile.allowance.claim ? 'YES' : 'NO'}</span>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-dashed border-brand.violet/40 bg-brand.violet/5 p-6">
        <div className="flex items-center gap-3 text-brand.violet">
          <UserRound className="h-6 w-6" />
          <div>
            <p className="text-sm uppercase tracking-[0.3em]">Self Service</p>
            <p className="text-xl font-semibold text-charcoal">Update staff profile</p>
          </div>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-2xl border border-orange-400 bg-orange-50 px-5 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-card hover:bg-green-700 disabled:bg-green-400 transition"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button className="rounded-2xl border border-blue-400 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition">
                Export PDF
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-2xl bg-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-card hover:bg-purple-700 transition"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white/80 p-6 shadow-card">
          <p className={labelClass}>Contact Actions</p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row">
            <button className="flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition">
              <Mail className="h-4 w-4" />
              Email Staff
            </button>
            <button className="flex items-center gap-2 rounded-2xl bg-green-500 px-4 py-3 text-sm font-semibold text-white hover:bg-green-600 transition">
              <Phone className="h-4 w-4" />
              Call Staff
            </button>
          </div>
        </div>
        <div className="rounded-3xl bg-white/80 p-6 shadow-card">
          <p className={labelClass}>Important Dates</p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-card-border p-4">
            <CalendarDays className="h-10 w-10 text-brand.violet" />
            <div>
              <p className="text-sm text-text-muted">Next Review</p>
              <p className="text-lg font-semibold">12 January 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
