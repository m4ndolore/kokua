'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginAction } from '@/lib/dashboard-actions'
import type { FormState } from '@/lib/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-ocean-600 hover:bg-ocean-700 disabled:bg-ocean-300 text-white rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
    >
      {pending ? 'Signing in…' : 'Sign In'}
    </button>
  )
}

const initialState: FormState = { success: false, error: null }

export default function DashboardLogin() {
  const [state, formAction] = useFormState(loginAction, initialState)

  return (
    <div className="py-12">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-ocean-900 mb-2 text-center">
          Volunteer Dashboard
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter the shared password, or <code className="text-xs">email:password</code> to attribute actions to a dashboard user.
        </p>

        {state.error && (
          <div className="bg-lava-500/10 border border-lava-500/30 rounded-lg p-3 mb-4 text-sm text-lava-700">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400"
            />
          </div>
          <SubmitButton />
        </form>
      </div>
    </div>
  )
}
