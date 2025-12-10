import { useState } from 'react'
import { Calendar, Clock, Users, CheckCircle2, XCircle, FileText, History } from 'lucide-react'
import type { EventSchedule, RoomType, RoomArrangement } from '@/types/roomBooking'
import { createRoomBooking } from '@/services/roomBookingService'
import { useAuthContext } from '@/hooks/useAuthContext'
import RoomAvailabilityCalendar from './RoomAvailabilityCalendar'
import MyBookingHistory from './MyBookingHistory'

export default function RoomBookingPage() {
  const { user } = useAuthContext()
  const [activeTab, setActiveTab] = useState<'availability' | 'new' | 'history'>('availability')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [requestDate] = useState(new Date().toISOString().split('T')[0]) // Auto-filled
  const [requestedBy, setRequestedBy] = useState('')
  const [division, setDivision] = useState('')
  const [eventName, setEventName] = useState('')
  const [extraItems, setExtraItems] = useState('')
  
  // Room selection
  const [selectedRooms, setSelectedRooms] = useState<RoomType[]>([])
  
  // Room setting
  const [roomArrangement, setRoomArrangement] = useState<RoomArrangement[]>([])
  
  // Event schedules
  const [schedules, setSchedules] = useState<EventSchedule[]>([
    {
      id: 1,
      date: '',
      startTime: '',
      endTime: '',
      participants: 0,
      refreshment: {
        bf: { lunch: false, dinner: false },
        atb: { lunch: false, dinner: false },
      },
    },
  ])
  
  
  const toggleRoom = (roomType: RoomType) => {
    setSelectedRooms((prev) =>
      prev.includes(roomType)
        ? prev.filter((r) => r !== roomType)
        : [...prev, roomType]
    )
  }
  
  const toggleRoomArrangement = (arrangement: RoomArrangement) => {
    setRoomArrangement((prev) =>
      prev.includes(arrangement)
        ? prev.filter((a) => a !== arrangement)
        : [...prev, arrangement]
    )
  }
  
  const addSchedule = () => {
    setSchedules([
      ...schedules,
      {
        id: schedules.length + 1,
        date: '',
        startTime: '',
        endTime: '',
        participants: 0,
        refreshment: {
          bf: { lunch: false, dinner: false },
          atb: { lunch: false, dinner: false },
        },
      },
    ])
  }
  
  const removeSchedule = (id: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((s) => s.id !== id))
    }
  }
  
  const updateSchedule = (id: number, field: keyof EventSchedule, value: any) => {
    setSchedules(
      schedules.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }
  
  const updateRefreshment = (
    id: number,
    type: 'bf' | 'atb',
    meal: 'lunch' | 'dinner',
    checked: boolean
  ) => {
    setSchedules(
      schedules.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            refreshment: {
              ...s.refreshment,
              [type]: {
                ...s.refreshment[type],
                [meal]: checked,
              },
            },
          }
        }
        return s
      })
    )
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Please login to submit a booking request')
      return
    }
    
    if (selectedRooms.length === 0) {
      alert('Please select at least one room')
      return
    }
    
    if (!eventName.trim()) {
      alert('Please enter the event name')
      return
    }
    
    if (schedules.some((s) => !s.date || !s.startTime || !s.endTime)) {
      alert('Please fill in all schedule details')
      return
    }
    
    const { data, error } = await createRoomBooking({
      requestorId: user.id,
      requestorName: requestedBy || user.email || 'Unknown',
      division,
      requestDate,
      eventName,
      selectedRooms,
      schedules: schedules.map((s) => ({
        ...s,
        participants: Number(s.participants) || 0,
      })),
      extraItems: extraItems || undefined,
      roomArrangement: roomArrangement.length > 0 ? roomArrangement : undefined,
      status: 'PENDING',
    })
    
    if (error) {
      alert(`Failed to submit booking: ${error.message}`)
      return
    }
    
    alert('Room booking request submitted successfully!')
    // Switch to history tab to see the new booking
    setActiveTab('history')
    // Reset form
    setRequestedBy('')
    setDivision('')
    setEventName('')
    setExtraItems('')
    setSelectedRooms([])
    setRoomArrangement([])
    setSchedules([
      {
        id: 1,
        date: '',
        startTime: '',
        endTime: '',
        participants: 0,
        refreshment: {
          bf: { lunch: false, dinner: false },
          atb: { lunch: false, dinner: false },
        },
      },
    ])
  }
  
  const handleRoomSelect = (roomType: string, date?: string, startTime?: string, endTime?: string) => {
    setActiveTab('new')
    // Auto-select the room in the form
    if (!selectedRooms.includes(roomType as RoomType)) {
      setSelectedRooms([...selectedRooms, roomType as RoomType])
    }
    
    // Auto-fill schedule if date and time provided
    if (date && startTime && endTime) {
      const newSchedule = {
        id: schedules.length + 1,
        date: date,
        startTime: startTime,
        endTime: endTime,
        participants: 0,
        refreshment: {
          bf: { lunch: false, dinner: false },
          atb: { lunch: false, dinner: false },
        },
      }
      
      // Check if schedule already exists for this date/time
      const existingSchedule = schedules.find(
        (s) => s.date === date && s.startTime === startTime && s.endTime === endTime
      )
      
      if (!existingSchedule) {
        setSchedules([...schedules, newSchedule])
      }
    }
    
    // Scroll to room selection section
    setTimeout(() => {
      document.getElementById('room-selection')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 p-6 shadow-card">
        <div>
          <nav className="text-sm text-text-muted">
            Home / <span className="text-brand.violet">Room Booking</span>
          </nav>
          <h1 className="mt-2 text-3xl font-semibold text-charcoal">Room Booking</h1>
          <p className="text-sm text-text-muted">
            View room availability, submit booking requests, and manage your reservations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-3xl border border-card-border bg-white/80 p-4 shadow-card">
        <div className="flex flex-wrap gap-2 border-b border-card-border">
          <button
            type="button"
            onClick={() => setActiveTab('availability')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'availability'
                ? 'border-b-2 border-brand.violet text-brand.violet'
                : 'text-text-muted hover:text-charcoal'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Room Availability
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'new'
                ? 'border-b-2 border-brand.violet text-brand.violet'
                : 'text-text-muted hover:text-charcoal'
            }`}
          >
            <FileText className="h-4 w-4" />
            New Booking
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'history'
                ? 'border-b-2 border-brand.violet text-brand.violet'
                : 'text-text-muted hover:text-charcoal'
            }`}
          >
            <History className="h-4 w-4" />
            My Booking History
          </button>
        </div>
      </div>

      {/* Room Availability Tab */}
      {activeTab === 'availability' && (
        <RoomAvailabilityCalendar onRoomSelect={handleRoomSelect} />
      )}

      {/* New Booking Tab */}
      {activeTab === 'new' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
          {/* Form Header */}
          <div className="mb-6 flex items-start justify-between border-b border-card-border pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-brand.violet/10 p-3 text-brand.violet">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-charcoal">
                  ROOM RESERVATION FORM (RRF-2021/10-V.01)
                </h2>
                <p className="text-xs text-text-muted">(to be submitted 2 days before event)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-charcoal">Date:</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-sm focus:border-brand.violet focus:outline-none"
              />
            </div>
          </div>
          
          {/* Section A: Requestor Information */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-charcoal">Section A — Requestor Information</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-charcoal">
                  Requested By:
                </label>
                <input
                  type="text"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-charcoal">
                  Division:
                </label>
                <input
                  type="text"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                  placeholder="Enter division"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-charcoal">
                  Request Date:
                </label>
                <input
                  type="date"
                  value={requestDate}
                  disabled
                  className="w-full rounded-lg border border-card-border bg-brand.sand/30 px-3 py-2 text-sm text-text-muted cursor-not-allowed"
                />
              </div>
            </div>
          </div>
          
          {/* Section B: Type of Room Requested */}
          <div id="room-selection" className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-charcoal">Section B — Type of Room Requested</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Level 6 */}
              <div className="rounded-xl border border-card-border bg-brand.sand/30 p-4">
                <h4 className="mb-3 text-sm font-semibold uppercase text-charcoal">Level 6 Rooms</h4>
                <div className="space-y-2">
                  {[
                    { type: 'elaiese' as RoomType, label: 'Elaiese (Meeting Room)' },
                    { type: 'olivie' as RoomType, label: 'Olivie (Training Room 1)' },
                    { type: 'power-up' as RoomType, label: 'PowerUp (Training Room 2)' },
                    { type: 'phenoliv' as RoomType, label: 'Phenoliv (Discussion Room)' },
                  ].map((room) => (
                    <label
                      key={room.type}
                      className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-white/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRooms.includes(room.type)}
                        onChange={() => toggleRoom(room.type)}
                        className="h-4 w-4 rounded border-card-border text-brand.violet focus:ring-brand.violet"
                      />
                      <span className="text-sm text-charcoal">{room.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Level 5 */}
              <div className="rounded-xl border border-card-border bg-brand.sand/30 p-4">
                <h4 className="mb-3 text-sm font-semibold uppercase text-charcoal">Level 5 Rooms</h4>
                <div className="space-y-2">
                  {[
                    { type: 'choco' as RoomType, label: 'Choco' },
                    { type: 'delima' as RoomType, label: 'Delima' },
                    { type: 'sauda-ajwa' as RoomType, label: 'Sauda & Ajwa' },
                  ].map((room) => (
                    <label
                      key={room.type}
                      className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-white/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRooms.includes(room.type)}
                        onChange={() => toggleRoom(room.type)}
                        className="h-4 w-4 rounded border-card-border text-brand.violet focus:ring-brand.violet"
                      />
                      <span className="text-sm text-charcoal">{room.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Section C: Event/Program/Training Details */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-charcoal">
              Section C — Event / Program / Training Details
            </h3>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-charcoal">
                Event Name:
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                placeholder="Enter program/event/training name"
                required
              />
            </div>
            
            {/* Schedule Table */}
            <div className="overflow-x-auto rounded-xl border border-card-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-brand.sand/30">
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-charcoal">
                      No.
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-charcoal">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-charcoal">
                      Time (Start - End)
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-charcoal">
                      No. Of Participants
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-charcoal">
                      Refreshment (if needed)
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-charcoal">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {schedules.map((schedule, idx) => (
                    <tr key={schedule.id} className="hover:bg-brand.sand/20">
                      <td className="px-3 py-3 text-center text-charcoal">{idx + 1}</td>
                      <td className="px-3 py-3">
                        <input
                          type="date"
                          value={schedule.date}
                          onChange={(e) =>
                            updateSchedule(schedule.id, 'date', e.target.value)
                          }
                          className="w-full rounded-lg border border-card-border bg-white px-2 py-1.5 text-xs focus:border-brand.violet focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) =>
                              updateSchedule(schedule.id, 'startTime', e.target.value)
                            }
                            className="w-full rounded-lg border border-card-border bg-white px-2 py-1.5 text-xs focus:border-brand.violet focus:outline-none"
                            required
                          />
                          <span className="text-xs text-text-muted">-</span>
                          <input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) =>
                              updateSchedule(schedule.id, 'endTime', e.target.value)
                            }
                            className="w-full rounded-lg border border-card-border bg-white px-2 py-1.5 text-xs focus:border-brand.violet focus:outline-none"
                            required
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={schedule.participants || ''}
                          onChange={(e) =>
                            updateSchedule(schedule.id, 'participants', Number(e.target.value) || 0)
                          }
                          className="w-full rounded-lg border border-card-border bg-white px-2 py-1.5 text-xs focus:border-brand.violet focus:outline-none"
                          placeholder="0"
                          min="0"
                          required
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-2">
                          {/* BF Row */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-charcoal">BF:</span>
                            <label className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={schedule.refreshment.bf.lunch}
                                onChange={(e) =>
                                  updateRefreshment(
                                    schedule.id,
                                    'bf',
                                    'lunch',
                                    e.target.checked
                                  )
                                }
                                className="h-3.5 w-3.5 rounded border-card-border text-brand.violet focus:ring-brand.violet"
                              />
                              <span className="text-xs text-charcoal">LUNCH</span>
                            </label>
                            <label className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={schedule.refreshment.bf.dinner}
                                onChange={(e) =>
                                  updateRefreshment(
                                    schedule.id,
                                    'bf',
                                    'dinner',
                                    e.target.checked
                                  )
                                }
                                className="h-3.5 w-3.5 rounded border-card-border text-brand.violet focus:ring-brand.violet"
                              />
                              <span className="text-xs text-charcoal">DINNER</span>
                            </label>
                          </div>
                          {/* ATB Row */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-charcoal">ATB:</span>
                            <label className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={schedule.refreshment.atb.lunch}
                                onChange={(e) =>
                                  updateRefreshment(
                                    schedule.id,
                                    'atb',
                                    'lunch',
                                    e.target.checked
                                  )
                                }
                                className="h-3.5 w-3.5 rounded border-card-border text-brand.violet focus:ring-brand.violet"
                              />
                              <span className="text-xs text-charcoal">LUNCH</span>
                            </label>
                            <label className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={schedule.refreshment.atb.dinner}
                                onChange={(e) =>
                                  updateRefreshment(
                                    schedule.id,
                                    'atb',
                                    'dinner',
                                    e.target.checked
                                  )
                                }
                                className="h-3.5 w-3.5 rounded border-card-border text-brand.violet focus:ring-brand.violet"
                              />
                              <span className="text-xs text-charcoal">DINNER</span>
                            </label>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {schedules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSchedule(schedule.id)}
                            className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-card-border p-3">
                <button
                  type="button"
                  onClick={addSchedule}
                  className="rounded-lg bg-brand.violet/10 px-3 py-1.5 text-xs font-semibold text-brand.violet hover:bg-brand.violet/20"
                >
                  + Add Schedule
                </button>
              </div>
            </div>
          </div>
          
          {/* Extra Items Required */}
          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-charcoal">
              Extra Items Required:
            </label>
            <input
              type="text"
              value={extraItems}
              onChange={(e) => setExtraItems(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
              placeholder="Enter extra items if any"
            />
          </div>
          
          {/* Room Setting */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Room Setting (training room):
            </label>
            <div className="flex flex-wrap gap-4">
              {[
                { arrangement: 'classroom' as RoomArrangement, label: 'Classroom' },
                { arrangement: 'ushape' as RoomArrangement, label: 'U-shape' },
                { arrangement: 'island' as RoomArrangement, label: 'Island' },
              ].map((setting) => (
                <label
                  key={setting.arrangement}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-card-border bg-white px-4 py-2 hover:bg-brand.sand/30"
                >
                  <input
                    type="checkbox"
                    checked={roomArrangement.includes(setting.arrangement)}
                    onChange={() => toggleRoomArrangement(setting.arrangement)}
                    className="h-4 w-4 rounded border-card-border text-brand.violet focus:ring-brand.violet"
                  />
                  <span className="text-sm text-charcoal">{setting.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="mt-6 flex justify-end gap-3 border-t border-card-border pt-6">
            <button
              type="button"
              className="rounded-xl border border-card-border bg-white px-6 py-2.5 text-sm font-semibold text-charcoal hover:bg-brand.sand/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand.violet px-6 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-brand.grape transition"
            >
              Submit Request
            </button>
          </div>
          </div>
        </form>
      )}

      {/* My Booking History Tab */}
      {activeTab === 'history' && <MyBookingHistory key={Date.now()} />}
    </div>
  )
}
