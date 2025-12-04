import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserRound, Mail, Phone, Building2, Edit2, X, Calendar, CreditCard, Briefcase, MapPin, Hash } from 'lucide-react'
import type { StaffProfile } from '@/types/staff'
import { fetchAllStaff, isUserAdmin } from '@/services/staffService'
import { useAuthContext } from '@/hooks/useAuthContext'

export default function AdminStaffManagementPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [staffList, setStaffList] = useState<StaffProfile[]>([])
  const [filteredStaff, setFilteredStaff] = useState<StaffProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      // Check if user is admin
      const adminCheck = await isUserAdmin(user.id)
      setIsAdmin(adminCheck)

      if (!adminCheck) {
        setLoading(false)
        return
      }

      // Load all staff
      const staff = await fetchAllStaff()
      setStaffList(staff)
      setFilteredStaff(staff)
      setLoading(false)
    }

    loadData()
  }, [user])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStaff(staffList)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = staffList.filter(
      (staff) =>
        staff.name?.toLowerCase().includes(query) ||
        staff.fullName?.toLowerCase().includes(query) ||
        staff.work.email?.toLowerCase().includes(query) ||
        staff.work.department?.toLowerCase().includes(query) ||
        staff.work.position?.toLowerCase().includes(query) ||
        staff.work.employeeNo?.toLowerCase().includes(query)
    )
    setFilteredStaff(filtered)
  }, [searchQuery, staffList])

  if (loading) {
    return (
      <div className="flex h-full min-h-[70vh] items-center justify-center rounded-3xl bg-white/70 shadow-card">
        <div className="animate-pulse text-text-muted">Loading staff list…</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full min-h-[70vh] items-center justify-center rounded-3xl bg-white/70 shadow-card">
        <div className="space-y-4 text-center">
          <p className="text-xl font-semibold text-charcoal">Access Denied</p>
          <p className="text-sm text-text-muted">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 p-6 shadow-card">
        <div>
          <nav className="text-sm text-text-muted">
            Home / Admin / <span className="text-brand.violet">Staff Management</span>
          </nav>
          <h1 className="mt-2 text-3xl font-semibold text-charcoal">Staff Management</h1>
          <p className="text-sm text-text-muted">
            Manage and oversee all staff profiles ({filteredStaff.length} staff members)
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: Staff List */}
        <div className="flex-1 rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, email, department, position, or employee number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-card-border bg-white px-12 py-3 text-sm focus:border-brand.violet focus:outline-none"
            />
          </div>

          {filteredStaff.length === 0 ? (
            <div className="py-12 text-center text-text-muted">
              {searchQuery ? 'No staff members found matching your search.' : 'No staff members found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Position</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {filteredStaff.map((staff) => (
                    <tr
                      key={staff.id}
                      className={`cursor-pointer transition hover:bg-brand.sand/30 ${
                        selectedStaff?.id === staff.id ? 'bg-brand.violet/5' : ''
                      }`}
                      onClick={() => setSelectedStaff(staff)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-brand.violet/10 flex items-center justify-center">
                            {staff.avatarUrl ? (
                              <img
                                src={staff.avatarUrl}
                                alt={staff.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <UserRound className="h-5 w-5 text-brand.violet" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-charcoal">{staff.name || 'N/A'}</div>
                            <div className="text-sm text-text-muted">{staff.fullName || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal">{staff.work.position || '-'}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{staff.work.department || '-'}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{staff.work.email || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            staff.work.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {staff.work.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            staff.work.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {staff.work.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedStaff(staff)
                          }}
                          className="rounded-lg bg-brand.violet/10 px-3 py-1.5 text-xs font-semibold text-brand.violet transition hover:bg-brand.violet/20"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Staff Details Panel */}
        {selectedStaff && (
          <div className="fixed right-4 top-20 z-50 h-[calc(100vh-6rem)] w-full max-w-md rounded-3xl border border-card-border bg-white shadow-2xl 2xl:relative 2xl:right-auto 2xl:top-auto 2xl:z-auto 2xl:h-auto 2xl:max-w-none 2xl:w-96">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-card-border bg-brand.violet/5 p-6">
                <h2 className="text-xl font-semibold text-charcoal">Staff Details</h2>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="rounded-lg p-2 text-text-muted transition hover:bg-white hover:text-charcoal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 border-b border-card-border pb-6">
                    <div className="h-20 w-20 flex-shrink-0 rounded-2xl bg-brand.violet/10 flex items-center justify-center">
                      {selectedStaff.avatarUrl ? (
                        <img
                          src={selectedStaff.avatarUrl}
                          alt={selectedStaff.name}
                          className="h-20 w-20 rounded-2xl object-cover"
                        />
                      ) : (
                        <UserRound className="h-10 w-10 text-brand.violet" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-charcoal">{selectedStaff.name || 'N/A'}</h3>
                      <p className="text-sm text-text-muted">{selectedStaff.fullName || ''}</p>
                      <div className="mt-2 flex gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            selectedStaff.work.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {selectedStaff.work.role.toUpperCase()}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            selectedStaff.work.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {selectedStaff.work.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Personal Information</h4>
                    <div className="space-y-2 rounded-xl bg-brand.sand/30 p-4">
                      {selectedStaff.icNo && (
                        <div className="flex items-center gap-3 text-sm">
                          <Hash className="h-4 w-4 text-text-muted" />
                          <span className="text-text-muted">IC No:</span>
                          <span className="font-semibold text-charcoal">{selectedStaff.icNo}</span>
                        </div>
                      )}
                      {selectedStaff.gender && (
                        <div className="flex items-center gap-3 text-sm">
                          <UserRound className="h-4 w-4 text-text-muted" />
                          <span className="text-text-muted">Gender:</span>
                          <span className="font-semibold text-charcoal">{selectedStaff.gender}</span>
                        </div>
                      )}
                      {selectedStaff.dob && (
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="h-4 w-4 text-text-muted" />
                          <span className="text-text-muted">Date of Birth:</span>
                          <span className="font-semibold text-charcoal">
                            {new Date(selectedStaff.dob).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedStaff.age > 0 && (
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-text-muted">Age:</span>
                          <span className="font-semibold text-charcoal">{selectedStaff.age} years</span>
                        </div>
                      )}
                      {selectedStaff.nationality && (
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-text-muted">Nationality:</span>
                          <span className="font-semibold text-charcoal">{selectedStaff.nationality}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Work Info */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Work Information</h4>
                    <div className="space-y-2 rounded-xl bg-brand.sand/30 p-4">
                      {selectedStaff.work.position && (
                        <div className="flex items-center gap-3 text-sm">
                          <Briefcase className="h-4 w-4 text-text-muted" />
                          <span className="text-text-muted">Position:</span>
                          <span className="font-semibold text-charcoal">{selectedStaff.work.position}</span>
                        </div>
                      )}
                      {selectedStaff.work.department && (
                        <div className="flex items-center gap-3 text-sm">
                          <Building2 className="h-4 w-4 text-text-muted" />
                          <span className="text-text-muted">Department:</span>
                          <span className="font-semibold text-charcoal">{selectedStaff.work.department}</span>
                        </div>
                      )}
                      {selectedStaff.work.employeeNo && (
                        <div className="flex items-center gap-3 text-sm">
                          <Hash className="h-4 w-4 text-text-muted" />
                          <span className="text-text-muted">Employee No:</span>
                          <span className="font-semibold text-charcoal">{selectedStaff.work.employeeNo}</span>
                        </div>
                      )}
                      {selectedStaff.work.jobGrade && (
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-text-muted">Job Grade:</span>
                          <span className="font-semibold text-charcoal">{selectedStaff.work.jobGrade}</span>
                        </div>
                      )}
                      {selectedStaff.work.location && (
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="h-4 w-4 text-text-muted" />
                          <span className="text-text-muted">Location:</span>
                          <span className="font-semibold text-charcoal">{selectedStaff.work.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Contact Information</h4>
                    <div className="space-y-2 rounded-xl bg-brand.sand/30 p-4">
                      {selectedStaff.work.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="h-4 w-4 text-text-muted" />
                          <span className="font-semibold text-charcoal break-all">{selectedStaff.work.email}</span>
                        </div>
                      )}
                      {selectedStaff.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4 text-text-muted" />
                          <span className="font-semibold text-charcoal">{selectedStaff.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank Info */}
                  {(selectedStaff.bank.bankName || selectedStaff.bank.accountNo) && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Bank Information</h4>
                      <div className="space-y-2 rounded-xl bg-brand.sand/30 p-4">
                        {selectedStaff.bank.bankName && (
                          <div className="flex items-center gap-3 text-sm">
                            <CreditCard className="h-4 w-4 text-text-muted" />
                            <span className="text-text-muted">Bank:</span>
                            <span className="font-semibold text-charcoal">{selectedStaff.bank.bankName}</span>
                          </div>
                        )}
                        {selectedStaff.bank.accountNo && (
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-text-muted">Account No:</span>
                            <span className="font-semibold text-charcoal">{selectedStaff.bank.accountNo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-card-border bg-brand.sand/30 p-6">
                <button
                  onClick={() => navigate(`/admin/staff/${selectedStaff.id}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8c4b2d] px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-[#6f361f]"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Full Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

