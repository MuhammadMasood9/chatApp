import { supabaseBrowser } from '@/lib/supabase/browser'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PresenceRow {
  user_id: string
  is_online: boolean
  last_seen: string
  is_typping: boolean
}

export interface PresenceWithProfile extends PresenceRow {
  profile: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

type PresenceRowUpdate = Partial<Omit<PresenceRow, 'user_id'>> & { user_id: string }

export const presenceDbService = {
  getAll: async (): Promise<PresenceWithProfile[]> => {
    const { data, error } = await supabaseBrowser()
      .from('presence')
      .select('user_id,is_online,last_seen,is_typping')

    if (error) throw error

    const presenceRows = ((data as unknown) as PresenceRow[]) ?? []
    const ids = presenceRows.map(r => r.user_id)

    if (ids.length === 0) return []

    const { data: profilesData, error: profilesError } = await supabaseBrowser()
      .from('profiles')
      .select('id,username,display_name,avatar_url')
      .in('id', ids)

    if (profilesError) throw profilesError

    const profiles = (profilesData as Array<{
      id: string
      username: string
      display_name: string | null
      avatar_url: string | null
    }>) ?? []

    const map = new Map<string, PresenceWithProfile['profile']>()
    for (const p of profiles) map.set(p.id, p)

    return presenceRows.map(r => ({
      ...r,
      profile: map.get(r.user_id) ?? null,
    }))
  },

  upsert: async (row: PresenceRowUpdate): Promise<void> => {
    const payload: PresenceRowUpdate = {
      ...row,
      last_seen: row.last_seen ?? new Date().toISOString(),
    }

    const { error } = await supabaseBrowser()
      .from('presence')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) throw error
  },

  setOnline: async (userId: string, isOnline: boolean): Promise<void> => {
    await presenceDbService.upsert({ user_id: userId, is_online: isOnline })
  },

  setTyping: async (userId: string, isTyping: boolean): Promise<void> => {
    await presenceDbService.upsert({ user_id: userId, is_typping: isTyping })
  },

  subscribe: (onRow: (row: PresenceRow) => VoidFunction): RealtimeChannel => {
    return supabaseBrowser()
      .channel('presence-db')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
        },
        payload => {
          if (payload.eventType === 'DELETE') return
          const row = payload.new as PresenceRow
          onRow(row)
        }
      )
      .subscribe()
  },
}
