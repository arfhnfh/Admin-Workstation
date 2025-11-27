import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, ShieldCheck } from 'lucide-react'
import { useAuthContext } from '@/hooks/useAuthContext'

const STAFF_DOMAIN = '@aafiyatgroup.com'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectPath = (location.state as { from?: Location })?.from?.pathname ?? '/'

  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuthContext()

  const handleStaffLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatusMessage(null)
    const email = staffEmail.trim().toLowerCase()
    if (!email.endsWith(STAFF_DOMAIN)) {
      setStatusMessage('Staff login requires an @aafiyatgroup.com email')
      setIsSubmitting(false)
      return
    }

    const { error } = await login(email, staffPassword)
    if (error) {
      setStatusMessage(error.message)
      setIsSubmitting(false)
      return
    }

    navigate(redirectPath, { replace: true })
    setIsSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand.sand/80 px-4 py-10">
      <div className="w-full max-w-3xl rounded-[32px] bg-white/90 p-10 shadow-pastel">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.5em] text-text-muted">Welcome back</p>
          <h1 className="mt-3 text-4xl font-semibold text-charcoal">Sign in to Admin Workstation</h1>
          <p className="mt-2 text-text-muted">
            Staff members must use their @aafiyatgroup.com email. External interns/partners should sign
            up first using their personal email.
          </p>
        </div>

        <form
          onSubmit={handleStaffLogin}
          className="mt-10 rounded-3xl border border-card-border bg-brand.violet/5 p-6 shadow-card"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-brand.violet" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Staff Login</p>
              <h2 className="text-xl font-semibold">@aafiyatgroup.com</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-muted">Email</label>
              <input
                required
                type="email"
                value={staffEmail}
                onChange={(event) => setStaffEmail(event.target.value)}
                placeholder="name@aafiyatgroup.com"
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted">Password</label>
              <input
                required
                type="password"
                value={staffPassword}
                onChange={(event) => setStaffPassword(event.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8c4b2d] py-3 text-sm font-semibold text-white shadow-card transition hover:bg-[#6f361f] disabled:bg-[#8c4b2d]/60"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-dashed border-brand.violet/40 bg-white/80 px-6 py-4 text-sm text-text-muted">
          <span>Interns or external partners need a personal email account first.</span>
          <Link to="/auth/signup" className="font-semibold text-brand.violet underline-offset-4 hover:underline">
            Request access
          </Link>
        </div>

        {statusMessage && (
          <div className="mt-6 rounded-2xl bg-brand.sand/80 px-4 py-3 text-center text-sm text-brand.violet">
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  )
}

