import { useState, useEffect } from 'react'
import {
  Calendar,
  MapPin,
  Briefcase,
  Car,
  User,
  Users,
  FileText,
  Mail,
  Phone,
  IdCard,
  Briefcase as BriefcaseIcon,
  Award,
  Building,
  Lock,
  Settings,
  CreditCard,
  ChevronDown,
} from 'lucide-react'
import { useAuthContext } from '@/hooks/useAuthContext'
import { fetchStaffProfileByAuthId } from '@/services/staffService'
import { createVehicleRequest } from '@/services/vehicleService'
import { fetchTravelRequestsByStaffId, type TravelRequestSummary } from '@/services/travelService'
import type { StaffProfile } from '@/types/staff'

export default function VehicleRequestPage() {
  const { user } = useAuthContext()
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [travelRequests, setTravelRequests] = useState<TravelRequestSummary[]>([])

  // Form state
  const [travelNo, setTravelNo] = useState('')
  const [startDateTime, setStartDateTime] = useState('')
  const [endDateTime, setEndDateTime] = useState('')
  const [destination, setDestination] = useState('')
  const [purpose, setPurpose] = useState('')
  const [teamMembers, setTeamMembers] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const loadStaffProfile = async () => {
      if (!user) return
      const profile = await fetchStaffProfileByAuthId(user.id)
      setStaffProfile(profile)
      
      // Fetch travel requests for this staff member
      if (profile?.id) {
        const requests = await fetchTravelRequestsByStaffId(profile.id)
        setTravelRequests(requests)
      }
      
      setLoading(false)
    }

    loadStaffProfile()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!staffProfile?.id) {
      alert('Staff profile not found. Please contact administrator.')
      return
    }

    if (!purpose.trim() || !startDateTime || !endDateTime || !destination.trim()) {
      alert('Please fill in all required fields.')
      return
    }

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      alert('End date/time must be after start date/time.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createVehicleRequest({
        staffId: staffProfile.id,
        purpose: purpose.trim(),
        destination: destination.trim(),
        startDateTime,
        endDateTime,
        vehicleType: 'CAR', // Default, can be updated later if needed
        driverRequired: false,
        teamMembers: teamMembers.trim() || undefined,
        remarks: notes.trim() || undefined,
        travelNo: travelNo.trim() || undefined,
      })

      if (result.error) {
        alert(`Error submitting request: ${result.error.message}`)
      } else {
        alert('Vehicle request submitted successfully!')
        // Reset form
        setStartDateTime('')
        setEndDateTime('')
        setDestination('')
        setPurpose('')
        setTeamMembers('')
        setNotes('')
        setTravelNo('')
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formIsValid =
    purpose.trim() !== '' &&
    startDateTime !== '' &&
    endDateTime !== '' &&
    destination.trim() !== '' &&
    new Date(startDateTime) < new Date(endDateTime)

  if (loading) {
    return (
      <div className="flex h-full min-h-[70vh] items-center justify-center rounded-3xl bg-white/70 shadow-card">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 p-6 shadow-card">
        <div>
          <nav className="text-sm text-text-muted">
            Home / Vehicle / <span className="text-brand.violet">Request</span>
          </nav>
          <div className="mt-2 flex items-center gap-3">
            <Car className="h-8 w-8 text-brand.violet" />
            <h1 className="text-3xl font-semibold text-charcoal">Request Vehicle</h1>
          </div>
          <p className="text-sm text-text-muted">Submit your vehicle request for approval.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Staff Info - Always Visible - Beautiful & Neat Design */}
        <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand.violet via-purple-600 to-purple-700 shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-charcoal">Staff Information</h2>
              <p className="text-xs text-text-muted mt-0.5">Your profile details</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Personal Information Group */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-charcoal">Personal</h3>
              </div>
              
              <div className="space-y-3.5">
                <div className="group">
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <User className="h-3 w-3 text-brand.violet" />
                    </div>
                    Full Name
                  </label>
                  <p className="text-sm font-semibold text-charcoal ml-7">
                    {staffProfile?.fullName || staffProfile?.name || '-'}
                  </p>
                </div>

                <div className="group">
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <IdCard className="h-3 w-3 text-brand.violet" />
                    </div>
                    NRIC
                  </label>
                  <p className="text-sm font-semibold text-charcoal ml-7">{staffProfile?.icNo || '-'}</p>
                </div>

                <div className="group">
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <Mail className="h-3 w-3 text-brand.violet" />
                    </div>
                    Email
                  </label>
                  <p className="text-sm font-semibold text-charcoal ml-7 break-all">{staffProfile?.work.email || '-'}</p>
                </div>

                <div className="group">
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <Phone className="h-3 w-3 text-brand.violet" />
                    </div>
                    Mobile No.
                  </label>
                  <p className="text-sm font-semibold text-charcoal ml-7">{staffProfile?.phone || '-'}</p>
                </div>
              </div>
            </div>

            {/* Work Information Group */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <BriefcaseIcon className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-semibold text-charcoal">Work Details</h3>
              </div>
              
              <div className="space-y-3.5">
                <div className="group">
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <FileText className="h-3 w-3 text-brand.violet" />
                    </div>
                    Employee No.
                  </label>
                  <p className="text-sm font-semibold text-charcoal ml-7">{staffProfile?.work.employeeNo || '-'}</p>
                </div>

                <div className="group">
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <Award className="h-3 w-3 text-brand.violet" />
                    </div>
                    Job Grade
                  </label>
                  <p className="text-sm font-semibold text-charcoal ml-7">{staffProfile?.work.jobGrade || '-'}</p>
                </div>

                <div className="group">
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <BriefcaseIcon className="h-3 w-3 text-brand.violet" />
                    </div>
                    Position
                  </label>
                  <p className="text-sm font-semibold text-charcoal ml-7">{staffProfile?.work.position || '-'}</p>
                </div>

                <div className="group">
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <Building className="h-3 w-3 text-brand.violet" />
                    </div>
                    Department
                  </label>
                  <p className="text-sm font-semibold text-charcoal ml-7">{staffProfile?.work.department || '-'}</p>
                </div>
              </div>
            </div>

            {/* Travel Documents Group */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-charcoal">Travel Documents</h3>
              </div>
              
              <div className="space-y-3.5">
                <div className="group">
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <CreditCard className="h-3 w-3 text-brand.violet" />
                    </div>
                    Passport No.
                  </label>
                  <p className="text-sm font-semibold text-charcoal ml-7">{staffProfile?.passport.passportNo || '-'}</p>
                </div>

                <div className="group">
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <Calendar className="h-3 w-3 text-brand.violet" />
                    </div>
                    Expiry Date
                  </label>
                  <p className="text-sm font-semibold text-charcoal ml-7">
                    {staffProfile?.passport?.expiryDate 
                      ? new Date(staffProfile.passport.expiryDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Journey Info */}
        <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-lg">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-charcoal">Journey Info</h2>
              <p className="text-xs text-text-muted mt-0.5">Fill in the journey information</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Travel No */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
                <Settings className="h-4 w-4" />
                Travel No
              </label>
              <div className="relative">
                <select
                  value={travelNo}
                  onChange={(e) => setTravelNo(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-card-border bg-white px-4 py-3 pr-10 text-sm text-charcoal focus:border-brand.violet focus:outline-none"
                >
                  <option value="">Select a travel request...</option>
                  {travelRequests
                    .filter((req) => req.status === 'APPROVED' && req.travelNo) // Only show APPROVED requests with travel numbers
                    .map((req) => (
                      <option key={req.id} value={req.travelNo || ''}>
                        {req.travelNo} - {req.destination} ({new Date(req.startDateTime).toLocaleDateString()})
                      </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              </div>
              {travelRequests.filter((req) => req.status === 'APPROVED' && req.travelNo).length === 0 && !loading && (
                <p className="mt-1 text-xs text-text-muted">
                  No approved travel requests found. Please create and get approval for a travel request first.
                </p>
              )}
            </div>

            {/* Date/Time Range */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
                  <Calendar className="h-4 w-4" />
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm focus:border-brand.violet focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
                  <Calendar className="h-4 w-4" />
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm focus:border-brand.violet focus:outline-none"
                />
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
                <Users className="h-4 w-4" />
                Destination <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm focus:border-brand.violet focus:outline-none"
                placeholder="Enter destination address"
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
                <FileText className="h-4 w-4" />
                Purpose <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm focus:border-brand.violet focus:outline-none"
                placeholder="e.g., Official meeting, Site visit, etc."
              />
            </div>

            {/* Team Members' Names */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
                <Users className="h-4 w-4" />
                Team Members' Names
              </label>
              <textarea
                value={teamMembers}
                onChange={(e) => setTeamMembers(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm focus:border-brand.violet focus:outline-none"
                placeholder="Enter team members' names (one per line or comma-separated)"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
                <FileText className="h-4 w-4" />
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm focus:border-brand.violet focus:outline-none"
                placeholder="Any additional information or special requirements..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3">
          {!formIsValid && (
            <p className="text-xs text-text-muted">Please fill all required fields to submit</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !formIsValid}
            className="flex items-center gap-2 rounded-xl bg-[#8c4b2d] px-8 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-[#6f361f] disabled:bg-[#8c4b2d]/60 disabled:cursor-not-allowed"
            title={!formIsValid ? 'Please fill all required fields' : ''}
          >
            <Lock className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}

