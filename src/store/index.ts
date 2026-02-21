import { configureStore } from "@reduxjs/toolkit"
import authReducer from "@/store/slices/authSlice"
import callReducer from "@/store/slices/callSlice"
import chatReducer from "@/store/slices/chatSlice"
import presenceReducer from "@/store/slices/presenceSlice"
import messageReadReducer from "@/store/slices/messageReadSlice"
import messageComposerReducer from "@/store/slices/messageComposerSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    call: callReducer,
    chat: chatReducer,
    presence: presenceReducer,
    messageReads: messageReadReducer,
    messageComposer: messageComposerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ['call.participants', 'chat.typingUsers', 'presence.users'],
        ignoredActionPaths: ['payload.stream'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch