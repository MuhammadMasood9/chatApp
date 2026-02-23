import { supabaseBrowser } from '@/lib/supabase/browser'
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'

export interface PresenceData {
  userId: string
  username: string
  displayName: string
  avatarUrl?: string
  currentRoom?: string
  isOnline: boolean
  lastSeen: string
}

const mapPresenceState = (state: RealtimePresenceState<PresenceData>): Record<string, PresenceData> => {
  const entries = Object.entries(state)
    .map(([key, sessions]) => {
      const first = sessions?.[0]
      if (!first) return null

      const { presence_ref, ...rest } = first as PresenceData & { presence_ref: string }
      void presence_ref
      return [key, rest] as const
    })
    .filter((v): v is readonly [string, PresenceData] => v !== null)

  return Object.fromEntries(entries)
}

export interface PresenceTrackPayload {
  userId: string
  username: string
  displayName: string
  avatarUrl?: string
  currentRoom?: string
  isOnline: boolean
  lastSeen: string
}

export const presenceService = {
  connect: (
    roomId: string,
    payload: PresenceTrackPayload,
    onPresenceChange: (presence: Record<string, PresenceData>) => VoidFunction
  ): RealtimeChannel => {
    const channel = supabaseBrowser().channel(`presence:${roomId}`)

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceData>()
      onPresenceChange(mapPresenceState(state))
    })

    channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track(payload)
      }
    })

    return channel
  },

  disconnect: async (channel: RealtimeChannel | null) => {
    if (!channel) return
    try {
      await channel.untrack()
    } finally {
      await channel.unsubscribe()
    }
  },
}
