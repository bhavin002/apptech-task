export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  role: number // 0 = user, 1 = admin
}

export interface Resource {
  id: number
  name: string
  timezone: string
}

export interface Slot {
  startTime: string
  endTime: string
  status: 'available' | 'booked' | 'past'
  resourceLocal: { start: string; end: string; utcOffset: string }
}

export interface AvailabilityResponse {
  resource: Resource
  date: string
  slotMinutes: number
  slots: Slot[]
}

export interface Booking {
  id: number
  resourceId: number
  startTime: string
  endTime: string
  resource?: Resource
}

export interface AuthResult {
  user: User
  token: string
}

export interface SignupInput {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface ApiEnvelope<T> {
  message?: string
  data: T
}
