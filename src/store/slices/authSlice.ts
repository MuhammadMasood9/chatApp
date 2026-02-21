import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User, Session } from "@/utils/types";

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    setSession(state, action: PayloadAction<Session | null>) {
      state.session = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    signOut(state) {
      state.user = null;
      state.session = null;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const { setUser, setSession, setLoading, setError, signOut } = authSlice.actions;
export default authSlice.reducer;