import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TypingUser } from '@/utils/types'

export interface ChatState {
  typingUsers: Record<string, TypingUser[]>
  onlineUsers: Record<string, {
    userId: string
    username: string
    displayName: string
    avatarUrl?: string
    lastSeen: string
    currentRoom?: string
  }>
  messageReads: Record<string, {
    roomId: string
    lastReadAt: string
    unreadCount: number
  }>
  connectionStatus: Record<string, 'connected' | 'disconnected' | 'connecting' | 'reconnecting'>
}

const initialState: ChatState = {
  typingUsers: {},
  onlineUsers: {},
  messageReads: {},
  connectionStatus: {}
} 

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setTypingUser: (state, action: PayloadAction<{
      roomId: string
      user: TypingUser
    }>) => {
      const { roomId, user } = action.payload
      if (!state.typingUsers[roomId]) {
        state.typingUsers[roomId] = []
      }
      
      state.typingUsers[roomId] = state.typingUsers[roomId].filter(u => u.userId !== user.userId)
      
      if (user.startedAt > 0) {
        state.typingUsers[roomId].push(user)
      }
    },
    
    removeTypingUser: (state, action: PayloadAction<{
      roomId: string
      userId: string
    }>) => {
      const { roomId, userId } = action.payload
      if (state.typingUsers[roomId]) {
        state.typingUsers[roomId] = state.typingUsers[roomId].filter(u => u.userId !== userId)
      }
    },
    
    clearTypingUsers: (state, action: PayloadAction<string>) => {
      const roomId = action.payload
      state.typingUsers[roomId] = []
    },

    setUserOnline: (state, action: PayloadAction<{
      userId: string
      username: string
      displayName: string
      avatarUrl?: string
      currentRoom?: string
    }>) => {
      const { userId, username, displayName, avatarUrl, currentRoom } = action.payload
      state.onlineUsers[userId] = {
        userId,
        username,
        displayName,
        avatarUrl,
        lastSeen: new Date().toISOString(),
        currentRoom
      }
    },
    
    setUserOffline: (state, action: PayloadAction<string>) => {
      const userId = action.payload
      delete state.onlineUsers[userId]
    },
    
    updateUserPresence: (state, action: PayloadAction<{
      userId: string
      currentRoom?: string
    }>) => {
      const { userId, currentRoom } = action.payload
      if (state.onlineUsers[userId]) {
        state.onlineUsers[userId].currentRoom = currentRoom
        state.onlineUsers[userId].lastSeen = new Date().toISOString()
      }
    },

    setMessageRead: (state, action: PayloadAction<{
      roomId: string
      lastReadAt: string
      unreadCount?: number
    }>) => {
      const { roomId, lastReadAt, unreadCount = 0 } = action.payload
      state.messageReads[roomId] = {
        roomId,
        lastReadAt,
        unreadCount
      }
    },
    
    updateUnreadCount: (state, action: PayloadAction<{
      roomId: string
      unreadCount: number
    }>) => {
      const { roomId, unreadCount } = action.payload
      if (state.messageReads[roomId]) {
        state.messageReads[roomId].unreadCount = unreadCount
      } else {
        state.messageReads[roomId] = {
          roomId,
          lastReadAt: new Date().toISOString(),
          unreadCount
        }
      }
    },

    setConnectionStatus: (state, action: PayloadAction<{
      roomId: string
      status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting'
    }>) => {
      const { roomId, status } = action.payload
      state.connectionStatus[roomId] = status
    },
    
    clearConnectionStatus: (state, action: PayloadAction<string>) => {
      const roomId = action.payload
      delete state.connectionStatus[roomId]
    }
  }
})

export const {
  setTypingUser,
  removeTypingUser,
  clearTypingUsers,
  setUserOnline,
  setUserOffline,
  updateUserPresence,
  setMessageRead,
  updateUnreadCount,
  setConnectionStatus,
  clearConnectionStatus
} = chatSlice.actions

export default chatSlice.reducer
