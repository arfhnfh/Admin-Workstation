export type RoomBookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'

export type RoomLevel = 'LEVEL_6' | 'LEVEL_5'

export type RoomType =
  | 'elaiese'
  | 'olivie'
  | 'power-up'
  | 'phenoliv'
  | 'choco'
  | 'delima'
  | 'sauda-ajwa'

export type RoomArrangement = 'classroom' | 'ushape' | 'island'

export interface RefreshmentOption {
  bf: { lunch: boolean; dinner: boolean }
  atb: { lunch: boolean; dinner: boolean }
}

export interface EventSchedule {
  id: number
  date: string
  startTime: string
  endTime: string
  participants: number
  refreshment: RefreshmentOption
}

export interface RoomBooking {
  id: string
  requestorId: string
  requestorName: string
  division: string
  requestDate: string
  eventName: string
  selectedRooms: RoomType[]
  schedules: EventSchedule[]
  extraItems?: string
  roomArrangement?: RoomArrangement[]
  // Requestor approval
  requestorSignatureName?: string
  requestorSignatureDate?: string
  // HOD approval
  hodApproval?: 'approved' | 'not-approved'
  hodName?: string
  hodApprovalDate?: string
  // Facility team
  receivedByName?: string
  receivedByDate?: string
  // Final approval
  finalApproval?: 'approved' | 'not-approved'
  finalApproverName?: string
  finalApprovalDate?: string
  // Status tracking
  status: RoomBookingStatus
  createdAt: string
  updatedAt: string
}

export interface Room {
  id: string
  name: string
  level: RoomLevel
  type: RoomType
  capacity?: number
  description?: string
}

export interface BookingLog {
  id: string
  bookingId: string
  action: 'CREATED' | 'APPROVED' | 'REJECTED' | 'UPDATED' | 'CANCELLED'
  performedBy: string
  performedByName: string
  timestamp: string
  notes?: string
  changes?: Record<string, { old: any; new: any }>
}
