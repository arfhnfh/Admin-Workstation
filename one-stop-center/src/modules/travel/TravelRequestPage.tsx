import { useState, useEffect } from 'react'
import {
  Calendar,
  MapPin,
  Briefcase,
  Paperclip,
  Users,
  Hotel,
  Link2,
  Lock,
  ChevronDown,
  ChevronUp,
  Building2,
  FileText,
  Luggage,
  Plane as PlaneIcon,
  User,
  Mail,
  Phone,
  IdCard,
  Briefcase as BriefcaseIcon,
  Award,
  Building,
  CreditCard,
} from 'lucide-react'
import { parse, parseISO, isValid as isValidDate } from 'date-fns'
import { useAuthContext } from '@/hooks/useAuthContext'
import { fetchStaffProfileByAuthId } from '@/services/staffService'
import { createTravelRequest } from '@/services/travelService'
import type { StaffProfile } from '@/types/staff'

interface Accommodation {
  hotelName: string
  hotelLocation: string
  membersList: string
  hotelRate: string
  checkIn: string
  checkOut: string
  remarkLink: string
}

interface FlightInfo {
  date: string
  flightCompany: string
  fromAirport: string
  toAirport: string
  estimatedAirfare: string
  flightNo: string
  remarkLink: string
}

interface BusInfo {
  date: string
  busCompany: string
  fromTerminal: string
  toTerminal: string
  estimatedFare: string
  ticketNo: string
  remarkLink: string
}

interface FerryInfo {
  date: string
  ferryCompany: string
  fromTerminal: string
  toTerminal: string
  estimatedFare: string
  ticketNo: string
  remarkLink: string
}

interface TrainInfo {
  date: string
  trainCompany: string
  fromTerminal: string
  toTerminal: string
  estimatedFare: string
  ticketNo: string
  remarkLink: string
}

function isMealEligible(rangeStart: Date, rangeEnd: Date, time: { hour: number; minute: number }) {
  const target = new Date(rangeStart)
  target.setHours(time.hour, time.minute, 0, 0)
  return rangeStart <= target && rangeEnd >= target
}

function isMealWindowEligible(
  rangeStart: Date,
  rangeEnd: Date,
  window: { startHour: number; startMinute: number; endHour: number; endMinute: number }
) {
  const windowStart = new Date(rangeStart)
  windowStart.setHours(window.startHour, window.startMinute, 0, 0)
  const windowEnd = new Date(rangeStart)
  windowEnd.setHours(window.endHour, window.endMinute, 0, 0)
  return rangeEnd >= windowStart && rangeStart <= windowEnd
}

function parseDateTimeValue(value: string): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  const candidates = [
    () => parseISO(trimmed),
    () => parse(trimmed, "yyyy-MM-dd'T'HH:mm", new Date()),
    () => parse(trimmed, 'dd/MM/yyyy HH:mm', new Date()),
    () => parse(trimmed, 'dd/MM/yyyy hh:mm a', new Date()),
    () => parse(trimmed, 'dd-MM-yyyy HH:mm', new Date()),
    () => parse(trimmed, 'dd-MM-yyyy hh:mm a', new Date()),
  ]

  for (const candidate of candidates) {
    try {
      const parsed = candidate()
      if (parsed && isValidDate(parsed)) {
        return parsed
      }
    } catch {
      // try next format
    }
  }

  const fallbackMatch = trimmed.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i
  )
  if (fallbackMatch) {
    const [, dayStr, monthStr, yearStr, hourStr, minuteStr, meridiem] = fallbackMatch
    let hours = Number(hourStr)
    const minutes = Number(minuteStr)
    if (meridiem?.toUpperCase() === 'PM' && hours < 12) hours += 12
    if (meridiem?.toUpperCase() === 'AM' && hours === 12) hours = 0
    const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr), hours, minutes)
    if (isValidDate(date)) return date
  }

  return null
}

