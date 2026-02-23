import { useQuery, useMutation } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import { useAppDispatch } from '@/store/hooks'
import { setUser, setSession, setLoading, setError, signOut } from '@/store/slices/authSlice'
import { User, Session } from '@/utils/types'

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

const transformSupabaseUser = (supabaseUser: SupabaseUser): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  emailConfirmedAt: supabaseUser.email_confirmed_at || null,
  username: supabaseUser.user_metadata?.username || '',
  display_name: supabaseUser.user_metadata?.display_name || null,
  avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
  bio: supabaseUser.user_metadata?.bio || null,
  isOnline: false,
  lastSeen: new Date().toISOString(),
  createdAt: supabaseUser.created_at,
  updatedAt: supabaseUser.updated_at || supabaseUser.created_at
})

const transformSupabaseSession = (supabaseSession: SupabaseSession, user: User): Session => ({
  accessToken: supabaseSession.access_token,
  refreshToken: supabaseSession.refresh_token,
  expiresAt: supabaseSession.expires_at || 0,
  user
})

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export const useLogin = () => {
  const dispatch = useAppDispatch()
  
  return useMutation({
    mutationFn: authService.login,
    onMutate: () => {
      dispatch(setLoading(true))
      dispatch(setError(null))
    },
    onSuccess: (data) => {
      if (data.user) {
        const user = transformSupabaseUser(data.user)
        dispatch(setUser(user))
        
        if (data.session) {
          const session = transformSupabaseSession(data.session, user)
          dispatch(setSession(session))
        }
      }
    },
    onError: (error) => {
      dispatch(setError(error.message))
    },
    onSettled: () => {
      dispatch(setLoading(false))
    }
  })
}

export const useRegister = () => {
  const dispatch = useAppDispatch()
  
  return useMutation({
    mutationFn: authService.register,
    onMutate: () => {
      dispatch(setLoading(true))
      dispatch(setError(null))
    },
    onSuccess: (data) => {
      if (data.user && data.session) {
        const user = transformSupabaseUser(data.user)
        dispatch(setUser(user))

        const session = transformSupabaseSession(data.session, user)
        dispatch(setSession(session))
      }
    },
    onError: (error) => {
      dispatch(setError(error.message))
    },
    onSettled: () => {
      dispatch(setLoading(false))
    }
  })
}

export const useLogout = () => {
  const dispatch = useAppDispatch()
  
  return useMutation({
    mutationFn: authService.logout,
    onMutate: () => {
      dispatch(setLoading(true))
    },
    onSuccess: () => {
      dispatch(signOut())
    },
    onSettled: () => {
      dispatch(setLoading(false))
    }
  })
}

export const useExchangeCodeForSession = () => {
  const dispatch = useAppDispatch()

  return useMutation({
    mutationFn: authService.exchangeCodeForSession,
    onMutate: () => {
      dispatch(setLoading(true))
      dispatch(setError(null))
    },
    onSuccess: (result) => {
      const session = result.session
      const user = result.user

      if (user) {
        const transformedUser = transformSupabaseUser(user)
        dispatch(setUser(transformedUser))

        if (session) {
          const transformedSession = transformSupabaseSession(session, transformedUser)
          dispatch(setSession(transformedSession))
        }
      }
    },
    onError: (error) => {
      dispatch(setError(error.message))
    },
    onSettled: () => {
      dispatch(setLoading(false))
    },
  })
}

export const useSendPasswordResetEmail = () => {
  const dispatch = useAppDispatch()

  return useMutation({
    mutationFn: authService.sendPasswordResetEmail,
    onMutate: () => {
      dispatch(setLoading(true))
      dispatch(setError(null))
    },
    onSuccess: () => {
      // Email sent successfully
    },
    onError: (error) => {
      dispatch(setError(error.message))
    },
    onSettled: () => {
      dispatch(setLoading(false))
    },
  })
}

export const useUpdatePassword = () => {
  const dispatch = useAppDispatch()

  return useMutation({
    mutationFn: authService.updatePassword,
    onMutate: () => {
      dispatch(setLoading(true))
      dispatch(setError(null))
    },
    onSuccess: (result) => {
      if (result.user) {
        const transformedUser = transformSupabaseUser(result.user)
        dispatch(setUser(transformedUser))
      }
    },
    onError: (error) => {
      dispatch(setError(error.message))
    },
    onSettled: () => {
      dispatch(setLoading(false))
    },
  })
}