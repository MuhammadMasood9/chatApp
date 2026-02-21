import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { CallState, Participant } from '@/utils/calls'
import { CallStatus } from '@/utils/calls'
import { v4 as uuidv4 } from 'uuid'

const initialState: CallState = {
  roomId: null,
  myUserId: uuidv4(),
  status: CallStatus.Idle,
  participants: {},
  isMuted: false,
  isVideoOff: false,
  error: null,
}

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setRoom(state, action: PayloadAction<string>) {
      state.roomId = action.payload
    },
    setStatus(state, action: PayloadAction<CallState['status']>) {
      state.status = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
      if (action.payload) state.status = CallStatus.Error
    },
    addParticipant(state, action: PayloadAction<Participant>) {
      const p = action.payload
      state.participants[p.userId] = {
        ...p,
        stream: undefined, 
      }
    },
    removeParticipant(state, action: PayloadAction<string>) {
      delete state.participants[action.payload]
    },
    updateParticipant(
      state,
      action: PayloadAction<Partial<Participant> & { userId: string }>
    ) {
      const { userId, ...updates } = action.payload
      if (state.participants[userId]) {
        Object.assign(state.participants[userId], updates)
      }
    },
    toggleMute(state) {
      state.isMuted = !state.isMuted
    },
    toggleVideo(state) {
      state.isVideoOff = !state.isVideoOff
    },
    resetCall(state) {
      state.status = CallStatus.Idle
      state.participants = {}
      state.roomId = null
      state.error = null
      state.isMuted = false
      state.isVideoOff = false
    },
  },
})

export const {
  setRoom,
  setStatus,
  setError,
  addParticipant,
  removeParticipant,
  updateParticipant,
  toggleMute,
  toggleVideo,
  resetCall,
} = callSlice.actions

export default callSlice.reducer