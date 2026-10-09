import { useCallback, useEffect, useState } from 'react'
import { api, hasToken, setToken } from './api'
import type { Booking, User } from './api'
import AuthForm from './components/AuthForm'
import BookingPanel from './components/BookingPanel'
import MyBookings from './components/MyBookings'
import TimezoneSelect from './components/TimezoneSelect'
import { browserTimezone } from './time'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(hasToken())
  const [timezone, setTimezone] = useState(browserTimezone())
  const [bookings, setBookings] = useState<Booking[]>([])

  const showUser = (loggedIn: User) => {
    setUser(loggedIn)
  }

  const login = (loggedIn: User, token: string) => {
    setToken(token)
    showUser(loggedIn)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setBookings([])
  }

  const loadBookings = useCallback(() => {
    api.myBookings().then(setBookings).catch(() => setBookings([]))
  }, [])

  useEffect(() => {
    if (!hasToken()) return
    api
      .me()
      .then(showUser)
      .catch(() => setToken(null))
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (user) loadBookings()
  }, [user, loadBookings])

  const changeTimezone = (value: string) => {
    setTimezone(value)
  }

  const cancel = async (id: number) => {
    await api.cancel(id)
    loadBookings()
  }

  if (checking) return null

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {!user ? (
        <AuthForm onAuthenticated={login} />
      ) : (
        <>
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
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
          <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
            <BookingPanel timezone={timezone} onBooked={loadBookings} />
            <MyBookings bookings={bookings} timezone={timezone} onCancel={cancel} />
          </main>
        </>
      )}
    </div>
  )
}

export default App
