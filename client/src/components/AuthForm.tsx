import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api'
import type { User } from '../api'

interface Props {
  onAuthenticated: (user: User, token: string) => void
}

const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'

export default function AuthForm({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [field]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result =
        mode === 'login'
          ? await api.login(form.email, form.password)
          : await api.signup(form)
      onAuthenticated(result.user, result.token)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">{mode === 'login' ? 'Log in' : 'Create account'}</h1>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <div className="flex gap-2">
            <input className={inputClass} placeholder="First name" value={form.firstName} onChange={update('firstName')} required />
            <input className={inputClass} placeholder="Last name" value={form.lastName} onChange={update('lastName')} required />
          </div>
        )}
        <input className={inputClass} type="email" placeholder="Email" value={form.email} onChange={update('email')} required />
        <input
          className={inputClass}
          type="password"
          placeholder="Password (min 8 characters)"
          value={form.password}
          onChange={update('password')}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        className="mt-4 text-sm text-blue-600 hover:underline"
      >
        {mode === 'login' ? 'No account? Sign up' : 'Have an account? Log in'}
      </button>
    </div>
  )
}
