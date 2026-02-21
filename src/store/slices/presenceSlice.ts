import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface PresenceState {
  users: Record<string, {
    userId: string
    username: string
    displayName: string
    avatarUrl?: string
    lastSeen: string
    currentRoom?: string
    isOnline: boolean
    isTyping: boolean
  }>
  rooms: Record<string, {
    roomId: string
    onlineCount: number
    userCount: number
  }>
}

const initialState: PresenceState = {
  users: {},
  rooms: {}
}

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setUserPresence: (state, action: PayloadAction<{
      userId: string
      username: string
      displayName: string
      avatarUrl?: string
      currentRoom?: string
      isOnline: boolean
      isTyping?: boolean
      lastSeen?: string
    }>) => {
      const { userId, username, displayName, avatarUrl, currentRoom, isOnline, isTyping, lastSeen } = action.payload
      
      if (isOnline) {
        state.users[userId] = {
          userId,
          username,
          displayName,
          avatarUrl,
          lastSeen: lastSeen ?? new Date().toISOString(),
          currentRoom,
          isOnline: true,
          isTyping: isTyping ?? state.users[userId]?.isTyping ?? false,
        }
      } else {
        if (state.users[userId]) {
          state.users[userId].isOnline = false
          state.users[userId].lastSeen = lastSeen ?? new Date().toISOString()
          state.users[userId].isTyping = false
        }
      }
    },
    
    removeUserPresence: (state, action: PayloadAction<string>) => {
      const userId = action.payload
      delete state.users[userId]
    },
    
    updateRoomPresence: (state, action: PayloadAction<{
      roomId: string
      onlineCount: number
      userCount: number
    }>) => {
      const { roomId, onlineCount, userCount } = action.payload
      state.rooms[roomId] = {
        roomId,
        onlineCount,
        userCount
      }
    },
    
    clearRoomPresence: (state, action: PayloadAction<string>) => {
      const roomId = action.payload
      delete state.rooms[roomId]
    },
    
    setOnlineUsers: (state, action: PayloadAction<Array<{
      userId: string
      username: string
      displayName: string
      avatarUrl?: string
      currentRoom?: string
      isTyping?: boolean
      lastSeen?: string
      isOnline?: boolean
    }>>) => {
      const users = action.payload
      users.forEach(user => {
        state.users[user.userId] = {
          userId: user.userId,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          lastSeen: user.lastSeen ?? new Date().toISOString(),
          currentRoom: user.currentRoom,
          isOnline: user.isOnline ?? true,
          isTyping: user.isTyping ?? false,
        }
      })
    }
  }
})

export const {
  setUserPresence,
  removeUserPresence,
  updateRoomPresence,
  clearRoomPresence,
  setOnlineUsers
} = presenceSlice.actions

export default presenceSlice.reducer
