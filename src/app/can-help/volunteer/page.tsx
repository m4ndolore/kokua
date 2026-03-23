'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitVolunteer, type FormState } from '@/lib/actions'
import { ISLANDS, VOLUNTEER_SKILLS, VOLUNTEER_AVAILABILITY, CONTACT_METHODS } from '@/lib/types'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 disabled:bg-ocean-300 text-white rounded-xl px-6 py-4 text-base font-semibold transition-colors"
    >
      {pending ? 'Submitting…' : 'Sign Up to Volunteer'}
    </button>
  )
}

const initialState: FormState = { success: false, error: null }

export default function VolunteerSignup() {
  const [state, formAction] = useFormState(submitVolunteer, initialState)

  if (state.success) {
    return (
      <div className="py-12 text-center">
        <div className="bg-white rounded-xl border border-ocean-200 p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-ocean-800 mb-3">Volunteer signup received</h2>
          <p className="text-gray-600 mb-2">
            Mahalo for volunteering. A coordinator will reach out when there&apos;s a good fit for your skills.
          </p>
          <div className="space-y-2 mt-6">
            <a href="/can-help" className="block text-ocean-600 hover:text-ocean-800 underline text-sm">
              ← Back to ways to help
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-ocean-800 mb-1">Volunteer Your Time</h1>
      <p className="text-sm text-gray-500 mb-6">
        Sign up and a coordinator will connect you with where you&apos;re needed most.
      </p>

      {state.error && (
        <div className="bg-lava-500/10 border border-lava-500/30 rounded-lg p-3 mb-4 text-sm text-lava-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Your name <span className="text-lava-500">*</span>
          </label>
          <input id="name" name="name" type="text" required
            placeholder="First name or nickname is fine"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

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
            Area or neighborhood <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input id="neighborhood" name="neighborhood" type="text"
            placeholder="Where you're based or can easily reach"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            What can you help with? <span className="text-lava-500">*</span>
            <span className="block text-xs text-gray-400 font-normal mt-0.5">Select all that apply</span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {VOLUNTEER_SKILLS.map(skill => (
              <label key={skill} className="flex items-center gap-2.5 text-sm bg-white border border-gray-200 rounded-lg px-3 py-3 cursor-pointer hover:border-ocean-300 active:bg-ocean-50">
                <input type="checkbox" name="skills" value={skill} className="rounded w-4 h-4" />
                {skill}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Availability <span className="text-lava-500">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {VOLUNTEER_AVAILABILITY.map(opt => (
              <label key={opt} className="text-center cursor-pointer">
                <input type="radio" name="availability" value={opt} required className="peer sr-only" />
                <span className="block rounded-lg border border-gray-200 px-2 py-3 text-sm peer-checked:bg-ocean-600 peer-checked:text-white peer-checked:border-ocean-600 hover:border-ocean-300 active:bg-ocean-50 transition-colors">
                  {opt}
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
          <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-1.5">
            Languages spoken <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input id="languages" name="languages" type="text"
            placeholder="e.g. English, Hawaiian, Tagalog, Japanese"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input type="checkbox" name="has_vehicle" className="rounded w-4 h-4 mt-0.5" />
          <span className="text-gray-600">
            I have access to a vehicle and can help with transportation or delivery.
          </span>
        </label>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1.5">
            Anything else? <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea id="note" name="note" rows={2}
            placeholder="Special skills, equipment, schedule details, etc."
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

        <SubmitButton />

        <p className="text-xs text-gray-400 text-center">
          Your information is shared only with volunteer coordinators.
        </p>
      </form>
    </div>
  )
}
