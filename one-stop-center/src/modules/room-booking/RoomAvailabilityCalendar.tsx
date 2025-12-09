import { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import {
  fetchRoomAvailabilityByDate,
  fetchAllRooms,
  checkRoomAvailability,
  fetchRoomBookingsByDate,
} from '@/services/roomBookingService'
import type { Room, RoomBooking, EventSchedule } from '@/types/roomBooking'

interface RoomAvailabilityCalendarProps {
  onRoomSelect?: (roomType: string, date?: string, startTime?: string, endTime?: string) => void
}

// Generate time slots for full 24 hours (30-minute intervals)
const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 0; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 23) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

// Convert time string to minutes for calculations
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Check if a time slot is within a booking range
const isTimeSlotBooked = (slotTime: string, bookings: EventSchedule[]): EventSchedule | null => {
  const slotMinutes = timeToMinutes(slotTime)
  
  for (const booking of bookings) {
    const startMinutes = timeToMinutes(booking.startTime)
    const endMinutes = timeToMinutes(booking.endTime)
    
    // Check if slot falls within booking range
    if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
      return booking
    }
  }
  
  return null
}

// Get booking block info for a time slot
const getBookingBlock = (slotTime: string, bookings: EventSchedule[], roomBookings: RoomBooking[]) => {
  const booking = isTimeSlotBooked(slotTime, bookings)
  if (!booking) return null
  
  // Find the parent booking
  const parentBooking = roomBookings.find((rb) =>
    rb.schedules.some((s) => s.id === booking.id)
  )
  
  return {
    booking,
    parentBooking,
    isStart: booking.startTime === slotTime,
    duration: timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime),
  }
}

