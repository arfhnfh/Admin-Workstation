import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type PortalUser = {
  id: string
  email: string
  supabaseUser: User
}

export type AuthContextValue = {
  user: PortalUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: Error }>
  logout: () => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: Error }>
}

export const STORAGE_KEY = 'aafiyat_portal_user'

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  login: async () => ({ error: new Error('Not implemented') }),
  logout: async () => {},
  signUp: async () => ({ error: new Error('Not implemented') }),
})


