import { useCallback, useEffect, useState } from 'react'
import { bookingService } from './api'
import type { Booking } from './api'
import AuthForm from './components/AuthForm'
import BookingPanel from './components/BookingPanel'
import MyBookings from './components/MyBookings'
import TimezoneSelect from './components/TimezoneSelect'
import { useAuth } from './context/useAuth'
import { browserTimezone } from './time'

async function fetchMyBookings(): Promise<Booking[]> {
  try {
    return await bookingService.mine()
  } catch {
    return []
  }
}

function App() {
  const { user, checking, logout: endSession } = useAuth()
  const [timezone, setTimezone] = useState(browserTimezone())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [availabilityKey, setAvailabilityKey] = useState(0)

  const logout = () => {
    endSession()
    setBookings([])
  }

  const loadBookings = useCallback(async () => {
    const list = await fetchMyBookings()
    setBookings(list)
  }, [])

  useEffect(() => {
    if (!user) return
    const loadOnLogin = async () => {
      const list = await fetchMyBookings()
      setBookings(list)
    }
    loadOnLogin()
  }, [user])

  const changeTimezone = (value: string) => {
    setTimezone(value)
  }

  const cancel = async (id: number) => {
    await bookingService.cancel(id)
    await loadBookings()
    setAvailabilityKey((key) => key + 1)
  }

  if (checking) return null

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {!user ? (
        <AuthForm />
      ) : (
        <>
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="font-semibold">Resource Booking</span>
              <div className="flex flex-wrap items-center gap-4">
                <TimezoneSelect value={timezone} onChange={changeTimezone} />
                <span className="text-sm text-gray-600">{user.email}</span>
                <button type="button" onClick={logout} className="text-sm text-blue-600 hover:underline">
                  Log out
                </button>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
            <BookingPanel timezone={timezone} onBooked={loadBookings} availabilityKey={availabilityKey} />
            <MyBookings bookings={bookings} timezone={timezone} onCancel={cancel} />
          </main>
        </>
      )}
    </div>
  )
}

export default App
