'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitCommunityTip, type FormState } from '@/lib/actions'
import { ISLANDS, HUB_CATEGORIES } from '@/lib/types'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 disabled:bg-ocean-300 text-white rounded-xl px-6 py-4 text-base font-semibold transition-colors"
    >
      {pending ? 'Submitting…' : 'Submit'}
    </button>
  )
}

const initialState: FormState = { success: false, error: null }

export default function ShareInfo() {
  const [state, formAction] = useFormState(submitCommunityTip, initialState)

  if (state.success) {
    return (
      <div className="py-12 text-center">
        <div className="bg-white rounded-xl border border-ocean-200 p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-ocean-800 mb-3">Thank you</h2>
          <p className="text-gray-600 mb-2">
            A coordinator will review your submission. If verified, it will be added to our public resource listings.
          </p>
          <div className="space-y-2 mt-6">
            <a href="/need-help/find" className="block text-ocean-600 hover:text-ocean-800 underline text-sm">
              Browse current resources →
            </a>
            <a href="/" className="block text-gray-400 hover:text-ocean-600 text-sm">
              ← Back to home
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-ocean-800 mb-1">Share a Resource</h1>
      <p className="text-sm text-gray-500 mb-6">
        Know about a shelter, distribution site, or service that should be listed?
        A coordinator will verify before publishing.
      </p>

      {state.error && (
        <div className="bg-lava-500/10 border border-lava-500/30 rounded-lg p-3 mb-4 text-sm text-lava-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div>
          <label htmlFor="submitted_island" className="block text-sm font-medium text-gray-700 mb-1.5">
            Island <span className="text-lava-500">*</span>
          </label>
          <select id="submitted_island" name="submitted_island" required
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base bg-white focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400">
            <option value="">Select island</option>
            {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="submitted_area" className="block text-sm font-medium text-gray-700 mb-1.5">
            Area or neighborhood <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input id="submitted_area" name="submitted_area" type="text"
            placeholder="e.g. Kailua, Kahului"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

        <div>
          <label htmlFor="submitted_category" className="block text-sm font-medium text-gray-700 mb-1.5">
            Type of resource <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select id="submitted_category" name="submitted_category"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base bg-white focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400">
            <option value="">Select if known</option>
            {HUB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="submitted_info" className="block text-sm font-medium text-gray-700 mb-1.5">
            What do you know? <span className="text-lava-500">*</span>
          </label>
          <textarea id="submitted_info" name="submitted_info" rows={4} required
            placeholder="Name of the place, what they offer, hours if known, address or cross streets, any contact info you have…"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

        <div>
          <label htmlFor="submitted_name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Your name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input id="submitted_name" name="submitted_name" type="text"
            placeholder="So we can follow up if needed"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

        <div>
          <label htmlFor="submitted_contact" className="block text-sm font-medium text-gray-700 mb-1.5">
            Your contact info <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input id="submitted_contact" name="submitted_contact" type="text"
            placeholder="Phone or email — only if you want us to follow up"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

        <SubmitButton />

        <p className="text-xs text-gray-400 text-center">
          Submissions are reviewed before publishing. Your contact info is never shown publicly.
        </p>
      </form>
    </div>
  )
}
