export const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export const allTimezones = (): string[] => {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf
  return supported ? supported('timeZone') : [browserTimezone(), 'UTC']
}

export const formatTime = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))

export const formatDateTime = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))

// Short calendar day, e.g. "Tue, 13 Oct".
export const formatDay = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso))

// UTC offset of an instant in the given timezone, e.g. "GMT+1".
export const formatOffset = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(new Date(iso))
    .find((part) => part.type === 'timeZoneName')?.value ?? ''

// UTC offset of an instant, e.g. "UTC+1", "UTC-4", "UTC+5:30", "UTC+0".
export const formatUtcOffset = (iso: string, timeZone: string) => {
  const offset = formatOffset(iso, timeZone) // "GMT+1", or "GMT" for zero
  return offset === 'GMT' ? 'UTC+0' : offset.replace('GMT', 'UTC')
}

// Offset label shown next to a time, e.g. "(UTC+1)".
export const formatZone = (iso: string, timeZone: string) => `(${formatUtcOffset(iso, timeZone)})`

export const formatSlotRange = (startIso: string, endIso: string, timeZone: string, showZone = false) => {
  const start = formatTime(startIso, timeZone)
  const end = formatTime(endIso, timeZone)

  if (formatOffset(startIso, timeZone) !== formatOffset(endIso, timeZone)) {
    return `${start} ${formatZone(startIso, timeZone)} → ${end} ${formatZone(endIso, timeZone)}`
  }

  return showZone ? `${start}-${end} ${formatZone(startIso, timeZone)}` : `${start}-${end}`
}

// Calendar date (YYYY-MM-DD) of an instant in the given timezone.
export const dateIn = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(iso),
  )

export const todayIn = (timeZone: string) => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
