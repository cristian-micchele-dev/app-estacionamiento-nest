export function formatTime(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export function elapsed(from: string | Date): string {
  const date = typeof from === 'string' ? new Date(from) : from
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
}

export function relativeTime(from: string | Date): string {
  const date = typeof from === 'string' ? new Date(from) : from
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  return m > 0 ? `hace ${h}h ${m}m` : `hace ${h}h`
}

export function isToday(d: string | Date): boolean {
  const date = typeof d === 'string' ? new Date(d) : d
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
