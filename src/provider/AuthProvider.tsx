"use client";

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUser, setSession, setLoading, signOut } from '@/store/slices/authSlice';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { User, Session } from '@/utils/types';
import Loader from '@/component/ui/Loader';

const transformSupabaseUser = (supabaseUser: { id: string; email?: string; email_confirmed_at?: string; user_metadata?: { username?: string; display_name?: string; avatar_url?: string; bio?: string }; created_at: string; updated_at?: string }): User => ({
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
});

const transformSupabaseSession = (supabaseSession: { access_token: string; refresh_token: string; expires_at?: number }, user: User): Session => ({
  accessToken: supabaseSession.access_token,
  refreshToken: supabaseSession.refresh_token,
  expiresAt: supabaseSession.expires_at || 0,
  user
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        dispatch(setLoading(true));
        
        const { data: { session }, error } = await supabaseBrowser().auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          dispatch(signOut());
          return;
        }

        if (session?.user && mounted) {
          const user = transformSupabaseUser(session.user);
          const transformedSession = transformSupabaseSession(session, user);
          
          dispatch(setUser(user));
          dispatch(setSession(transformedSession));
        } else if (mounted) {
          dispatch(signOut());
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          dispatch(signOut());
        }
      } finally {
        if (mounted) {
          dispatch(setLoading(false));
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabaseBrowser().auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        dispatch(setLoading(true));

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            const user = transformSupabaseUser(session.user);
            const transformedSession = transformSupabaseSession(session, user);
            
            dispatch(setUser(user));
            dispatch(setSession(transformedSession));
          } else if (event === 'SIGNED_OUT') {
            dispatch(signOut());
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            const user = transformSupabaseUser(session.user);
            const transformedSession = transformSupabaseSession(session, user);
            
            dispatch(setUser(user));
            dispatch(setSession(transformedSession));
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          dispatch(signOut());
        } finally {
          dispatch(setLoading(false));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

  if (!isInitialized) {
    return (
      <Loader/>
    );
  }

  return <>{children}</>;
}
