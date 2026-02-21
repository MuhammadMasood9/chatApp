export const getInitials = (value: string, fallback = '??'): string => {
  const v = value.trim()
  if (!v) return fallback

  const parts = v.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const getFirstLetter = (value: string | undefined, fallback = 'U'): string => {
  return value?.charAt(0).toUpperCase() || fallback
}