export default function TravelRequestPage() {
  const { user } = useAuthContext()
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [destination, setDestination] = useState('')
  const [reason, setReason] = useState('')
  const [travelType, setTravelType] = useState('')
  const [travelTypeRadio, setTravelTypeRadio] = useState<'one-way' | 'round-trip'>('one-way')
  const [attachments, setAttachments] = useState<File[]>([])
  const [startDateTime, setStartDateTime] = useState('')
  const [endDateTime, setEndDateTime] = useState('')
  const [transportationType, setTransportationType] = useState('')
  const [returnTransportationType, setReturnTransportationType] = useState('')
  const [showAccommodation, setShowAccommodation] = useState(true)
  const [accommodations, setAccommodations] = useState<Accommodation[]>([
    { hotelName: '', hotelLocation: '', membersList: '', hotelRate: '', checkIn: '', checkOut: '', remarkLink: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
  // Transportation-specific state
  const [flights, setFlights] = useState<FlightInfo[]>([{
    date: '', flightCompany: '', fromAirport: '', toAirport: '', estimatedAirfare: '', flightNo: '', remarkLink: ''
  }])
  const [luggageNo, setLuggageNo] = useState('')
  const [luggageWeight, setLuggageWeight] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [pickupDateTime, setPickupDateTime] = useState('')
  const [buses, setBuses] = useState<BusInfo[]>([{
    date: '', busCompany: '', fromTerminal: '', toTerminal: '', estimatedFare: '', ticketNo: '', remarkLink: ''
  }])
  const [ferries, setFerries] = useState<FerryInfo[]>([{
    date: '', ferryCompany: '', fromTerminal: '', toTerminal: '', estimatedFare: '', ticketNo: '', remarkLink: ''
  }])
  const [trains, setTrains] = useState<TrainInfo[]>([{
    date: '', trainCompany: '', fromTerminal: '', toTerminal: '', estimatedFare: '', ticketNo: '', remarkLink: ''
  }])
  const [returnFlights, setReturnFlights] = useState<FlightInfo[]>([{
    date: '', flightCompany: '', fromAirport: '', toAirport: '', estimatedAirfare: '', flightNo: '', remarkLink: ''
  }])
  const [returnLuggageNo, setReturnLuggageNo] = useState('')
  const [returnLuggageWeight, setReturnLuggageWeight] = useState('')
  const [returnPickupLocation, setReturnPickupLocation] = useState('')
  const [returnPickupDateTime, setReturnPickupDateTime] = useState('')
  const [returnBuses, setReturnBuses] = useState<BusInfo[]>([{
    date: '', busCompany: '', fromTerminal: '', toTerminal: '', estimatedFare: '', ticketNo: '', remarkLink: ''
  }])
  const [returnFerries, setReturnFerries] = useState<FerryInfo[]>([{
    date: '', ferryCompany: '', fromTerminal: '', toTerminal: '', estimatedFare: '', ticketNo: '', remarkLink: ''
  }])
  const [returnTrains, setReturnTrains] = useState<TrainInfo[]>([{
    date: '', trainCompany: '', fromTerminal: '', toTerminal: '', estimatedFare: '', ticketNo: '', remarkLink: ''
  }])
  const [mealDays, setMealDays] = useState<
    Array<{
      date: string
      eligible: { breakfast: boolean; lunch: boolean; dinner: boolean }
      provided: { breakfast: boolean; lunch: boolean; dinner: boolean }
    }>
  >([])

  const steps = [
    {
      id: 1,
      title: 'Travel Details',
      description: 'Destination, reason, purpose & attachments',
    },
    {
      id: 2,
      title: 'Trip Segments',
      description: 'Going trip and (if needed) return trip transportation',
    },
    {
      id: 3,
      title: 'Accommodation',
      description: 'Hotel details, members, and stay dates',
    },
    {
      id: 4,
      title: 'Dates & Allowance',
      description: 'Overall travel dates and meal allowance info',
    },
  ]

  useEffect(() => {
    const loadStaffProfile = async () => {
      if (!user) return
      const profile = await fetchStaffProfileByAuthId(user.id)
      setStaffProfile(profile)
      setLoading(false)
    }
    loadStaffProfile()
  }, [user])

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      // Check file size (max 2MB)
      const validFiles = files.filter(file => file.size <= 2 * 1024 * 1024)
      setAttachments(prev => [...prev, ...validFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const addAccommodation = () => {
    setAccommodations(prev => [...prev, {
      hotelName: '',
      hotelLocation: '',
      membersList: '',
      hotelRate: '',
      checkIn: '',
      checkOut: '',
      remarkLink: ''
    }])
  }

  const removeAccommodation = (index: number) => {
    if (accommodations.length > 1) {
      setAccommodations(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateAccommodation = (index: number, field: keyof Accommodation, value: string) => {
    setAccommodations(prev => prev.map((acc, i) => 
      i === index ? { ...acc, [field]: value } : acc
    ))
  }

  const addFlight = () => {
    setFlights(prev => [...prev, {
      date: '', flightCompany: '', fromAirport: '', toAirport: '', estimatedAirfare: '', flightNo: '', remarkLink: ''
    }])
  }

  const removeFlight = (index: number) => {
    if (flights.length > 1) {
      setFlights(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateFlight = (index: number, field: keyof FlightInfo, value: string) => {
    setFlights(prev => prev.map((flight, i) => 
      i === index ? { ...flight, [field]: value } : flight
    ))
  }

  const addBus = () => {
    setBuses(prev => [...prev, {
      date: '', busCompany: '', fromTerminal: '', toTerminal: '', estimatedFare: '', ticketNo: '', remarkLink: ''
    }])
  }

  const removeBus = (index: number) => {
    if (buses.length > 1) {
      setBuses(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateBus = (index: number, field: keyof BusInfo, value: string) => {
    setBuses(prev => prev.map((bus, i) => 
      i === index ? { ...bus, [field]: value } : bus
    ))
  }

  const addFerry = () => {
    setFerries(prev => [...prev, {
      date: '', ferryCompany: '', fromTerminal: '', toTerminal: '', estimatedFare: '', ticketNo: '', remarkLink: ''
    }])
  }

  const removeFerry = (index: number) => {
    if (ferries.length > 1) {
      setFerries(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateFerry = (index: number, field: keyof FerryInfo, value: string) => {
    setFerries(prev => prev.map((ferry, i) => 
      i === index ? { ...ferry, [field]: value } : ferry
    ))
  }

  const addTrain = () => {
    setTrains(prev => [...prev, {
      date: '', trainCompany: '', fromTerminal: '', toTerminal: '', estimatedFare: '', ticketNo: '', remarkLink: ''
    }])
  }

  const removeTrain = (index: number) => {
    if (trains.length > 1) {
      setTrains(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateTrain = (index: number, field: keyof TrainInfo, value: string) => {
    setTrains(prev => prev.map((train, i) => 
      i === index ? { ...train, [field]: value } : train
    ))
  }

  // Return trip helpers
  const addReturnFlight = () => {
    setReturnFlights(prev => [...prev, {
      date: '', flightCompany: '', fromAirport: '', toAirport: '', estimatedAirfare: '', flightNo: '', remarkLink: ''
    }])
  }

  const removeReturnFlight = (index: number) => {
    if (returnFlights.length > 1) {
      setReturnFlights(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateReturnFlight = (index: number, field: keyof FlightInfo, value: string) => {
    setReturnFlights(prev => prev.map((flight, i) =>
      i === index ? { ...flight, [field]: value } : flight
    ))
  }

  const addReturnBus = () => {
    setReturnBuses(prev => [...prev, {
      date: '', busCompany: '', fromTerminal: '', toTerminal: '', estimatedFare: '', ticketNo: '', remarkLink: ''
    }])
  }

  const removeReturnBus = (index: number) => {
    if (returnBuses.length > 1) {
      setReturnBuses(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateReturnBus = (index: number, field: keyof BusInfo, value: string) => {
    setReturnBuses(prev => prev.map((bus, i) =>
      i === index ? { ...bus, [field]: value } : bus
    ))
  }

  const addReturnFerry = () => {
    setReturnFerries(prev => [...prev, {
      date: '', ferryCompany: '', fromTerminal: '', toTerminal: '', estimatedFare: '', ticketNo: '', remarkLink: ''
    }])
  }

  const removeReturnFerry = (index: number) => {
    if (returnFerries.length > 1) {
      setReturnFerries(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateReturnFerry = (index: number, field: keyof FerryInfo, value: string) => {
    setReturnFerries(prev => prev.map((ferry, i) =>
      i === index ? { ...ferry, [field]: value } : ferry
    ))
  }

  const addReturnTrain = () => {
    setReturnTrains(prev => [...prev, {
      date: '', trainCompany: '', fromTerminal: '', toTerminal: '', estimatedFare: '', ticketNo: '', remarkLink: ''
    }])
  }

  const removeReturnTrain = (index: number) => {
    if (returnTrains.length > 1) {
      setReturnTrains(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateReturnTrain = (index: number, field: keyof TrainInfo, value: string) => {
    setReturnTrains(prev => prev.map((train, i) =>
      i === index ? { ...train, [field]: value } : train
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!staffProfile?.id) {
      alert('Unable to submit: staff profile not loaded.')
      setIsSubmitting(false)
      return
    }

    const { error } = await createTravelRequest({
      staffId: staffProfile.id,
      destination,
      reason,
      startDateTime,
      endDateTime,
      totalMealAllowance,
    })

    if (error) {
      console.error('Failed to submit travel request:', error)
      alert('Failed to submit travel request. Please try again.')
      setIsSubmitting(false)
      return
    }

    alert('Travel request submitted successfully! It will be sent to HOD for further action.')
    setIsSubmitting(false)
    // TODO: Submit to backend
    console.log('Travel Request Data:', {
      destination,
      reason,
      travelType,
      travelTypeRadio,
      attachments,
      startDateTime,
      endDateTime,
      transportationType,
      accommodations,
      flights,
      buses,
      ferries,
      trains,
      luggageNo,
      luggageWeight,
      pickupLocation,
      pickupDateTime,
      mealDays,
    })

    // Simulate API call
    setTimeout(() => {
      alert('Travel request submitted successfully! It will be sent to HOD for further action.')
      setIsSubmitting(false)
    }, 1000)
  }

  useEffect(() => {
    if (!startDateTime || !endDateTime) {
      setMealDays([])
      return
    }

    const start = parseDateTimeValue(startDateTime)
    const end = parseDateTimeValue(endDateTime)
    if (!start || !end || start > end) {
      setMealDays([])
      return
    }

    setMealDays((prev) => {
      const prevProvided = new Map(prev.map((day) => [day.date, day.provided]))

      const startDay = new Date(start)
      startDay.setHours(0, 0, 0, 0)
      const endDay = new Date(end)
      endDay.setHours(0, 0, 0, 0)

      const days: typeof prev = []
      const cursor = new Date(startDay)

      while (cursor <= endDay) {
        const dayStart = new Date(cursor)
        const dayEnd = new Date(cursor)
        dayEnd.setHours(23, 59, 59, 999)

        const actualStart = cursor.getTime() === startDay.getTime() ? new Date(start) : dayStart
        const actualEnd = cursor.getTime() === endDay.getTime() ? new Date(end) : dayEnd

        const eligible = {
          breakfast: isMealEligible(actualStart, actualEnd, { hour: 9, minute: 0 }),
          lunch: isMealWindowEligible(actualStart, actualEnd, { startHour: 12, startMinute: 0, endHour: 14, endMinute: 0 }),
          dinner: isMealEligible(actualStart, actualEnd, { hour: 19, minute: 30 }),
        }

        const dateKey = dayStart.toISOString().split('T')[0]
        const provided = prevProvided.get(dateKey) ?? { breakfast: false, lunch: false, dinner: false }
        days.push({ date: dateKey, eligible, provided })

        cursor.setDate(cursor.getDate() + 1)
      }

      return days
    })
  }, [startDateTime, endDateTime])

  const toggleMealProvided = (date: string, meal: 'breakfast' | 'lunch' | 'dinner') => {
    setMealDays((prev) =>
      prev.map((day) =>
        day.date === date
          ? { ...day, provided: { ...day.provided, [meal]: !day.provided[meal] } }
          : day
      )
    )
  }

  const totalMealAllowance = mealDays.reduce((total, day) => {
    let dayTotal = 0
    if (day.eligible.breakfast && !day.provided.breakfast) dayTotal += 20
    if (day.eligible.lunch && !day.provided.lunch) dayTotal += 30
    if (day.eligible.dinner && !day.provided.dinner) dayTotal += 30
    return total + dayTotal
  }, 0)

  // Validation function to check if all required fields are filled
  const isFormValid = () => {
    // Step 1: Travel Info validation
    if (!destination.trim() || !reason.trim() || !startDateTime || !endDateTime || !travelType || !travelTypeRadio) {
      return false
    }

    // Step 2: Transportation validation
    if (!transportationType) {
      return false
    }

    // Validate transportation-specific fields based on type
    if (transportationType === 'FLIGHT') {
      if (flights.length === 0) return false
      const hasInvalidFlight = flights.some(flight => 
        !flight.date || !flight.flightCompany || !flight.fromAirport || !flight.toAirport || !flight.estimatedAirfare
      )
      if (hasInvalidFlight) return false
    } else if (transportationType === 'BUS') {
      if (buses.length === 0) return false
      const hasInvalidBus = buses.some(bus => 
        !bus.date || !bus.busCompany || !bus.fromTerminal || !bus.toTerminal || !bus.estimatedFare
      )
      if (hasInvalidBus) return false
    } else if (transportationType === 'FERRY') {
      if (ferries.length === 0) return false
      const hasInvalidFerry = ferries.some(ferry => 
        !ferry.date || !ferry.ferryCompany || !ferry.fromTerminal || !ferry.toTerminal || !ferry.estimatedFare
      )
      if (hasInvalidFerry) return false
    } else if (transportationType === 'TRAIN') {
      if (trains.length === 0) return false
      const hasInvalidTrain = trains.some(train => 
        !train.date || !train.trainCompany || !train.fromTerminal || !train.toTerminal || !train.estimatedFare
      )
      if (hasInvalidTrain) return false
    }

    // Validate return trip if round-trip
    if (travelTypeRadio === 'round-trip') {
      if (!returnTransportationType) {
        return false
      }

      if (returnTransportationType === 'FLIGHT') {
        if (returnFlights.length === 0) return false
        const hasInvalidFlight = returnFlights.some(flight => 
          !flight.date || !flight.flightCompany || !flight.fromAirport || !flight.toAirport || !flight.estimatedAirfare
        )
        if (hasInvalidFlight) return false
      } else if (returnTransportationType === 'BUS') {
        if (returnBuses.length === 0) return false
        const hasInvalidBus = returnBuses.some(bus => 
          !bus.date || !bus.busCompany || !bus.fromTerminal || !bus.toTerminal || !bus.estimatedFare
        )
        if (hasInvalidBus) return false
      } else if (returnTransportationType === 'FERRY') {
        if (returnFerries.length === 0) return false
        const hasInvalidFerry = returnFerries.some(ferry => 
          !ferry.date || !ferry.ferryCompany || !ferry.fromTerminal || !ferry.toTerminal || !ferry.estimatedFare
        )
        if (hasInvalidFerry) return false
      } else if (returnTransportationType === 'TRAIN') {
        if (returnTrains.length === 0) return false
        const hasInvalidTrain = returnTrains.some(train => 
          !train.date || !train.trainCompany || !train.fromTerminal || !train.toTerminal || !train.estimatedFare
        )
        if (hasInvalidTrain) return false
      }
    }

    // Step 3: Accommodation validation (if accommodation is shown)
    if (showAccommodation && accommodations.length > 0) {
      const hasInvalidAccommodation = accommodations.some(acc => 
        !acc.hotelName.trim() || !acc.hotelLocation.trim() || !acc.membersList.trim() || 
        !acc.hotelRate.trim() || !acc.checkIn || !acc.checkOut
      )
      if (hasInvalidAccommodation) return false
    }

    return true
  }

  const formIsValid = isFormValid()

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
            Home / <span className="text-brand.violet">Travel Request</span>
          </nav>
          <h1 className="mt-2 text-3xl font-semibold text-charcoal">Travel Request</h1>
          <p className="text-sm text-text-muted">Submit your travel request for approval.</p>
        </div>
      </div>
      
      {/* Step Navigation Tabs */}
      <div className="rounded-3xl border border-card-border bg-white/80 p-4 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          {steps.map((step) => {
            const isActive = currentStep === step.id
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`flex-1 flex flex-col items-start rounded-2xl px-5 py-3 text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-[#8c4b2d] text-white shadow-md hover:bg-[#6f361f]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="font-semibold">
                  Step {step.id} · {step.title}
                </span>
                <span
                  className={`mt-0.5 text-xs ${
                    isActive ? 'text-white/80' : 'text-text-muted'
                  }`}
                >
                  {step.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* FORM START */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* INNER CONTAINER START - Contains all form sections */}
        <div className="space-y-6">
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

          {/* Step 1 - Travel Info */}
          {currentStep === 1 && (
            <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
              {/* Step 1 Label */}
              <p className={`text-xs font-semibold uppercase tracking-wider text-text-muted ${currentStep === 1 ? '' : 'hidden'}`}>
                Step 1 · Travel Details
              </p>

              {/* Travel Info */}
              <div
                className={`rounded-3xl border border-card-border bg-white/80 p-6 shadow-card ${
                  currentStep === 1 ? '' : 'hidden'
                }`}
              >
              <h2 className="mb-4 text-xl font-semibold text-charcoal">Travel Info</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
                    <Briefcase className="h-4 w-4" />
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm focus:border-brand.violet focus:outline-none"
                    placeholder="Enter destination"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm focus:border-brand.violet focus:outline-none"
                    placeholder="Enter reason"
                  />
                </div>

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

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
                    Travel Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={travelType}
                    onChange={(e) => setTravelType(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm focus:border-brand.violet focus:outline-none"
                  >
                    <option value="">-- Travel Type --</option>
                    <option value="MEETING">MEETING</option>
                    <option value="TRAINING">TRAINING</option>
                    <option value="EVENT">EVENT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
                    <Paperclip className="h-4 w-4" />
                    Attachment
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm focus:border-brand.violet focus:outline-none"
                    />
                    {attachments.length > 0 && (
                      <div className="space-y-1 rounded-xl bg-brand.sand/30 p-3 text-xs text-text-muted">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="truncate">{index + 1}: {file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <p className="mt-2 text-xs">Maximum per file is 2mb</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 text-sm font-semibold text-charcoal">
                    Travel Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="travelTypeRadio"
                        value="one-way"
                        checked={travelTypeRadio === 'one-way'}
                        onChange={(e) => setTravelTypeRadio(e.target.value as 'one-way' | 'round-trip')}
                        className="h-4 w-4 text-brand.violet focus:ring-brand.violet"
                      />
                      <span className="text-sm text-charcoal">One-Way</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="travelTypeRadio"
                        value="round-trip"
                        checked={travelTypeRadio === 'round-trip'}
                        onChange={(e) => setTravelTypeRadio(e.target.value as 'one-way' | 'round-trip')}
                        className="h-4 w-4 text-brand.violet focus:ring-brand.violet"
                      />
                      <span className="text-sm text-charcoal">Round-Trip</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Step 2 - Travel Details */}
          {currentStep === 2 && (
            <>
            {/* Going Trip Section */}
            <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-charcoal">Going Trip <span className="text-red-500">*</span></h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 text-sm font-semibold text-charcoal">
                    Transportation Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['FLIGHT', 'COMPANY CAR', 'BUS', 'FERRY', 'TRAIN', 'OTHER'].map((type) => (
                      <label key={type} className="flex items-center gap-2 rounded-xl border border-card-border bg-white p-3 cursor-pointer hover:bg-brand.sand/30">
                        <input
                          type="radio"
                          name="transportationType"
                          value={type}
                          checked={transportationType === type}
                          onChange={(e) => setTransportationType(e.target.value)}
                          className="h-4 w-4 text-brand.violet focus:ring-brand.violet"
                          required
                        />
                        <span className="text-sm text-charcoal">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* FLIGHT Info */}
                {transportationType === 'FLIGHT' && (
                  <div className="space-y-4 rounded-xl border border-card-border bg-brand.sand/30 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-charcoal">Flight Info</h3>
                      <button
                        type="button"
                        onClick={addFlight}
                        className="flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100"
                      >
                        + Flight
                      </button>
                    </div>
                    {flights.map((flight, index) => (
                      <div key={index} className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                        {flights.length > 1 && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeFlight(index)}
                              className="text-sm text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <Calendar className="h-3 w-3" />
                              Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={flight.date}
                              onChange={(e) => updateFlight(index, 'date', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <Building2 className="h-3 w-3" />
                              Flight Company <span className="text-red-500">*</span>
                            </label>
                            <select
                              required
                              value={flight.flightCompany}
                              onChange={(e) => updateFlight(index, 'flightCompany', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            >
                              <option value="">-- Flight Company --</option>
                              <option value="MALAYSIA AIRLINES">Malaysia Airlines</option>
                              <option value="AIRASIA">AirAsia</option>
                              <option value="FIREFLY">Firefly</option>
                              <option value="MASWINGS">MASwings</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <MapPin className="h-3 w-3" />
                              From Airport <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={flight.fromAirport}
                              onChange={(e) => updateFlight(index, 'fromAirport', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <MapPin className="h-3 w-3" />
                              To Airport <span className="text-red-500">*</span>
                            </label>
                            <select
                              required
                              value={flight.toAirport}
                              onChange={(e) => updateFlight(index, 'toAirport', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            >
                              <option value="">-- Airport --</option>
                              <option value="KUL">Kuala Lumpur (KUL)</option>
                              <option value="PEN">Penang (PEN)</option>
                              <option value="LGK">Langkawi (LGK)</option>
                              <option value="KBR">Kota Bharu (KBR)</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              Estimated Airfare <span className="text-red-500">*</span>
                            </label>
                            <div className="flex">
                              <span className="flex items-center rounded-l-lg border border-r-0 border-card-border bg-gray-50 px-3 text-sm text-text-muted">RM</span>
                              <input
                                type="text"
                                required
                                value={flight.estimatedAirfare}
                                onChange={(e) => updateFlight(index, 'estimatedAirfare', e.target.value)}
                                className="w-full rounded-r-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <FileText className="h-3 w-3" />
                              Flight No
                            </label>
                            <input
                              type="text"
                              value={flight.flightNo}
                              onChange={(e) => updateFlight(index, 'flightNo', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                            <Link2 className="h-3 w-3" />
                            Remark/Link
                          </label>
                          <input
                            type="text"
                            value={flight.remarkLink}
                            onChange={(e) => updateFlight(index, 'remarkLink', e.target.value)}
                            className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                      <h4 className="text-sm font-semibold text-charcoal">Luggage Info</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                            <FileText className="h-3 w-3" />
                            Luggage No (Total)
                          </label>
                          <input
                            type="text"
                            value={luggageNo}
                            onChange={(e) => setLuggageNo(e.target.value)}
                            className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                            <Luggage className="h-3 w-3" />
                            Luggage Weight
                          </label>
                          <input
                            type="text"
                            value={luggageWeight}
                            onChange={(e) => setLuggageWeight(e.target.value)}
                            className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* COMPANY CAR Info */}
                {transportationType === 'COMPANY CAR' && (
                  <div className="space-y-4 rounded-xl border border-card-border bg-brand.sand/30 p-4">
                    <h3 className="text-lg font-semibold text-charcoal">Pickup Info</h3>
                    <div className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                      <div>
                        <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                          <PlaneIcon className="h-3 w-3" />
                          Pickup Location/Address
                        </label>
                        <input
                          type="text"
                          value={pickupLocation}
                          onChange={(e) => setPickupLocation(e.target.value)}
                          placeholder="MERGONG"
                          className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                          <Calendar className="h-3 w-3" />
                          Pickup Date Time
                        </label>
                        <input
                          type="datetime-local"
                          value={pickupDateTime}
                          onChange={(e) => setPickupDateTime(e.target.value)}
                          className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs text-blue-800">
                        Please submit request vehicle form after submit this travel requisition.
                      </p>
                    </div>
                  </div>
                )}

                {/* BUS Info */}
                {transportationType === 'BUS' && (
                  <div className="space-y-4 rounded-xl border border-card-border bg-brand.sand/30 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-charcoal">Bus Info</h3>
                      <button
                        type="button"
                        onClick={addBus}
                        className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        + Station
                      </button>
                    </div>
                    {buses.map((bus, index) => (
                      <div key={index} className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                        {buses.length > 1 && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeBus(index)}
                              className="text-sm text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <Calendar className="h-3 w-3" />
                              Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={bus.date}
                              onChange={(e) => updateBus(index, 'date', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <FileText className="h-3 w-3" />
                              Bus Company <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={bus.busCompany}
                              onChange={(e) => updateBus(index, 'busCompany', e.target.value)}
                              placeholder="Enter Bus Company"
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-text-muted">e.g., Sani Express, Shahana Express, Mutiara Express</p>
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <MapPin className="h-3 w-3" />
                              From Terminal <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={bus.fromTerminal}
                              onChange={(e) => updateBus(index, 'fromTerminal', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <MapPin className="h-3 w-3" />
                              To Terminal <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={bus.toTerminal}
                              onChange={(e) => updateBus(index, 'toTerminal', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              Estimated Fare <span className="text-red-500">*</span>
                            </label>
                            <div className="flex">
                              <span className="flex items-center rounded-l-lg border border-r-0 border-card-border bg-gray-50 px-3 text-sm text-text-muted">RM</span>
                              <input
                                type="text"
                                required
                                value={bus.estimatedFare}
                                onChange={(e) => updateBus(index, 'estimatedFare', e.target.value)}
                                className="w-full rounded-r-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <FileText className="h-3 w-3" />
                              Ticket No.
                            </label>
                            <input
                              type="text"
                              value={bus.ticketNo}
                              onChange={(e) => updateBus(index, 'ticketNo', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                            <Link2 className="h-3 w-3" />
                            Remark/Link
                          </label>
                          <input
                            type="text"
                            value={bus.remarkLink}
                            onChange={(e) => updateBus(index, 'remarkLink', e.target.value)}
                            className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* FERRY Info */}
                {transportationType === 'FERRY' && (
                  <div className="space-y-4 rounded-xl border border-card-border bg-brand.sand/30 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-charcoal">Ferry Info</h3>
                      <button
                        type="button"
                        onClick={addFerry}
                        className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        + Station
                      </button>
                    </div>
                    {ferries.map((ferry, index) => (
                      <div key={index} className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                        {ferries.length > 1 && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeFerry(index)}
                              className="text-sm text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <Calendar className="h-3 w-3" />
                              Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={ferry.date}
                              onChange={(e) => updateFerry(index, 'date', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <FileText className="h-3 w-3" />
                              Ferry Company <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={ferry.ferryCompany}
                              onChange={(e) => updateFerry(index, 'ferryCompany', e.target.value)}
                              placeholder="Enter Ferry Company"
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-text-muted">e.g., Sani Ferry, Langkawi Ferry Line Ventures</p>
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <MapPin className="h-3 w-3" />
                              From Terminal <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={ferry.fromTerminal}
                              onChange={(e) => updateFerry(index, 'fromTerminal', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <MapPin className="h-3 w-3" />
                              To Terminal <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={ferry.toTerminal}
                              onChange={(e) => updateFerry(index, 'toTerminal', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              Estimated Fare <span className="text-red-500">*</span>
                            </label>
                            <div className="flex">
                              <span className="flex items-center rounded-l-lg border border-r-0 border-card-border bg-gray-50 px-3 text-sm text-text-muted">RM</span>
                              <input
                                type="text"
                                required
                                value={ferry.estimatedFare}
                                onChange={(e) => updateFerry(index, 'estimatedFare', e.target.value)}
                                className="w-full rounded-r-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <FileText className="h-3 w-3" />
                              Ticket No.
                            </label>
                            <input
                              type="text"
                              value={ferry.ticketNo}
                              onChange={(e) => updateFerry(index, 'ticketNo', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                            <Link2 className="h-3 w-3" />
                            Remark/Link
                          </label>
                          <input
                            type="text"
                            value={ferry.remarkLink}
                            onChange={(e) => updateFerry(index, 'remarkLink', e.target.value)}
                            className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TRAIN Info */}
                {transportationType === 'TRAIN' && (
                  <div className="space-y-4 rounded-xl border border-card-border bg-brand.sand/30 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-charcoal">Train Info</h3>
                      <button
                        type="button"
                        onClick={addTrain}
                        className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        + Station
                      </button>
                    </div>
                    {trains.map((train, index) => (
                      <div key={index} className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                        {trains.length > 1 && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeTrain(index)}
                              className="text-sm text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <Calendar className="h-3 w-3" />
                              Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={train.date}
                              onChange={(e) => updateTrain(index, 'date', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <FileText className="h-3 w-3" />
                              Train Company <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={train.trainCompany}
                              onChange={(e) => updateTrain(index, 'trainCompany', e.target.value)}
                              placeholder="e.g., Komuter or ETS"
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <MapPin className="h-3 w-3" />
                              From Terminal <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={train.fromTerminal}
                              onChange={(e) => updateTrain(index, 'fromTerminal', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <MapPin className="h-3 w-3" />
                              To Terminal <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={train.toTerminal}
                              onChange={(e) => updateTrain(index, 'toTerminal', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              Estimated Fare <span className="text-red-500">*</span>
                            </label>
                            <div className="flex">
                              <span className="flex items-center rounded-l-lg border border-r-0 border-card-border bg-gray-50 px-3 text-sm text-text-muted">RM</span>
                              <input
                                type="text"
                                required
                                value={train.estimatedFare}
                                onChange={(e) => updateTrain(index, 'estimatedFare', e.target.value)}
                                className="w-full rounded-r-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <FileText className="h-3 w-3" />
                              Ticket No.
                            </label>
                            <input
                              type="text"
                              value={train.ticketNo}
                              onChange={(e) => updateTrain(index, 'ticketNo', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                            <Link2 className="h-3 w-3" />
                            Remark/Link
                          </label>
                          <input
                            type="text"
                            value={train.remarkLink}
                            onChange={(e) => updateTrain(index, 'remarkLink', e.target.value)}
                            className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
            {/* Return Trip Section (shown for Round-Trip only) */}
            {travelTypeRadio === 'round-trip' && (
              <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-charcoal">
                    Return Trip <span className="text-red-500">*</span>
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 text-sm font-semibold text-charcoal">
                      Transportation Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['FLIGHT', 'COMPANY CAR', 'BUS', 'FERRY', 'TRAIN', 'OTHER'].map((type) => (
                        <label
                          key={type}
                          className="flex items-center gap-2 rounded-xl border border-card-border bg-white p-3 cursor-pointer hover:bg-brand.sand/30"
                        >
                          <input
                            type="radio"
                            name="returnTransportationType"
                            value={type}
                            checked={returnTransportationType === type}
                            onChange={(e) => setReturnTransportationType(e.target.value)}
                            className="h-4 w-4 text-brand.violet focus:ring-brand.violet"
                            required
                          />
                          <span className="text-sm text-charcoal">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* FLIGHT Info (Return) */}
                  {returnTransportationType === 'FLIGHT' && (
                    <div className="space-y-4 rounded-xl border border-card-border bg-brand.sand/30 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-charcoal">Flight Info (Return)</h3>
                        <button
                          type="button"
                          onClick={addReturnFlight}
                          className="flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100"
                        >
                          + Flight
                        </button>
                      </div>
                      {returnFlights.map((flight, index) => (
                        <div key={index} className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                          {returnFlights.length > 1 && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeReturnFlight(index)}
                                className="text-sm text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <Calendar className="h-3 w-3" />
                                Date <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                value={flight.date}
                                onChange={(e) => updateReturnFlight(index, 'date', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <Building2 className="h-3 w-3" />
                                Flight Company <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={flight.flightCompany}
                                onChange={(e) => updateReturnFlight(index, 'flightCompany', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              >
                                <option value="">-- Flight Company --</option>
                                <option value="MALAYSIA AIRLINES">Malaysia Airlines</option>
                                <option value="AIRASIA">AirAsia</option>
                                <option value="FIREFLY">Firefly</option>
                                <option value="MASWINGS">MASwings</option>
                                <option value="OTHER">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <MapPin className="h-3 w-3" />
                                From Airport <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={flight.fromAirport}
                                onChange={(e) => updateReturnFlight(index, 'fromAirport', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <MapPin className="h-3 w-3" />
                                To Airport <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={flight.toAirport}
                                onChange={(e) => updateReturnFlight(index, 'toAirport', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              >
                                <option value="">-- Airport --</option>
                                <option value="KUL">Kuala Lumpur (KUL)</option>
                                <option value="PEN">Penang (PEN)</option>
                                <option value="LGK">Langkawi (LGK)</option>
                                <option value="KBR">Kota Bharu (KBR)</option>
                                <option value="OTHER">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                Estimated Airfare <span className="text-red-500">*</span>
                              </label>
                              <div className="flex">
                                <span className="flex items-center rounded-l-lg border border-r-0 border-card-border bg-gray-50 px-3 text-sm text-text-muted">
                                  RM
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={flight.estimatedAirfare}
                                  onChange={(e) => updateReturnFlight(index, 'estimatedAirfare', e.target.value)}
                                  className="w-full rounded-r-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <FileText className="h-3 w-3" />
                                Flight No
                              </label>
                              <input
                                type="text"
                                value={flight.flightNo}
                                onChange={(e) => updateReturnFlight(index, 'flightNo', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <Link2 className="h-3 w-3" />
                              Remark/Link
                            </label>
                            <input
                              type="text"
                              value={flight.remarkLink}
                              onChange={(e) => updateReturnFlight(index, 'remarkLink', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                        <h4 className="text-sm font-semibold text-charcoal">Luggage Info (Return)</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <FileText className="h-3 w-3" />
                              Luggage No (Total)
                            </label>
                            <input
                              type="text"
                              value={returnLuggageNo}
                              onChange={(e) => setReturnLuggageNo(e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <Luggage className="h-3 w-3" />
                              Luggage Weight
                            </label>
                            <input
                              type="text"
                              value={returnLuggageWeight}
                              onChange={(e) => setReturnLuggageWeight(e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COMPANY CAR Info (Return) */}
                  {returnTransportationType === 'COMPANY CAR' && (
                    <div className="space-y-4 rounded-xl border border-card-border bg-brand.sand/30 p-4">
                      <h3 className="text-lg font-semibold text-charcoal">Pickup Info (Return)</h3>
                      <div className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                        <div>
                          <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                            <PlaneIcon className="h-3 w-3" />
                            Pickup Location/Address
                          </label>
                          <input
                            type="text"
                            value={returnPickupLocation}
                            onChange={(e) => setReturnPickupLocation(e.target.value)}
                            placeholder="MERGONG"
                            className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                            <Calendar className="h-3 w-3" />
                            Pickup Date Time
                          </label>
                          <input
                            type="datetime-local"
                            value={returnPickupDateTime}
                            onChange={(e) => setReturnPickupDateTime(e.target.value)}
                            className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs text-blue-800">
                          Please submit request vehicle form after submit this travel requisition.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* BUS Info (Return) */}
                  {returnTransportationType === 'BUS' && (
                    <div className="space-y-4 rounded-xl border border-card-border bg-brand.sand/30 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-charcoal">Bus Info (Return)</h3>
                        <button
                          type="button"
                          onClick={addReturnBus}
                          className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          + Station
                        </button>
                      </div>
                      {returnBuses.map((bus, index) => (
                        <div key={index} className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                          {returnBuses.length > 1 && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeReturnBus(index)}
                                className="text-sm text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <Calendar className="h-3 w-3" />
                                Date <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                value={bus.date}
                                onChange={(e) => updateReturnBus(index, 'date', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <FileText className="h-3 w-3" />
                                Bus Company <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={bus.busCompany}
                                onChange={(e) => updateReturnBus(index, 'busCompany', e.target.value)}
                                placeholder="Enter Bus Company"
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                              <p className="mt-1 text-xs text-text-muted">
                                e.g., Sani Express, Shahana Express, Mutiara Express
                              </p>
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <MapPin className="h-3 w-3" />
                                From Terminal <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={bus.fromTerminal}
                                onChange={(e) => updateReturnBus(index, 'fromTerminal', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <MapPin className="h-3 w-3" />
                                To Terminal <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={bus.toTerminal}
                                onChange={(e) => updateReturnBus(index, 'toTerminal', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                Estimated Fare <span className="text-red-500">*</span>
                              </label>
                              <div className="flex">
                                <span className="flex items-center rounded-l-lg border border-r-0 border-card-border bg-gray-50 px-3 text-sm text-text-muted">
                                  RM
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={bus.estimatedFare}
                                  onChange={(e) => updateReturnBus(index, 'estimatedFare', e.target.value)}
                                  className="w-full rounded-r-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <FileText className="h-3 w-3" />
                                Ticket No.
                              </label>
                              <input
                                type="text"
                                value={bus.ticketNo}
                                onChange={(e) => updateReturnBus(index, 'ticketNo', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <Link2 className="h-3 w-3" />
                              Remark/Link
                            </label>
                            <input
                              type="text"
                              value={bus.remarkLink}
                              onChange={(e) => updateReturnBus(index, 'remarkLink', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FERRY Info (Return) */}
                  {returnTransportationType === 'FERRY' && (
                    <div className="space-y-4 rounded-xl border border-card-border bg-brand.sand/30 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-charcoal">Ferry Info (Return)</h3>
                        <button
                          type="button"
                          onClick={addReturnFerry}
                          className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          + Station
                        </button>
                      </div>
                      {returnFerries.map((ferry, index) => (
                        <div key={index} className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                          {returnFerries.length > 1 && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeReturnFerry(index)}
                                className="text-sm text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <Calendar className="h-3 w-3" />
                                Date <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                value={ferry.date}
                                onChange={(e) => updateReturnFerry(index, 'date', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <FileText className="h-3 w-3" />
                                Ferry Company <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={ferry.ferryCompany}
                                onChange={(e) => updateReturnFerry(index, 'ferryCompany', e.target.value)}
                                placeholder="Enter Ferry Company"
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                              <p className="mt-1 text-xs text-text-muted">
                                e.g., Sani Ferry, Langkawi Ferry Line Ventures
                              </p>
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <MapPin className="h-3 w-3" />
                                From Terminal <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={ferry.fromTerminal}
                                onChange={(e) => updateReturnFerry(index, 'fromTerminal', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <MapPin className="h-3 w-3" />
                                To Terminal <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={ferry.toTerminal}
                                onChange={(e) => updateReturnFerry(index, 'toTerminal', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                Estimated Fare <span className="text-red-500">*</span>
                              </label>
                              <div className="flex">
                                <span className="flex items-center rounded-l-lg border border-r-0 border-card-border bg-gray-50 px-3 text-sm text-text-muted">
                                  RM
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={ferry.estimatedFare}
                                  onChange={(e) => updateReturnFerry(index, 'estimatedFare', e.target.value)}
                                  className="w-full rounded-r-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <FileText className="h-3 w-3" />
                                Ticket No.
                              </label>
                              <input
                                type="text"
                                value={ferry.ticketNo}
                                onChange={(e) => updateReturnFerry(index, 'ticketNo', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <Link2 className="h-3 w-3" />
                              Remark/Link
                            </label>
                            <input
                              type="text"
                              value={ferry.remarkLink}
                              onChange={(e) => updateReturnFerry(index, 'remarkLink', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TRAIN Info (Return) */}
                  {returnTransportationType === 'TRAIN' && (
                    <div className="space-y-4 rounded-xl border border-card-border bg-brand.sand/30 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-charcoal">Train Info (Return)</h3>
                        <button
                          type="button"
                          onClick={addReturnTrain}
                          className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          + Station
                        </button>
                      </div>
                      {returnTrains.map((train, index) => (
                        <div key={index} className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                          {returnTrains.length > 1 && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeReturnTrain(index)}
                                className="text-sm text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <Calendar className="h-3 w-3" />
                                Date <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                value={train.date}
                                onChange={(e) => updateReturnTrain(index, 'date', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <FileText className="h-3 w-3" />
                                Train Company <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={train.trainCompany}
                                onChange={(e) => updateReturnTrain(index, 'trainCompany', e.target.value)}
                                placeholder="e.g., Komuter or ETS"
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <MapPin className="h-3 w-3" />
                                From Terminal <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={train.fromTerminal}
                                onChange={(e) => updateReturnTrain(index, 'fromTerminal', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <MapPin className="h-3 w-3" />
                                To Terminal <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={train.toTerminal}
                                onChange={(e) => updateReturnTrain(index, 'toTerminal', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                Estimated Fare <span className="text-red-500">*</span>
                              </label>
                              <div className="flex">
                                <span className="flex items-center rounded-l-lg border border-r-0 border-card-border bg-gray-50 px-3 text-sm text-text-muted">
                                  RM
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={train.estimatedFare}
                                  onChange={(e) => updateReturnTrain(index, 'estimatedFare', e.target.value)}
                                  className="w-full rounded-r-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                                <FileText className="h-3 w-3" />
                                Ticket No.
                              </label>
                              <input
                                type="text"
                                value={train.ticketNo}
                                onChange={(e) => updateReturnTrain(index, 'ticketNo', e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                              <Link2 className="h-3 w-3" />
                              Remark/Link
                            </label>
                            <input
                              type="text"
                              value={train.remarkLink}
                              onChange={(e) => updateReturnTrain(index, 'remarkLink', e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            </>
          )}

          {/* Step 3 - Accommodation Info */}
          {currentStep === 3 && (
            <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-charcoal">Accommodation Info</h2>
                <button
                  type="button"
                  onClick={() => setShowAccommodation(!showAccommodation)}
                  className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  {showAccommodation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showAccommodation ? 'Hide Accommodation' : 'Add Accommodation'}
                </button>
              </div>
              <div
                className={`space-y-4 rounded-xl border border-card-border bg-brand.sand/30 p-4 ${
                  showAccommodation ? '' : 'hidden'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-muted">
                    Use this section to record hotel details for this trip (both going and return).
                  </p>
                  <button
                    type="button"
                    onClick={addAccommodation}
                    className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    + Add More
                  </button>
                </div>
                {accommodations.map((acc, index) => (
                  <div key={index} className="space-y-3 rounded-xl border border-card-border bg-white p-4">
                    {accommodations.length > 1 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeAccommodation(index)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                          <Hotel className="h-3 w-3" />
                          Hotel Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={acc.hotelName}
                          onChange={(e) => updateAccommodation(index, 'hotelName', e.target.value)}
                          className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                          <MapPin className="h-3 w-3" />
                          Hotel Location <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={acc.hotelLocation}
                          onChange={(e) => updateAccommodation(index, 'hotelLocation', e.target.value)}
                          className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                          <Users className="h-3 w-3" />
                          Members List <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={acc.membersList}
                          onChange={(e) => updateAccommodation(index, 'membersList', e.target.value)}
                          className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                          Hotel Rate <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={acc.hotelRate}
                          onChange={(e) => updateAccommodation(index, 'hotelRate', e.target.value)}
                          placeholder="RM"
                          className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                          <Calendar className="h-3 w-3" />
                          Check In <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={acc.checkIn}
                          onChange={(e) => updateAccommodation(index, 'checkIn', e.target.value)}
                          className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                          <Calendar className="h-3 w-3" />
                          Check Out <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={acc.checkOut}
                          onChange={(e) => updateAccommodation(index, 'checkOut', e.target.value)}
                          className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-charcoal">
                        <Link2 className="h-3 w-3" />
                        Remark/Link
                      </label>
                      <input
                        type="text"
                        value={acc.remarkLink}
                        onChange={(e) => updateAccommodation(index, 'remarkLink', e.target.value)}
                        className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 - Meal Allowance Summary Only */}
          {currentStep === 4 && (
            <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
              <h2 className="mb-1 text-xl font-semibold text-charcoal">Meal Allowance Summary</h2>
              <p className="mb-4 text-xs text-text-muted">
                Based on your travel dates, review which meals are eligible and mark those provided for free.
              </p>
              
              <div className="space-y-4">
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2">
                  <p className="text-xs text-blue-800">
                    Allowances are provided for breakfast at 9:00 am, lunch from 12:00 pm to 2:00 pm, and dinner after 7:30 pm.
                    Amounts: Breakfast RM20, Lunch RM30, Dinner RM30.
                  </p>
                  <p className="text-xs text-blue-800">
                    Check the boxes below if a meal is provided for free. The system will exclude that meal from the allowance.
                  </p>
                </div>

                {mealDays.length > 0 && (
                  <div className="space-y-3 rounded-2xl border border-card-border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-charcoal">Meal Allowance Summary</h3>
                      <span className="text-sm font-semibold text-brand.violet">Total: RM{totalMealAllowance.toFixed(2)}</span>
                    </div>
                    <div className="space-y-4">
                      {mealDays.map((day) => (
                        <div key={day.date} className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-brand.violet" />
                            <span className="font-semibold text-charcoal">{day.date}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => {
                              const labels = { breakfast: 'B', lunch: 'L', dinner: 'D' }
                              const amount = meal === 'breakfast' ? 20 : meal === 'lunch' ? 30 : 30
                              const isEligible = day.eligible[meal]
                              const isProvided = day.provided[meal]
                              return (
                                <label
                                  key={meal}
                                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                                    isEligible ? 'border-card-border bg-white' : 'border-dashed border-gray-300 bg-gray-50 text-gray-400'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{labels[meal]}</span>
                                    <span className="text-xs">{amount === 20 ? 'Breakfast' : meal === 'lunch' ? 'Lunch' : 'Dinner'} (RM{amount})</span>
                                  </div>
                                  <input
                                    type="checkbox"
                                    disabled={!isEligible}
                                    checked={isProvided}
                                    onChange={() => toggleMealProvided(day.date, meal)}
                                    className="h-4 w-4 text-brand.violet focus:ring-brand.violet"
                                  />
                                </label>
                              )
                            })}
                          </div>
                          <p className="text-xs text-text-muted">
                            {day.eligible.breakfast || day.eligible.lunch || day.eligible.dinner
                              ? 'Eligible meals are shown in white. Tick the box if meal is provided.'
                              : 'Not eligible for meal allowance on this date.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3">
            {!formIsValid && (
              <p className="text-xs text-text-muted">
                Please fill all required fields to submit
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !formIsValid}
              className="flex items-center gap-2 rounded-xl bg-[#8c4b2d] px-8 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-[#6f361f] disabled:bg-[#8c4b2d]/60 disabled:cursor-not-allowed"
              title={!formIsValid ? 'Please fill all required fields' : ''}
            >
              <Lock className="h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Register'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

