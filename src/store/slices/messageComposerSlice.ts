import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MessageType, UUID } from '@/utils/types'

export type ComposerMessageRef = {
  id: UUID
  senderId: UUID | null
  type: MessageType
  content: string | null
  fileName: string | null
}

export interface MessageComposerState {
  replyTo: ComposerMessageRef | null
  editing: {
    messageId: UUID
    content: string
  } | null
}

const initialState: MessageComposerState = {
  replyTo: null,
  editing: null,
}

const messageComposerSlice = createSlice({
  name: 'messageComposer',
  initialState,
  reducers: {
    setReplyTo: (state, action: PayloadAction<ComposerMessageRef | null>) => {
      state.replyTo = action.payload
    },
    startEditing: (state, action: PayloadAction<{ messageId: UUID; content: string }>) => {
      state.editing = action.payload
      state.replyTo = null
    },
    stopEditing: (state) => {
      state.editing = null
    },
    clearComposer: (state) => {
      state.replyTo = null
      state.editing = null
    },
  },
})

export const {
  setReplyTo,
  startEditing,
  stopEditing,
  clearComposer,
} = messageComposerSlice.actions

export default messageComposerSlice.reducer
