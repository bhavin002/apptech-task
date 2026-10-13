import { http } from '../client'
import type { ApiEnvelope, AvailabilityResponse, Resource } from '../types'

export const resourceService = {
  async list(): Promise<Resource[]> {
    const response = await http.get<ApiEnvelope<Resource[]>>('/resources')
    return response.data.data
  },

  async availability(resourceId: number, date: string): Promise<AvailabilityResponse> {
    const response = await http.get<ApiEnvelope<AvailabilityResponse>>(`/resources/${resourceId}/availability`, {
      params: { date },
    })
    return response.data.data
  },
}
