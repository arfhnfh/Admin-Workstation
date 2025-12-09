import { useEffect, useState } from 'react'
import { Calendar, Clock, Eye, Loader2 } from 'lucide-react'
import type { RoomBooking } from '@/types/roomBooking'
import { fetchUserRoomBookings } from '@/services/roomBookingService'
import { useAuthContext } from '@/hooks/useAuthContext'

const statusLabels: Record<RoomBooking['status'], string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const statusColors: Record<RoomBooking['status'], string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

export default function MyBookingHistory() {
  const { user } = useAuthContext()
  const [bookings, setBookings] = useState<RoomBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null)

  useEffect(() => {
    if (user) {
      loadBookings()
    }
  }, [user])

  const loadBookings = async () => {
    if (!user) return
    setLoading(true)
    const data = await fetchUserRoomBookings(user.id)
    setBookings(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
        <p className="text-center text-text-muted">Please login to view your booking history.</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
      <div className="mb-6">
        <h3 className="mb-2 text-lg font-semibold text-charcoal">My Booking History</h3>
        <p className="text-sm text-text-muted">
          View all your room booking requests and their current status.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading your bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-16 text-center text-text-muted text-sm">
          You haven't submitted any room booking requests yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-xl border border-card-border bg-brand.sand/20 p-4 hover:bg-brand.sand/30 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-brand.violet/10 p-2">
                      <Calendar className="h-4 w-4 text-brand.violet" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-charcoal">{booking.eventName}</h4>
                      <p className="mt-1 text-sm text-text-muted">
                        Requested on {new Date(booking.requestDate).toLocaleDateString()}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {booking.selectedRooms.map((room) => (
                          <span
                            key={room}
                            className="rounded-full bg-brand.lavender/30 px-2 py-0.5 text-xs text-charcoal"
                          >
                            {room.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 space-y-1">
                        {booking.schedules.slice(0, 3).map((schedule, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-text-muted">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {schedule.date && new Date(schedule.date).toLocaleDateString()}{' '}
                              {schedule.startTime && schedule.endTime && (
                                <span>({schedule.startTime} - {schedule.endTime})</span>
                              )}
                            </span>
                          </div>
                        ))}
                        {booking.schedules.length > 3 && (
                          <p className="text-xs text-text-muted">
                            +{booking.schedules.length - 3} more schedule(s)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusColors[booking.status]
                    }`}
                  >
                    {statusLabels[booking.status]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)}
                    className="flex items-center gap-1 rounded-lg bg-brand.violet/10 px-2 py-1 text-xs font-medium text-brand.violet hover:bg-brand.violet/20"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {selectedBooking?.id === booking.id ? 'Hide' : 'View'}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedBooking?.id === booking.id && (
                <div className="mt-4 border-t border-card-border pt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-text-muted">Division</p>
                      <p className="mt-1 text-sm text-charcoal">{booking.division}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-muted">Request Date</p>
                      <p className="mt-1 text-sm text-charcoal">
                        {new Date(booking.requestDate).toLocaleDateString()}
                      </p>
                    </div>
                    {booking.extraItems && (
                      <div>
                        <p className="text-xs font-medium text-text-muted">Extra Items</p>
                        <p className="mt-1 text-sm text-charcoal">{booking.extraItems}</p>
                      </div>
                    )}
                    {booking.roomArrangement && booking.roomArrangement.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-text-muted">Room Arrangement</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {booking.roomArrangement.map((arr) => (
                            <span
                              key={arr}
                              className="rounded-full bg-brand.violet/10 px-2 py-0.5 text-xs text-brand.violet"
                            >
                              {arr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {booking.hodApproval && (
                    <div className="mt-4 border-t border-card-border pt-4">
                      <p className="text-xs font-medium text-text-muted">HOD Approval</p>
                      <p className="mt-1 text-sm text-charcoal">
                        {booking.hodApproval === 'approved' ? 'Approved' : 'Not Approved'} by{' '}
                        {booking.hodName} on{' '}
                        {booking.hodApprovalDate && new Date(booking.hodApprovalDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {booking.finalApproval && (
                    <div className="mt-4 border-t border-card-border pt-4">
                      <p className="text-xs font-medium text-text-muted">Final Approval</p>
                      <p className="mt-1 text-sm text-charcoal">
                        {booking.finalApproval === 'approved' ? 'Approved' : 'Not Approved'} by{' '}
                        {booking.finalApproverName} on{' '}
                        {booking.finalApprovalDate && new Date(booking.finalApprovalDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