export default function RoomAvailabilityCalendar({ onRoomSelect }: RoomAvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [bookingsByDate, setBookingsByDate] = useState<RoomBooking[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ room: string; startTime: string } | null>(null)

  useEffect(() => {
    loadRooms()
  }, [])

  useEffect(() => {
    loadAvailability()
  }, [selectedDate])

  const loadRooms = async () => {
    const data = await fetchAllRooms()
    setRooms(data.sort((a, b) => {
      // Sort by level first, then name
      if (a.level !== b.level) {
        return a.level === 'LEVEL_6' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    }))
  }

  const loadAvailability = async () => {
    setLoading(true)
    const bookings = await fetchRoomBookingsByDate(selectedDate)
    setBookingsByDate(bookings)
    setLoading(false)
  }

  const getRoomBookings = (roomType: string): EventSchedule[] => {
    return bookingsByDate
      .filter((b) => b.selectedRooms.includes(roomType as any))
      .flatMap((b) => b.schedules.filter((s) => s.date === selectedDate))
  }

  const handleTimeSlotClick = (roomType: string, timeSlot: string) => {
    if (!selectedTimeSlot) {
      // Start selection
      setSelectedTimeSlot({ room: roomType, startTime: timeSlot })
    } else if (selectedTimeSlot.room === roomType) {
      // Complete selection
      const startMinutes = timeToMinutes(selectedTimeSlot.startTime)
      const endMinutes = timeToMinutes(timeSlot)
      
      if (endMinutes > startMinutes) {
        // Check if slot is available
        const bookings = getRoomBookings(roomType)
        const isAvailable = !bookings.some((b) => {
          const bStart = timeToMinutes(b.startTime)
          const bEnd = timeToMinutes(b.endTime)
          return (
            (bStart <= startMinutes && bEnd > startMinutes) ||
            (bStart < endMinutes && bEnd >= endMinutes) ||
            (bStart >= startMinutes && bEnd <= endMinutes)
          )
        })
        
        if (isAvailable) {
          onRoomSelect?.(roomType, selectedDate, selectedTimeSlot.startTime, timeSlot)
          setSelectedTimeSlot(null)
        } else {
          alert('This time slot is already booked. Please select another time.')
          setSelectedTimeSlot(null)
        }
      } else {
        setSelectedTimeSlot(null)
      }
    } else {
      // Different room, reset selection
      setSelectedTimeSlot({ room: roomType, startTime: timeSlot })
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const gridTemplateColumns =
    rooms.length > 0 ? `90px repeat(${rooms.length}, minmax(160px, 1fr))` : '90px'

  return (
    <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="mb-1 text-lg font-semibold text-charcoal">Room Availability Calendar</h3>
          <p className="text-sm text-text-muted">
            Click on available time slots to book a room. Select start and end time by clicking twice.
          </p>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigateDate(-1)}
            className="rounded-lg border border-card-border bg-white p-2 hover:bg-brand.sand/30 transition"
          >
            <ChevronLeft className="h-4 w-4 text-charcoal" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand.violet" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-sm focus:border-brand.violet focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => navigateDate(1)}
            className="rounded-lg border border-card-border bg-white p-2 hover:bg-brand.sand/30 transition"
          >
            <ChevronRight className="h-4 w-4 text-charcoal" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-brand.sand/30 transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Selected Date Display */}
      <div className="mb-4 text-sm font-medium text-charcoal">
        {formatDate(selectedDate)}
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-card-border bg-brand.sand/20 p-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-emerald-200 border border-emerald-300"></div>
          <span className="text-text-muted">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-rose-200 border border-rose-300"></div>
          <span className="text-text-muted">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-brand.violet/20 border border-brand.violet"></div>
          <span className="text-text-muted">Selected</span>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-text-muted text-sm">Loading availability...</div>
      ) : (
        <div className="overflow-x-auto">
          {/* Calendar Grid */}
          <div className="min-w-[800px]">
            {/* Header Row - Room Names */}
            <div className="sticky top-0 z-10 grid gap-0 border-b-2 border-charcoal bg-white">
              <div className="grid" style={{ gridTemplateColumns }}>
                <div className="border-r border-card-border bg-brand.sand/30 p-2 text-xs font-semibold text-charcoal">
                  Time
                </div>
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="border-r border-card-border bg-brand.sand/30 p-2 text-center text-xs font-semibold text-charcoal last:border-r-0"
                  >
                    <div>{room.name}</div>
                    <div className="text-[10px] text-text-muted">{room.description || room.level}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="divide-y divide-card-border">
              {TIME_SLOTS.map((timeSlot, slotIndex) => {
                const isHourMark = timeSlot.endsWith(':00')
                return (
                  <div
                    key={timeSlot}
                  className={`grid gap-0 ${
                      isHourMark ? 'border-t border-card-border' : ''
                    }`}
                    style={{ gridTemplateColumns }}
                  >
                    {/* Time Label */}
                    <div className="border-r border-card-border bg-brand.sand/20 p-1 text-[10px] text-text-muted">
                      {isHourMark && formatTime(timeSlot)}
                    </div>

                    {/* Room Columns */}
                    {rooms.map((room) => {
                      const bookings = getRoomBookings(room.type)
                      const bookingBlock = getBookingBlock(timeSlot, bookings, bookingsByDate)
                      const isBooked = bookingBlock !== null
                      const isStart = bookingBlock?.isStart
                      const isSelected =
                        selectedTimeSlot?.room === room.type &&
                        timeToMinutes(timeSlot) >= timeToMinutes(selectedTimeSlot.startTime) &&
                        timeToMinutes(timeSlot) <= timeToMinutes(selectedTimeSlot.startTime) + 60

                      return (
                        <div
                          key={`${room.id}-${timeSlot}`}
                          className={`border-r border-card-border p-0.5 cursor-pointer transition last:border-r-0 ${
                            isBooked
                              ? 'bg-rose-100 hover:bg-rose-200'
                              : isSelected
                                ? 'bg-brand.violet/20 hover:bg-brand.violet/30'
                                : 'bg-emerald-50 hover:bg-emerald-100'
                          }`}
                          onClick={() => handleTimeSlotClick(room.type, timeSlot)}
                          title={
                            isBooked && bookingBlock?.parentBooking
                              ? `${bookingBlock.parentBooking.eventName} (${bookingBlock.booking.startTime} - ${bookingBlock.booking.endTime})`
                              : 'Click to select time slot'
                          }
                        >
                          {isStart && bookingBlock?.parentBooking && (
                            <div className="rounded px-1.5 py-0.5 text-[10px] font-medium text-rose-800 bg-rose-200">
                              <div className="truncate">{bookingBlock.parentBooking.eventName}</div>
                              <div className="text-[9px] opacity-75">
                                {formatTime(bookingBlock.booking.startTime)} -{' '}
                                {formatTime(bookingBlock.booking.endTime)}
                              </div>
                            </div>
                          )}
                          {isSelected && !isBooked && (
                            <div className="h-full rounded bg-brand.violet/30 border border-brand.violet"></div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {selectedTimeSlot && (
        <div className="mt-4 rounded-lg border border-brand.violet bg-brand.violet/10 p-3 text-xs text-brand.violet">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-semibold">Selecting time slot for {rooms.find((r) => r.type === selectedTimeSlot.room)?.name}</p>
              <p className="mt-1 text-text-muted">
                Start: {formatTime(selectedTimeSlot.startTime)}. Click another time slot to set end time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
