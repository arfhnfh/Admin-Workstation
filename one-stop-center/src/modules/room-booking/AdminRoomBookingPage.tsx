import { useEffect, useState } from 'react'
import { Calendar, Clock, Users, CheckCircle2, XCircle, Search, Filter, Eye, FileText, Loader2 } from 'lucide-react'
import type { RoomBooking, RoomBookingStatus, BookingLog } from '@/types/roomBooking'
import {
  fetchAllRoomBookings,
  updateRoomBookingStatus,
  fetchBookingLogs,
} from '@/services/roomBookingService'
import { useAuthContext } from '@/hooks/useAuthContext'

const statusLabels: Record<RoomBookingStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const statusColors: Record<RoomBookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

export default function AdminRoomBookingPage() {
  const { user } = useAuthContext()
  const [bookings, setBookings] = useState<RoomBooking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<RoomBooking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null)
  const [bookingLogs, setBookingLogs] = useState<BookingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<RoomBookingStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'logs'>('dashboard')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [bookings, statusFilter, searchQuery])

  const loadBookings = async () => {
    setLoading(true)
    const data = await fetchAllRoomBookings()
    setBookings(data)
    setLoading(false)
  }

  const filterBookings = () => {
    let filtered = [...bookings]

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((b) => b.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.requestorName?.toLowerCase().includes(query) ||
          b.eventName?.toLowerCase().includes(query) ||
          b.division?.toLowerCase().includes(query)
      )
    }

    setFilteredBookings(filtered)
  }

  const handleStatusChange = async (
    bookingId: string,
    status: RoomBookingStatus,
    notes?: string
  ) => {
    if (!user) return

    setUpdatingId(bookingId)

    const { error } = await updateRoomBookingStatus(
      bookingId,
      status,
      user.id,
      user.email || 'Admin',
      notes
    )

    setUpdatingId(null)

    if (error) {
      alert(`Failed to update status: ${error.message}`)
      return
    }

    await loadBookings()
    if (selectedBooking?.id === bookingId) {
      const updated = bookings.find((b) => b.id === bookingId)
      if (updated) setSelectedBooking(updated)
    }
  }

  const handleViewBooking = async (booking: RoomBooking) => {
    setSelectedBooking(booking)
    const logs = await fetchBookingLogs(booking.id)
    setBookingLogs(logs)
    setActiveTab('logs')
  }

  const getBookingsForDate = (date: string) => {
    return bookings.filter((booking) => {
      if (booking.status === 'REJECTED' || booking.status === 'CANCELLED') return false
      return booking.schedules.some((schedule) => schedule.date === date)
    })
  }

  const getRoomAvailability = (date: string) => {
    const bookingsForDate = getBookingsForDate(date)
    const roomUsage: Record<string, number> = {}
    
    bookingsForDate.forEach((booking) => {
      booking.selectedRooms.forEach((room) => {
        roomUsage[room] = (roomUsage[room] || 0) + 1
      })
    })
    
    return roomUsage
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 p-6 shadow-card">
        <div>
          <nav className="text-sm text-text-muted">
            Home / Admin / <span className="text-brand.violet">Manage Room Booking</span>
          </nav>
          <h1 className="mt-2 text-3xl font-semibold text-charcoal">Manage Room Booking</h1>
          <p className="text-sm text-text-muted">
            Review, approve, reject, and manage all room booking requests submitted by staff.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-3xl border border-card-border bg-white/80 p-4 shadow-card">
        <div className="flex flex-wrap gap-2 border-b border-card-border">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'dashboard'
                ? 'border-b-2 border-brand.violet text-brand.violet'
                : 'text-text-muted hover:text-charcoal'
            }`}
          >
            Booking Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'calendar'
                ? 'border-b-2 border-brand.violet text-brand.violet'
                : 'text-text-muted hover:text-charcoal'
            }`}
          >
            Booking Calendar
          </button>
          {selectedBooking && (
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'logs'
                  ? 'border-b-2 border-brand.violet text-brand.violet'
                  : 'text-text-muted hover:text-charcoal'
              }`}
            >
              Booking Logs
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="rounded-3xl border border-card-border bg-white/80 p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search by requestor, event name, or division..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-card-border bg-white px-9 py-2.5 text-sm focus:border-brand.violet focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-text-muted" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as RoomBookingStatus | 'ALL')}
                  className="rounded-2xl border border-card-border bg-white px-3 py-2 text-xs font-semibold text-charcoal focus:border-brand.violet focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Booking Table */}
          <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-text-muted">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading bookings...
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-16 text-center text-text-muted text-sm">
                No bookings found for the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border bg-brand.sand/30 text-xs uppercase tracking-wider text-text-muted">
                      <th className="px-3 py-2 text-left">Requestor</th>
                      <th className="px-3 py-2 text-left">Event Name</th>
                      <th className="px-3 py-2 text-left">Date(s)</th>
                      <th className="px-3 py-2 text-left">Room Requested</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-brand.sand/30">
                        <td className="px-3 py-3 align-top">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand.violet/10">
                              <Users className="h-4 w-4 text-brand.violet" />
                            </div>
                            <div>
                              <p className="font-semibold text-charcoal">{booking.requestorName}</p>
                              <p className="text-xs text-text-muted">{booking.division}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p className="font-medium text-charcoal">{booking.eventName}</p>
                        </td>
                        <td className="px-3 py-3 align-top text-xs text-text-muted">
                          <div className="space-y-1">
                            {booking.schedules.map((schedule, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-brand.violet" />
                                <span>
                                  {schedule.date && new Date(schedule.date).toLocaleDateString()}
                                  {schedule.startTime && schedule.endTime && (
                                    <span className="ml-2">
                                      {schedule.startTime} - {schedule.endTime}
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-wrap gap-1">
                            {booking.selectedRooms.map((room) => (
                              <span
                                key={room}
                                className="rounded-full bg-brand.lavender/30 px-2 py-0.5 text-xs text-charcoal"
                              >
                                {room.replace('-', ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              statusColors[booking.status]
                            }`}
                          >
                            {statusLabels[booking.status]}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewBooking(booking)}
                              className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                            {booking.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  disabled={updatingId === booking.id}
                                  onClick={() => handleStatusChange(booking.id, 'APPROVED')}
                                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={updatingId === booking.id}
                                  onClick={() => handleStatusChange(booking.id, 'REJECTED')}
                                  className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Reject
                                </button>
                              </>
                            )}
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
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
            <div className="mb-4 flex items-center gap-4">
              <label className="text-sm font-medium text-charcoal">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-sm focus:border-brand.violet focus:outline-none"
              />
            </div>

            <div className="mt-6">
              <h3 className="mb-4 text-lg font-semibold text-charcoal">
                Bookings for {new Date(selectedDate).toLocaleDateString()}
              </h3>
              {getBookingsForDate(selectedDate).length === 0 ? (
                <p className="py-8 text-center text-text-muted text-sm">
                  No bookings found for this date.
                </p>
              ) : (
                <div className="space-y-4">
                  {getBookingsForDate(selectedDate).map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-card-border bg-brand.sand/20 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-charcoal">{booking.eventName}</h4>
                          <p className="mt-1 text-sm text-text-muted">
                            Requested by: {booking.requestorName} ({booking.division})
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {booking.selectedRooms.map((room) => (
                              <span
                                key={room}
                                className="rounded-full bg-brand.violet/10 px-2 py-0.5 text-xs font-medium text-brand.violet"
                              >
                                {room.replace('-', ' ')}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 space-y-1">
                            {booking.schedules
                              .filter((s) => s.date === selectedDate)
                              .map((schedule, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-text-muted">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>
                                    {schedule.startTime} - {schedule.endTime} ({schedule.participants}{' '}
                                    participants)
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                        <span
                          className={`ml-4 rounded-full px-2 py-1 text-xs font-semibold ${
                            statusColors[booking.status]
                          }`}
                        >
                          {statusLabels[booking.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Room Availability Summary */}
            <div className="mt-6 border-t border-card-border pt-6">
              <h3 className="mb-4 text-lg font-semibold text-charcoal">Room Availability Summary</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  'elaiese',
                  'olivie',
                  'power-up',
                  'phenoliv',
                  'choco',
                  'delima',
                  'sauda-ajwa',
                ].map((room) => {
                  const availability = getRoomAvailability(selectedDate)
                  const isBooked = availability[room] > 0
                  return (
                    <div
                      key={room}
                      className={`rounded-lg border p-3 ${
                        isBooked
                          ? 'border-rose-300 bg-rose-50'
                          : 'border-emerald-300 bg-emerald-50'
                      }`}
                    >
                      <p className="text-xs font-semibold text-charcoal">
                        {room.replace('-', ' ').toUpperCase()}
                      </p>
                      <p
                        className={`mt-1 text-xs font-medium ${
                          isBooked ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {isBooked ? `Booked (${availability[room]})` : 'Available'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Logs Tab */}
      {activeTab === 'logs' && selectedBooking && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
            <div className="mb-6 flex items-start justify-between border-b border-card-border pb-4">
              <div>
                <h3 className="text-xl font-semibold text-charcoal">Booking Details</h3>
                <p className="mt-1 text-sm text-text-muted">Event: {selectedBooking.eventName}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  statusColors[selectedBooking.status]
                }`}
              >
                {statusLabels[selectedBooking.status]}
              </span>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-text-muted">Requestor</p>
                <p className="mt-1 text-sm font-semibold text-charcoal">
                  {selectedBooking.requestorName}
                </p>
                <p className="text-xs text-text-muted">{selectedBooking.division}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted">Request Date</p>
                <p className="mt-1 text-sm text-charcoal">
                  {new Date(selectedBooking.requestDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted">Rooms</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedBooking.selectedRooms.map((room) => (
                    <span
                      key={room}
                      className="rounded-full bg-brand.lavender/30 px-2 py-0.5 text-xs text-charcoal"
                    >
                      {room.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted">Schedules</p>
                <div className="mt-1 space-y-1">
                  {selectedBooking.schedules.map((schedule, idx) => (
                    <p key={idx} className="text-xs text-charcoal">
                      {schedule.date && new Date(schedule.date).toLocaleDateString()}{' '}
                      {schedule.startTime && schedule.endTime && (
                        <span className="text-text-muted">
                          ({schedule.startTime} - {schedule.endTime})
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-card-border pt-6">
              <h4 className="mb-4 text-lg font-semibold text-charcoal">Booking Logs & Audit Trail</h4>
              {bookingLogs.length === 0 ? (
                <p className="py-8 text-center text-text-muted text-sm">No logs available.</p>
              ) : (
                <div className="space-y-3">
                  {bookingLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-card-border bg-brand.sand/20 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-brand.violet" />
                            <span className="text-sm font-semibold text-charcoal">
                              {log.action.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-text-muted">
                            By: {log.performedByName} on{' '}
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                          {log.notes && (
                            <p className="mt-2 text-sm text-charcoal">{log.notes}</p>
                          )}
                          {log.changes && (
                            <div className="mt-2 space-y-1">
                              {Object.entries(log.changes).map(([key, change]) => (
                                <p key={key} className="text-xs text-text-muted">
                                  <span className="font-medium">{key}:</span> {String(change.old)} →{' '}
                                  {String(change.new)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
