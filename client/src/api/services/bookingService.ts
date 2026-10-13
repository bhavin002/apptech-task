import { http } from '../client'
import type { ApiEnvelope, Booking } from '../types'

export const bookingService = {
  async mine(): Promise<Booking[]> {
    const response = await http.get<ApiEnvelope<Booking[]>>('/bookings')
    return response.data.data
  },

  async create(resourceId: number, startTime: string, endTime: string): Promise<Booking> {
    const response = await http.post<ApiEnvelope<Booking>>('/bookings', { resourceId, startTime, endTime })
    return response.data.data
  },

  async cancel(id: number): Promise<void> {
    await http.delete(`/bookings/${id}`)
  },
}
