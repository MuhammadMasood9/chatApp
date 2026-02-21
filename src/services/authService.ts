import { supabaseBrowser } from '@/lib/supabase/browser'
import { LoginCredentials, RegisterCredentials } from '@/utils/types'

interface SupabaseUser {
  id: string;
  email?: string;
  email_confirmed_at?: string;
  user_metadata?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  };
  created_at: string;
  updated_at?: string;
}

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}


export const authService = {
  login: async (credentials: LoginCredentials): Promise<{ user: SupabaseUser; session: SupabaseSession }> => {
    const { data, error } = await supabaseBrowser().auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })

    if (error) throw new Error(error.message)

    return data as { user: SupabaseUser; session: SupabaseSession }
  },

  register: async (credentials: RegisterCredentials): Promise<{ user: SupabaseUser; session: SupabaseSession }> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const emailRedirectTo = origin ? `${origin}/auth/callback` : undefined

    const { data, error } = await supabaseBrowser().auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
        data: {
          username: credentials.username,
          display_name: credentials.display_name
        }
      }
    })

    if (error) throw new Error(error.message)

    return data as { user: SupabaseUser; session: SupabaseSession }
  },

  logout: async (): Promise<void> => {
    const { error } = await supabaseBrowser().auth.signOut()
    if (error) throw new Error(error.message)
  },

  getCurrentUser: async (): Promise<{ user: SupabaseUser | null }> => {
    const { data, error } = await supabaseBrowser().auth.getUser()
    if (error) throw new Error(error.message)
    return data
  },

  exchangeCodeForSession: async (code: string): Promise<{ user: SupabaseUser | null; session: SupabaseSession | null }> => {
    const { data, error } = await supabaseBrowser().auth.exchangeCodeForSession(code)
    if (error) throw new Error(error.message)
    return data
  },

  sendPasswordResetEmail: async (payload: { email: string; redirectTo: string }): Promise<void> => {
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(payload.email, {
      redirectTo: payload.redirectTo,
    })
    if (error) throw new Error(error.message)
  },

  updatePassword: async (payload: { password: string }): Promise<{ user: SupabaseUser | null }> => {
    const { data, error } = await supabaseBrowser().auth.updateUser({ password: payload.password })
    if (error) throw new Error(error.message)
    return data
  },
}