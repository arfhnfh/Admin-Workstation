import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuthContext } from '@/hooks/useAuthContext'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signUp } = useAuthContext()
  const STAFF_DOMAIN = '@aafiyatgroup.com'
  const normalizedEmail = email.trim().toLowerCase()
  const isStaffEmail = normalizedEmail.endsWith(STAFF_DOMAIN)
  const buttonColorClass = isStaffEmail
    ? 'bg-[#8c4b2d] hover:bg-[#6f361f]'
    : 'bg-brand.violet hover:bg-brand.violet/90'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatusMessage(null)
    try {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.')
      }

      const { error } = await signUp(normalizedEmail, password, fullName)
      if (error) {
        throw error
      }

      setStatusMessage(
        isStaffEmail
          ? 'Staff account created! Please check your email to confirm, then sign in via the Staff Login page.'
          : 'Request received! Please check your email to confirm your account—our admin team will activate you soon.',
      )
      setFullName('')
      setEmail('')
      setPassword('')
    } catch (error) {
      setStatusMessage((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand.sand/80 px-4 py-10">
      <div className="w-full max-w-3xl rounded-[32px] bg-white/95 p-10 shadow-pastel">
        <p className="text-sm uppercase tracking-[0.5em] text-text-muted">Request access</p>
        <h1 className="mt-2 text-4xl font-semibold text-charcoal">Create external account</h1>
        <p className="mt-2 text-text-muted">
          This form is for interns, contractors, or partners who don’t have an Aafiyat company email.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-3xl border border-card-border bg-brand.sand/60 p-6 shadow-card"
        >
          <div className="flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-brand.violet" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Personal email access</p>
              <h2 className="text-xl font-semibold">Sign up to request approval</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {normalizedEmail && (
              <div
                className={`rounded-2xl px-4 py-3 text-xs font-semibold ${
                  isStaffEmail ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}
              >
                {isStaffEmail
                  ? 'Great! Using a company email means you can log in right after email confirmation.'
                  : 'Personal email detected. We will review and approve access after you confirm your email.'}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-text-muted">Full Name</label>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create password"
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-2xl ${buttonColorClass} py-3 text-sm font-semibold text-white shadow-card transition disabled:opacity-60`}
            >
              Request account
            </button>
          </div>
        </form>

        {statusMessage && (
          <div className="mt-6 rounded-2xl bg-brand.sand/70 px-4 py-3 text-center text-sm text-brand.violet">
            {statusMessage}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-text-muted">
          Already confirmed your email?{' '}
          <Link to="/auth" className="font-semibold text-brand.violet underline-offset-4 hover:underline">
            Back to staff login
          </Link>
        </div>
      </div>
    </div>
  )
}

