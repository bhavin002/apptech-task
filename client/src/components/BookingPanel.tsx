import { useEffect, useState } from 'react'
import { api, ApiError } from '../api'
import type { AvailabilityResponse, Resource, Slot } from '../api'
import { formatDateTime, formatTime, todayIn } from '../time'

interface Props {
  timezone: string
  onBooked: () => void
}

type Message = { kind: 'success' | 'error'; text: string } | null

export default function BookingPanel({ timezone, onBooked }: Props) {
  const [resources, setResources] = useState<Resource[]>([])
  const [resourceId, setResourceId] = useState<number | null>(null)
  const [date, setDate] = useState('')
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [selected, setSelected] = useState<Slot | null>(null)
  const [message, setMessage] = useState<Message>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const resource = resources.find((r) => r.id === resourceId)

  useEffect(() => {
    api
      .resources()
      .then((list) => {
        setResources(list)
        if (list.length) {
          setResourceId(list[0].id)
          setDate(todayIn(list[0].timezone))
        }
      })
      .catch((err) => setMessage({ kind: 'error', text: err.message }))
  }, [])

  useEffect(() => {
    if (!resourceId || !date) return
    let active = true
    api
      .availability(resourceId, date)
      .then((data) => active && setAvailability(data))
      .catch((err) => {
        if (!active) return
        setAvailability(null)
        setMessage({ kind: 'error', text: err.message })
      })
    return () => {
      active = false
    }
  }, [resourceId, date, refreshKey])

  const confirm = async () => {
    if (!selected || !resourceId) return
    setMessage(null)
    try {
      await api.book(resourceId, selected.startTime, selected.endTime)
      setMessage({
        kind: 'success',
        text: `Booked ${resource?.name} for ${formatDateTime(selected.startTime, timezone)}.`,
      })
      onBooked()
    } catch (err) {
      const text =
        err instanceof ApiError && err.status === 409
          ? 'Sorry, someone else booked this slot a moment ago. Please choose another one.'
          : (err as Error).message
      setMessage({ kind: 'error', text })
    }
    setSelected(null)
    setRefreshKey((key) => key + 1)
  }

  return (
    <section className="rounded-lg bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-semibold">Book a slot</h2>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Resource</span>
          <select
            value={resourceId ?? ''}
            onChange={(e) => {
              setSelected(null)
              setResourceId(Number(e.target.value))
            }}
            className="rounded border border-gray-300 px-2 py-1"
          >
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.timezone})
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Date (in {resource?.timezone ?? 'resource'} time)</span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setSelected(null)
              setDate(e.target.value)
            }}
            className="rounded border border-gray-300 px-2 py-1"
          />
        </label>
      </div>

      <p className="mb-3 text-sm text-gray-600">
        Times shown in <span className="font-medium text-gray-900">{timezone}</span>.
      </p>

      {message && (
        <div
          className={`mb-4 rounded px-3 py-2 text-sm ${message.kind === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
        >
          {message.text}
        </div>
      )}

      {availability && availability.slots.length === 0 && (
        <p className="text-sm text-gray-500">No availability on this day.</p>
      )}

      {availability && availability.slots.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {availability.slots.map((slot) => {
            const booked = slot.status === 'booked'
            const isSelected = selected?.startTime === slot.startTime
            return (
              <button
                key={slot.startTime}
                type="button"
                disabled={booked}
                onClick={() => setSelected(slot)}
                className={`rounded border px-3 py-2 text-center text-sm font-medium ${booked
                  ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through'
                  : isSelected
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 hover:border-blue-500'
                  }`}
              >
                {slot.resourceLocal.start}-{slot.resourceLocal.end}
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-blue-200 bg-blue-50 px-3 py-2">
          <span className="text-sm">
            {resource?.name}: {formatDateTime(selected.startTime, timezone)} – {formatTime(selected.endTime, timezone)}
          </span>
          <button
            type="button"
            onClick={confirm}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Confirm booking
          </button>
        </div>
      )}
    </section>
  )
}
