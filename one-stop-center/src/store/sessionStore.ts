import { create } from 'zustand'
import type { EmploymentRole } from '@/types/staff'

interface SessionState {
  role: EmploymentRole
  setRole: (role: EmploymentRole) => void
  toggleRole: () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  role: 'staff',
  setRole: (role) => set({ role }),
  toggleRole: () => {
    const next = get().role === 'staff' ? 'admin' : 'staff'
    set({ role: next })
  },
}))

