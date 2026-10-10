import { useEffect, useState } from 'react'
import { api, ApiError } from '../api'
import type { AvailabilityResponse, Resource, Slot } from '../api'
import { dateIn, formatDateTime, formatDay, formatSlotRange, formatTime, formatZone, todayIn } from '../time'

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

  // On a DST fall-back night the same local start time occurs twice (at different instants);
  // those slots show their zone so the two can be told apart.
  const hasRepeatedStart = (slot: Slot) =>
    (availability?.slots ?? []).filter(
      (other) => formatTime(other.startTime, timezone) === formatTime(slot.startTime, timezone),
    ).length > 1

  const slotLabel = (slot: Slot) => formatSlotRange(slot.startTime, slot.endTime, timezone, hasRepeatedStart(slot))

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
        text: `Booked ${resource?.name} for ${formatDateTime(selected.startTime, timezone)} ${formatZone(selected.startTime, timezone)}.`,
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-2">
          {availability.slots.map((slot) => {
            const booked = slot.status === 'booked'
            const isSelected = selected?.startTime === slot.startTime
            // Slots are instants; show them in the viewer's timezone.
            const label = `${formatTime(slot.startTime, timezone)}-${formatTime(slot.endTime, timezone)}`
            const resourceLabel = `${slot.resourceLocal.start}-${slot.resourceLocal.end}`
            // The viewer's calendar day can differ from the resource's (e.g. after midnight in India).
            const otherDay = dateIn(slot.startTime, timezone) !== date
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
                {otherDay && (
                  <span className="block text-xs font-normal opacity-75">{formatDay(slot.startTime, timezone)}</span>
                )}
                <span className="block whitespace-nowrap">{slotLabel(slot)}</span>
                {label !== resourceLabel && (
                  <span className="block text-xs font-normal opacity-75">
                    {resourceLabel} {resource?.timezone}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-blue-200 bg-blue-50 px-3 py-2">
          <span className="text-sm">
            {resource?.name}: {formatDay(selected.startTime, timezone)},{' '}
            {formatSlotRange(selected.startTime, selected.endTime, timezone, true)}
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
