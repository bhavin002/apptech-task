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
  }).format(new Date(iso))

export const todayIn = (timeZone: string) => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
