import type {
  RoomBooking,
  RoomBookingStatus,
  BookingLog,
  Room,
  EventSchedule,
} from '@/types/roomBooking'

// Mock data - replace with actual Supabase calls later
const mockRooms: Room[] = [
  { id: '1', name: 'Elaiese', level: 'LEVEL_6', type: 'elaiese', capacity: 20, description: 'Meeting Room' },
  { id: '2', name: 'Olivie', level: 'LEVEL_6', type: 'olivie', capacity: 30, description: 'Training Room 1' },
  { id: '3', name: 'PowerUp', level: 'LEVEL_6', type: 'power-up', capacity: 30, description: 'Training Room 2' },
  { id: '4', name: 'Phenoliv', level: 'LEVEL_6', type: 'phenoliv', capacity: 10, description: 'Discussion Room' },
  { id: '5', name: 'Choco', level: 'LEVEL_5', type: 'choco', capacity: 15 },
  { id: '6', name: 'Delima', level: 'LEVEL_5', type: 'delima', capacity: 15 },
  { id: '7', name: 'Sauda & Ajwa', level: 'LEVEL_5', type: 'sauda-ajwa', capacity: 20 },
]

const mockBookings: RoomBooking[] = []

const mockLogs: BookingLog[] = []

export async function fetchAllRooms(): Promise<Room[]> {
  // TODO: Replace with Supabase query
  return Promise.resolve(mockRooms)
}

export async function fetchRoomBooking(bookingId: string): Promise<RoomBooking | null> {
  // TODO: Replace with Supabase query
  const booking = mockBookings.find((b) => b.id === bookingId)
  return Promise.resolve(booking || null)
}

export async function fetchAllRoomBookings(): Promise<RoomBooking[]> {
  // TODO: Replace with Supabase query
  return Promise.resolve(mockBookings)
}

export async function fetchUserRoomBookings(userId: string): Promise<RoomBooking[]> {
  // TODO: Replace with Supabase query
  return Promise.resolve(mockBookings.filter((b) => b.requestorId === userId))
}

export async function createRoomBooking(booking: Omit<RoomBooking, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<{ data: RoomBooking | null; error: Error | null }> {
  // TODO: Replace with Supabase insert
  const newBooking: RoomBooking = {
    ...booking,
    id: `booking-${Date.now()}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockBookings.push(newBooking)
  
  // Create log entry
  mockLogs.push({
    id: `log-${Date.now()}`,
    bookingId: newBooking.id,
    action: 'CREATED',
    performedBy: booking.requestorId,
    performedByName: booking.requestorName,
    timestamp: new Date().toISOString(),
  })
  
  return { data: newBooking, error: null }
}

export async function updateRoomBookingStatus(
  bookingId: string,
  status: RoomBookingStatus,
  approverId: string,
  approverName: string,
  notes?: string
): Promise<{ data: RoomBooking | null; error: Error | null }> {
  // TODO: Replace with Supabase update
  const booking = mockBookings.find((b) => b.id === bookingId)
  if (!booking) {
    return { data: null, error: new Error('Booking not found') }
  }
  
  const oldStatus = booking.status
  booking.status = status
  booking.updatedAt = new Date().toISOString()
  
  // Create log entry
  mockLogs.push({
    id: `log-${Date.now()}`,
    bookingId: booking.id,
    action: status === 'APPROVED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'UPDATED',
    performedBy: approverId,
    performedByName: approverName,
    timestamp: new Date().toISOString(),
    notes,
    changes: {
      status: { old: oldStatus, new: status },
    },
  })
  
  return { data: booking, error: null }
}

export async function fetchBookingLogs(bookingId: string): Promise<BookingLog[]> {
  // TODO: Replace with Supabase query
  return Promise.resolve(mockLogs.filter((log) => log.bookingId === bookingId))
}

export async function checkRoomAvailability(
  roomType: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  // TODO: Replace with Supabase query to check for conflicts
  // Check if any approved/pending bookings overlap with the requested time
  const conflicting = mockBookings.some((booking) => {
    if (booking.status === 'REJECTED' || booking.status === 'CANCELLED') return false
    if (!booking.selectedRooms.includes(roomType as any)) return false
    
    return booking.schedules.some((schedule) => {
      if (schedule.date !== date) return false
      // Simple time overlap check
      return (
        (schedule.startTime <= startTime && schedule.endTime > startTime) ||
        (schedule.startTime < endTime && schedule.endTime >= endTime) ||
        (schedule.startTime >= startTime && schedule.endTime <= endTime)
      )
    })
  })
  
  return !conflicting
}

export async function fetchRoomBookingsByDate(date: string): Promise<RoomBooking[]> {
  // TODO: Replace with Supabase query filtered by date
  const bookings = mockBookings.filter(
    (booking) =>
      booking.status !== 'REJECTED' &&
      booking.status !== 'CANCELLED' &&
      booking.schedules.some((s) => s.date === date),
  )
  return Promise.resolve(bookings)
}

export async function fetchRoomAvailabilityByDate(date: string): Promise<Record<string, boolean>> {
  // TODO: Replace with Supabase query
  const availability: Record<string, boolean> = {}
  const rooms = await fetchAllRooms()
  
  for (const room of rooms) {
    // Check if room has any bookings on this date
    const hasBooking = mockBookings.some((booking) => {
      if (booking.status === 'REJECTED' || booking.status === 'CANCELLED') return false
      if (!booking.selectedRooms.includes(room.type)) return false
      return booking.schedules.some((s) => s.date === date)
    })
    availability[room.type] = !hasBooking
  }
  
  return availability
}
