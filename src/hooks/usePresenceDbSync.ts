import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setOnlineUsers, setUserPresence } from '@/store/slices/presenceSlice'
import { presenceDbService, type PresenceRow, type PresenceWithProfile } from '@/services/presenceDbService'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabaseBrowser } from '@/lib/supabase/browser'

export const presenceKeys = {
  all: ['presence'] as const,
}

const toPresenceUser = (row: PresenceWithProfile) => {
  const profile = row.profile
  return {
    userId: row.user_id,
    username: profile?.username ?? '',
    displayName: profile?.display_name ?? profile?.username ?? '',
    avatarUrl: profile?.avatar_url ?? undefined,
    isOnline: row.is_online,
    isTyping: row.is_typping,
    lastSeen: row.last_seen,
  }
}

export const usePresenceDbSync = () => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector(s => s.auth)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastOnlineRef = useRef<boolean | null>(null)

  const query = useQuery({
    queryKey: presenceKeys.all,
    queryFn: presenceDbService.getAll,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const initialUsers = useMemo(() => {
    if (!query.data) return []
    return query.data.map(toPresenceUser)
  }, [query.data])

  useEffect(() => {
    if (initialUsers.length === 0) return
    dispatch(setOnlineUsers(initialUsers))
  }, [dispatch, initialUsers])

  useEffect(() => {
    const channel = presenceDbService.subscribe((row: PresenceRow) => {
      void (async () => {
        const { data, error } = await supabaseBrowser()
          .from('profiles')
          .select('id,username,display_name,avatar_url')
          .eq('id', row.user_id)
          .maybeSingle()

        if (error) return

        dispatch(setUserPresence({
          userId: row.user_id,
          username: data?.username ?? '',
          displayName: data?.display_name ?? data?.username ?? '',
          avatarUrl: data?.avatar_url ?? undefined,
          isOnline: row.is_online,
          isTyping: row.is_typping,
          lastSeen: row.last_seen,
        }))
      })()

      return () => {}
    })

    channelRef.current = channel

    return () => {
      channelRef.current?.unsubscribe()
      channelRef.current = null
    }
  }, [dispatch])

  useEffect(() => {
    if (!user) return

    const safeUpsert = (nextOnline: boolean) => {
      presenceDbService
        .upsert({ user_id: user.id, is_online: nextOnline })
        .catch(() => undefined)
    }

    const computeShouldBeOnline = () => {
      const visible = typeof document !== 'undefined' ? !document.hidden : true
      const networkOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
      return visible && networkOnline
    }

    const setOnlineIfChanged = (nextOnline: boolean) => {
      if (lastOnlineRef.current === nextOnline) return
      lastOnlineRef.current = nextOnline
      safeUpsert(nextOnline)
    }

    const syncOnline = () => {
      setOnlineIfChanged(computeShouldBeOnline())
    }

    const onVisibilityChange = () => syncOnline()
    const onFocus = () => syncOnline()
    const onBlur = () => syncOnline()
    const onOnline = () => syncOnline()
    const onOffline = () => setOnlineIfChanged(false)
    const onBeforeUnload = () => {
      lastOnlineRef.current = null
      safeUpsert(false)
    }

    syncOnline()

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('beforeunload', onBeforeUnload)
      lastOnlineRef.current = null
      safeUpsert(false)
    }
  }, [user])

  return {
    isLoading: query.isLoading,
    error: query.error,
  }
}
