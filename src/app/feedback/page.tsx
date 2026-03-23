'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { submitFeedback, type FormState } from '@/lib/actions'
import { FEEDBACK_CATEGORIES } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  question: 'Question',
  feedback: 'General feedback',
  report_issue: 'Report incorrect info',
  suggest_resource: 'Suggest a resource',
  bug: 'Report a bug',
  feature_request: 'Feature suggestion',
  other: 'Other',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 disabled:bg-ocean-300 text-white rounded-xl px-6 py-3.5 text-base font-semibold transition-colors"
    >
      {pending ? 'Sending…' : 'Send Feedback'}
    </button>
  )
}

const initialState: FormState = { success: false, error: null }

export default function FeedbackPage() {
  const [state, formAction] = useFormState(submitFeedback, initialState)
  const [pageUrl, setPageUrl] = useState('')

  useEffect(() => {
    setPageUrl(window.location.href)
  }, [])

  if (state.success) {
    return (
      <div className="py-12 text-center">
        <div className="bg-white rounded-xl border border-ocean-200 p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-ocean-800 mb-3">Thank you</h2>
          <p className="text-gray-600 mb-6">
            Your feedback has been received. A coordinator will review it.
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
      <h1 className="text-2xl font-bold text-ocean-900 mb-1">Report an issue / correction</h1>
      <p className="text-sm text-gray-500 mb-6">
        Incorrect or missing info, broken links, bugs, or suggestions. No login required.
      </p>

      {state.error && (
        <div className="bg-lava-500/10 border border-lava-500/30 rounded-lg p-3 mb-4 text-sm text-lava-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="feedback_category" className="block text-sm font-medium text-gray-700 mb-1.5">
            What kind of feedback? <span className="text-lava-500">*</span>
          </label>
          <select id="feedback_category" name="feedback_category" required defaultValue="report_issue"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base bg-white focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400">
            <option value="">Select</option>
            {FEEDBACK_CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="feedback_message" className="block text-sm font-medium text-gray-700 mb-1.5">
            Your message <span className="text-lava-500">*</span>
          </label>
          <textarea id="feedback_message" name="feedback_message" rows={4} required
            placeholder="What would you like to share?"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

        <div>
          <label htmlFor="feedback_contact" className="block text-sm font-medium text-gray-700 mb-1.5">
            Contact info <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input id="feedback_contact" name="feedback_contact" type="text"
            placeholder="Only if you'd like us to follow up"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400" />
        </div>

        {/* Hidden field to track which page the feedback came from */}
        <input type="hidden" name="feedback_page_url" value={pageUrl} />

        <SubmitButton />

        <p className="text-xs text-gray-400 text-center">
          Your contact info is never shown publicly. Bug reports and feature suggestions
          may be shared (without personal details) to help improve this tool.
        </p>
      </form>
    </div>
  )
}
