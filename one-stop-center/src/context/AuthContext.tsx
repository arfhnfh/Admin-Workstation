import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { AuthContext } from '@/context/PortalAuthContext'
import type { PortalUser } from '@/context/PortalAuthContext'
import { supabase } from '@/lib/supabaseClient'

function mapSupabaseUserToPortalUser(supabaseUser: User | null | undefined): PortalUser | null {
  if (!supabaseUser || !supabaseUser.email) return null
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    supabaseUser,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(mapSupabaseUserToPortalUser(session.user))
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUserToPortalUser(session.user))
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ error?: Error }> => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.') }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        return { error: new Error(error.message) }
      }

      if (data.user) {
        setUser(mapSupabaseUserToPortalUser(data.user))
      }

      return {}
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('An unexpected error occurred') }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string): Promise<{ error?: Error }> => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.') }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        return { error: new Error(error.message) }
      }

      // Note: User will need to confirm email before they can sign in
      // We don't set the user here because they need to verify their email first
      return {}
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('An unexpected error occurred') }
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    if (!supabase) return

    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout, signUp }), [user, loading, login, logout, signUp])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


