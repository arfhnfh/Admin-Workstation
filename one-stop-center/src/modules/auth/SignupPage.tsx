import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuthContext } from '@/hooks/useAuthContext'

const STAFF_DOMAIN = '@aafiyatgroup.com'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signUp } = useAuthContext()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatusMessage(null)
    try {
      if (email.trim().toLowerCase().endsWith(STAFF_DOMAIN)) {
        throw new Error('Staff emails should use the staff login page.')
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.')
      }

      const { error } = await signUp(email, password, fullName)
      if (error) {
        throw error
      }

      setStatusMessage('Account created! Please check your email to confirm your account before signing in.')
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
              className="w-full rounded-2xl bg-brand.violet py-3 text-sm font-semibold text-white shadow-card disabled:opacity-60"
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

