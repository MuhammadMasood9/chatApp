export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export const formatDate = (iso: string): string => new Date(iso).toLocaleDateString()
