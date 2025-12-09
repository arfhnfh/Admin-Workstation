import { useEffect, useState } from 'react'
import { Calendar, Filter, Loader2, Search, UserRound, CheckCircle2, XCircle, Car } from 'lucide-react'
import type { VehicleRequestStatus, VehicleRequestSummary } from '@/services/vehicleService'
import { fetchAllVehicleRequests, updateVehicleRequestStatus } from '@/services/vehicleService'

const statusLabels: Record<VehicleRequestStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

const statusColors: Record<VehicleRequestStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
}

export default function AdminVehicleRequestsPage() {
  const [requests, setRequests] = useState<VehicleRequestSummary[]>([])
  const [filtered, setFiltered] = useState<VehicleRequestSummary[]>([])
  const [statusFilter, setStatusFilter] = useState<VehicleRequestStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await fetchAllVehicleRequests()
      setRequests(data)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let next = [...requests]

    if (statusFilter !== 'ALL') {
      next = next.filter((r) => r.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      next = next.filter(
        (r) =>
          r.staffName?.toLowerCase().includes(q) ||
          r.department?.toLowerCase().includes(q) ||
          r.purpose.toLowerCase().includes(q) ||
          r.destination?.toLowerCase().includes(q)
      )
    }

    setFiltered(next)
  }, [requests, statusFilter, search])

  const handleStatusChange = async (id: string, status: VehicleRequestStatus) => {
    setUpdatingId(id)

    // Optimistic UI update
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))

    const { error } = await updateVehicleRequestStatus(id, status)
    setUpdatingId(null)

    if (error) {
      // Revert on error
      setRequests((prev) => prev) // in real app you might refetch
      console.error('Failed to update status:', error)
      alert('Failed to update status. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 p-6 shadow-card">
        <div>
          <nav className="text-sm text-text-muted">
            Home / Admin / <span className="text-brand.violet">Vehicle Approvals</span>
          </nav>
          <h1 className="mt-2 text-3xl font-semibold text-charcoal">Vehicle Approvals</h1>
          <p className="text-sm text-text-muted">
            Review and approve vehicle requests submitted by staff.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-card-border bg-white/80 p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by staff name, department, purpose, or destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-card-border bg-white px-9 py-2.5 text-sm focus:border-brand.violet focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as VehicleRequestStatus | 'ALL')}
              className="rounded-2xl border border-card-border bg-white px-3 py-2 text-xs font-semibold text-charcoal focus:border-brand.violet focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading vehicle requests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-sm">
            No vehicle requests found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-brand.sand/30 text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-3 py-2 text-left">Staff</th>
                  <th className="px-3 py-2 text-left">Purpose</th>
                  <th className="px-3 py-2 text-left">Destination</th>
                  <th className="px-3 py-2 text-left">Vehicle & Driver</th>
                  <th className="px-3 py-2 text-left">Date & Time</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-brand.sand/30">
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand.violet/10">
                          <UserRound className="h-4 w-4 text-brand.violet" />
                        </div>
                        <div>
                          <p className="font-semibold text-charcoal">
                            {req.staffName || 'Unknown Staff'}
                          </p>
                          <p className="text-xs text-text-muted">
                            {req.department || 'No department'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="font-medium text-charcoal">{req.purpose}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="text-sm text-charcoal">{req.destination || '-'}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Car className="h-3.5 w-3.5 text-brand.violet" />
                        <span className="text-xs text-charcoal">{req.vehicleType || '-'}</span>
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        Driver: {req.driverRequired ? 'Required' : 'Not Required'}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top text-xs text-text-muted">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-brand.violet" />
                        <span>
                          {new Date(req.startDateTime).toLocaleString()} –{' '}
                          {new Date(req.endDateTime).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px]">
                        Submitted:{' '}
                        {new Date(req.createdAt).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          statusColors[req.status]
                        }`}
                      >
                        {statusLabels[req.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={updatingId === req.id || req.status === 'APPROVED'}
                          onClick={() => handleStatusChange(req.id, 'APPROVED')}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === req.id || req.status === 'REJECTED'}
                          onClick={() => handleStatusChange(req.id, 'REJECTED')}
                          className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

