import { useCallback, useRef, useEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { presenceDbService } from '@/services/presenceDbService'

export const useTypingIndicator = (roomId: string | null) => {
  const { user } = useAppSelector(state => state.auth)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!roomId || !user) return

    if (isTyping) {
      presenceDbService.setTyping(user.id, true)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        presenceDbService.setTyping(user.id, false)
        typingTimeoutRef.current = null
      }, 3000)
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      presenceDbService.setTyping(user.id, false)
    }
  }, [roomId, user])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (user) {
        presenceDbService.setTyping(user.id, false)
      }
    }
  }, [user])

  return { sendTypingIndicator }
}
