import { supabaseBrowser } from '@/lib/supabase/browser'

export interface MessageReadData {
  user_id: string
  room_id: string
  last_read_at: string
}

export const messageReadService = {
  getMessageReads: async (userId: string): Promise<MessageReadData[]> => {
    const { data, error } = await supabaseBrowser()
      .from('message_reads')
      .select('*')
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  getRoomReads: async (roomId: string): Promise<MessageReadData[]> => {
    const { data, error } = await supabaseBrowser()
      .from('message_reads')
      .select('*')
      .eq('room_id', roomId)
      .order('last_read_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  updateMessageRead: async (
    userId: string,
    roomId: string,
    lastReadAt: string
  ): Promise<MessageReadData> => {
    const { data, error } = await supabaseBrowser()
      .from('message_reads')
      .upsert({
        user_id: userId,
        room_id: roomId,
        last_read_at: lastReadAt
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  getUnreadCount: async (
    userId: string,
    roomId: string
  ): Promise<number> => {
    const { data: readData } = await supabaseBrowser()
      .from('message_reads')
      .select('last_read_at')
      .eq('user_id', userId)
      .eq('room_id', roomId)
      .single()

    const lastReadAt = readData?.last_read_at


    let query = supabaseBrowser()
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .neq('sender_id', userId) 

    if (lastReadAt) {
      query = query.gt('created_at', lastReadAt)
    }

    const { count, error } = await query

    if (error) throw error
    return count || 0
  },

  markRoomAsRead: async (userId: string, roomId: string): Promise<void> => {
    try {
      
      const { error } = await supabaseBrowser()
        .from('message_reads')
        .upsert({
          user_id: userId,
          room_id: roomId,
          last_read_at: new Date().toISOString()
        })
        .select()
        .single()


      if (error) {
        console.error('Supabase error marking room as read:', error)
        throw new Error(`Failed to mark room as read: ${error.message || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Unexpected error marking room as read:', err)
      throw new Error(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }
}
