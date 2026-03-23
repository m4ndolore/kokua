'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitOffer, type FormState } from '@/lib/actions'
import { ISLANDS, OFFER_TYPES, AVAILABILITY_OPTIONS, CONTACT_METHODS } from '@/lib/types'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-earth-600 hover:bg-earth-700 active:bg-earth-800 disabled:bg-earth-300 text-white rounded-xl px-6 py-4 text-base font-semibold transition-colors"
    >
      {pending ? 'Submitting…' : 'Submit Offer'}
    </button>
  )
}

const initialState: FormState = { success: false, error: null }

export default function OfferHelp() {
  const [state, formAction] = useFormState(submitOffer, initialState)

  if (state.success) {
    return (
      <div className="py-12 text-center">
        <div className="bg-white rounded-xl border border-earth-200 p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-earth-700 mb-3">Offer received</h2>
          <p className="text-gray-600 mb-2">
            Mahalo for stepping up. A coordinator will reach out if your help is needed.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            We appreciate your willingness to help the community.
          </p>
          <a href="/" className="text-ocean-600 hover:text-ocean-800 underline text-sm">
            ← Back to home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-earth-800 mb-1">Offer Help</h1>
      <p className="text-sm text-gray-500 mb-6">
        Share what you can offer. Coordinators will connect you with people who need it.
      </p>

      {state.error && (
        <div className="bg-lava-500/10 border border-lava-500/30 rounded-lg p-3 mb-4 text-sm text-lava-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {/* Island */}
        <div>
          <label htmlFor="island" className="block text-sm font-medium text-gray-700 mb-1.5">
            Island <span className="text-lava-500">*</span>
          </label>
          <select
            id="island"
            name="island"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base bg-white focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400"
          >
            <option value="">Select island</option>
            {ISLANDS.map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>

        {/* Neighborhood */}
        <div>
          <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1.5">
            Area or neighborhood <span className="text-lava-500">*</span>
          </label>
          <input
            id="neighborhood"
            name="neighborhood"
            type="text"
            required
            placeholder="e.g. Kaimukī, Wailuku, Līhuʻe"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400"
          />
        </div>

        {/* Offer types */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            What can you offer? <span className="text-lava-500">*</span>
            <span className="block text-xs text-gray-400 font-normal mt-0.5">Select all that apply</span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {OFFER_TYPES.map(type => (
              <label key={type} className="flex items-center gap-2.5 text-sm bg-white border border-gray-200 rounded-lg px-3 py-3 cursor-pointer hover:border-earth-300 active:bg-earth-50">
                <input type="checkbox" name="offer_types" value={type} className="rounded w-4 h-4" />
                {type}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Availability */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            When are you available? <span className="text-lava-500">*</span>
          </legend>
          <div className="flex gap-2">
            {AVAILABILITY_OPTIONS.map(opt => (
              <label key={opt} className="flex-1 text-center cursor-pointer">
                <input type="radio" name="availability" value={opt} required className="peer sr-only" />
                <span className="block rounded-lg border border-gray-200 px-2 py-3 text-sm peer-checked:bg-earth-600 peer-checked:text-white peer-checked:border-earth-600 hover:border-earth-300 active:bg-earth-50 transition-colors">
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Contact method */}
        <div>
          <label htmlFor="contact_method" className="block text-sm font-medium text-gray-700 mb-1.5">
            How should we reach you? <span className="text-lava-500">*</span>
          </label>
          <select
            id="contact_method"
            name="contact_method"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base bg-white focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400"
          >
            <option value="">Select</option>
            {CONTACT_METHODS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Contact value */}
        <div>
          <label htmlFor="contact_value" className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone number or email <span className="text-lava-500">*</span>
          </label>
          <input
            id="contact_value"
            name="contact_value"
            type="text"
            required
            placeholder="Your phone number or email"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400"
          />
        </div>

        {/* Capacity */}
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1.5">
            Quantity or capacity <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="capacity"
            name="capacity"
            type="text"
            placeholder="e.g. 1 truck, 50 bottles, room for 3 people"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400"
          />
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1.5">
            Anything else? <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            placeholder="Details, conditions, pickup instructions, etc."
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400"
          />
        </div>

        <SubmitButton />

        <p className="text-xs text-gray-400 text-center">
          Your information is shared only with volunteer coordinators.
        </p>
      </form>
    </div>
  )
}
