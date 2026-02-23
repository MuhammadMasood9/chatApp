import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface MessageReadState {
  reads: Record<string, {
    roomId: string
    lastReadAt: string
    unreadCount: number
    totalMessages: number
  }>
}

const initialState: MessageReadState = {
  reads: {}
}

const messageReadSlice = createSlice({
  name: 'messageReads',
  initialState,
  reducers: {
    setMessageRead: (state, action: PayloadAction<{
      roomId: string
      lastReadAt: string
      unreadCount: number
      totalMessages: number
    }>) => {
      const { roomId, lastReadAt, unreadCount, totalMessages } = action.payload
      state.reads[roomId] = {
        roomId,
        lastReadAt,
        unreadCount,
        totalMessages
      }
    },
    
    updateUnreadCount: (state, action: PayloadAction<{
      roomId: string
      unreadCount: number
    }>) => {
      const { roomId, unreadCount } = action.payload
      if (state.reads[roomId]) {
        state.reads[roomId].unreadCount = unreadCount
      }
    },
    
    markMessagesAsRead: (state, action: PayloadAction<{
      roomId: string
      messageId?: string
    }>) => {
      const { roomId } = action.payload
      if (state.reads[roomId]) {
        state.reads[roomId].lastReadAt = new Date().toISOString()
        state.reads[roomId].unreadCount = 0
      }
    },
    
    clearMessageReads: (state, action: PayloadAction<string>) => {
      const roomId = action.payload
      delete state.reads[roomId]
    }
  }
})

export const {
  setMessageRead,
  updateUnreadCount,
  markMessagesAsRead,
  clearMessageReads
} = messageReadSlice.actions

export default messageReadSlice.reducer
