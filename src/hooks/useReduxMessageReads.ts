import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { useCallback, useEffect } from 'react'
import { 
  setMessageRead, 
  updateUnreadCount, 
  markMessagesAsRead 
} from '@/store/slices/messageReadSlice'
import { messageReadService } from '@/services/messageReadService'

export const useReduxMessageReads = (roomId: string | null) => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector(state => state.auth)
  const messageReads = useAppSelector(state => state.messageReads.reads)

  const getMessageReads = useCallback(async () => {
    if (!user) return
    const reads = await messageReadService.getMessageReads(user.id)
    
    reads.forEach(read => {
      dispatch(setMessageRead({
        roomId: read.room_id,
        lastReadAt: read.last_read_at,
        unreadCount: 0, 
        totalMessages: 0
      }))
    })
  }, [dispatch, user])

  const getUnreadCount = useCallback(async (targetRoomId: string) => {
    if (!user) return 0
    return await messageReadService.getUnreadCount(user.id, targetRoomId)
  }, [user])

  const markAsRead = useCallback(async (targetRoomId: string) => {
    if (!user) return

    try {
      await messageReadService.markRoomAsRead(user.id, targetRoomId)
      dispatch(markMessagesAsRead({ roomId: targetRoomId }))
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
      
    }
  }, [dispatch, user])

  const updateMessageRead = useCallback(async (targetRoomId: string, lastReadAt: string) => {
    if (!user) return

    try {
      await messageReadService.updateMessageRead(user.id, targetRoomId, lastReadAt)
      dispatch(setMessageRead({
        roomId: targetRoomId,
        lastReadAt,
        unreadCount: 0,
        totalMessages: 0
      }))
    } catch (error) {
      console.error('Failed to update message read:', error)
    }
  }, [dispatch, user])

  const calculateUnreadCounts = useCallback(async () => {
    if (!user) return

    const rooms: Array<{ id: string }> = [] 
    
    for (const room of rooms) {
      const unreadCount = await getUnreadCount(room.id)
      dispatch(updateUnreadCount({
        roomId: room.id,
        unreadCount
      }))
    }
  }, [user, getUnreadCount, dispatch])

  useEffect(() => {
    if (roomId && user) {
      markAsRead(roomId)
    }
  }, [roomId, user, markAsRead])

  return {
    messageReads,
    getMessageReads,
    getUnreadCount,
    markAsRead,
    updateMessageRead,
    calculateUnreadCounts
  }
}
