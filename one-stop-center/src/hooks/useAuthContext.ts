import { useContext } from 'react'
import { AuthContext } from '@/context/PortalAuthContext'

export function useAuthContext() {
  return useContext(AuthContext)
}

