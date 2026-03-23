'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitRequest, type FormState } from '@/lib/actions'
import { ISLANDS, REQUEST_TYPES, URGENCY_LEVELS, CONTACT_METHODS } from '@/lib/types'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 disabled:bg-ocean-300 text-white rounded-xl px-6 py-4 text-base font-semibold transition-colors"
    >
      {pending ? 'Submitting…' : 'Submit Request'}
    </button>
  )
}

const initialState: FormState = { success: false, error: null }

export default function RequestHelp() {
  const [state, formAction] = useFormState(submitRequest, initialState)

  if (state.success) {
    return (
      <div className="py-12 text-center">
        <div className="bg-white rounded-xl border border-ocean-200 p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-ocean-800 mb-3">Request received</h2>
          <p className="text-gray-600 mb-2">
            Mahalo. A volunteer coordinator will review your request and reach out to you.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This may take some time depending on volunteer availability.
            For emergencies, call 911.
          </p>
          <div className="space-y-2">
            <a href="/need-help/find" className="block text-ocean-600 hover:text-ocean-800 underline text-sm">
              Browse available resources →
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
      <h1 className="text-2xl font-bold text-ocean-900 mb-1">Request Help</h1>
      <p className="text-sm text-gray-500 mb-6">
        Let us know what you need. This information is private and shared only with volunteer coordinators.
      </p>

      {state.error && (
        <div className="bg-lava-500/10 border border-lava-500/30 rounded-lg p-3 mb-4 text-sm text-lava-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div>
          <label htmlFor="island" className="block text-sm font-medium text-gray-700 mb-1.5">
            Island <span className="text-lava-500">*</span>
          </label>
          <select id="island" name="island" required
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base bg-white focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400">
            <option value="">Select island</option>
            {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1.5">
            Area or neighborhood <span className="text-lava-500">*</span>
          </label>
          <input id="neighborhood" name="neighborhood" type="text" required
            placeholder="e.g. Mānoa, Kailua, Kahului"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            What do you need? <span className="text-lava-500">*</span>
            <span className="block text-xs text-gray-400 font-normal mt-0.5">Select all that apply</span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {REQUEST_TYPES.map(type => (
              <label key={type} className="flex items-center gap-2.5 text-sm bg-white border border-gray-200 rounded-lg px-3 py-3 cursor-pointer hover:border-ocean-300 active:bg-ocean-50">
                <input type="checkbox" name="need_types" value={type} className="rounded w-4 h-4" />
                {type}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            How urgent? <span className="text-lava-500">*</span>
          </legend>
          <div className="flex gap-2">
            {URGENCY_LEVELS.map(level => (
              <label key={level} className="flex-1 text-center cursor-pointer">
                <input type="radio" name="urgency" value={level} required className="peer sr-only" />
                <span className="block rounded-lg border border-gray-200 px-3 py-3 text-sm peer-checked:bg-ocean-600 peer-checked:text-white peer-checked:border-ocean-600 hover:border-ocean-300 active:bg-ocean-50 transition-colors">
                  {level}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="contact_method" className="block text-sm font-medium text-gray-700 mb-1.5">
            How should we reach you? <span className="text-lava-500">*</span>
          </label>
          <select id="contact_method" name="contact_method" required
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base bg-white focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400">
            <option value="">Select</option>
            {CONTACT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="contact_value" className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone number or email <span className="text-lava-500">*</span>
          </label>
          <input id="contact_value" name="contact_value" type="text" required
            placeholder="Your phone number or email"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1.5">
            Anything else we should know? <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea id="note" name="note" rows={3}
            placeholder="Number of people, access issues, specific items needed, etc."
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input type="checkbox" name="can_be_contacted" className="rounded w-4 h-4 mt-0.5" />
          <span className="text-gray-600">
            A volunteer coordinator may contact me to learn more about my needs.
          </span>
        </label>

        <SubmitButton />

        <p className="text-xs text-gray-400 text-center">
          Your information is shared only with volunteer coordinators — never shown publicly.
        </p>
      </form>
    </div>
  )
}
