import axios, { AxiosError } from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let token: string | null = localStorage.getItem('token')

export const setToken = (value: string | null) => {
  token = value
  if (value) localStorage.setItem('token', value)
  else localStorage.removeItem('token')
}

export const hasToken = () => token !== null

export const http = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; data?: unknown }>) => {
    if (!error.response) {
      return Promise.reject(new ApiError(0, 'Could not reach the server. Please check your connection.'))
    }
    const { status, data } = error.response
    const details = Array.isArray(data?.data) && data.data.length ? `: ${data.data.join(', ')}` : ''
    return Promise.reject(new ApiError(status, (data?.message ?? 'Request failed') + details))
  },
)
