import { http } from '../client'
import type { ApiEnvelope, AuthResult, SignupInput, User } from '../types'

export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    const response = await http.post<ApiEnvelope<AuthResult>>('/auth/login', { email, password })
    return response.data.data
  },

  async signup(data: SignupInput): Promise<AuthResult> {
    const response = await http.post<ApiEnvelope<AuthResult>>('/auth/signup', data)
    return response.data.data
  },

  async me(): Promise<User> {
    const response = await http.get<ApiEnvelope<User>>('/auth/me')
    return response.data.data
  },
}
