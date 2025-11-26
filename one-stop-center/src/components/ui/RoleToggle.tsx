import { useSessionStore } from '@/store/sessionStore'

const roles = [
  { label: 'Staff', value: 'staff' as const },
  { label: 'Admin', value: 'admin' as const },
]

export function RoleToggle() {
  const { role, setRole } = useSessionStore()

  return (
    <div className="inline-flex items-center rounded-full bg-white/70 p-1 shadow-card backdrop-blur">
      {roles.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setRole(option.value)}
          className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
            role === option.value
              ? 'bg-[#8c4b2d] text-white shadow-card'
              : 'text-text-muted hover:text-charcoal'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

