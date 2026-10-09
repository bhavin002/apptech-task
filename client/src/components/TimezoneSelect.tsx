import { allTimezones } from '../time'

interface Props {
  value: string
  onChange: (timezone: string) => void
}

const timezones = allTimezones()

export default function TimezoneSelect({ value, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-gray-600">Display timezone</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1"
      >
        {!timezones.includes(value) && <option value={value}>{value}</option>}
        {timezones.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
    </label>
  )
}
