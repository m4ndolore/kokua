import { supabase } from '@/lib/supabase'
import type { PublicNeedSummary } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CanHelp() {
  const summariesRes = await supabase?.from('public_need_summaries')
    .select('*')
    .eq('is_visible', true)
    .order('urgency')
    .order('created_at', { ascending: false })
    .limit(5)

  const summaries = (summariesRes?.data ?? []) as PublicNeedSummary[]

  return (
    <div className="py-6 sm:py-10 max-w-lg mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-earth-800 mb-2 text-center">
        I Can Help
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Thank you for stepping up. Here are ways to get involved.
      </p>

      {/* Ways to help right now */}
      {summaries.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-ocean-800 mb-3">Ways to Help Right Now</h2>
          <div className="space-y-2 mb-4">
            {summaries.map(s => {
              const urgencyColor = s.urgency === 'Urgent'
                ? 'border-l-lava-500'
                : s.urgency === 'High'
                  ? 'border-l-amber-400'
                  : 'border-l-ocean-300'
              return (
                <div key={s.id} className={`bg-white border border-ocean-100 border-l-4 ${urgencyColor} rounded-lg p-3`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-400">{s.island}{s.area ? ` · ${s.area}` : ''}</span>
                    <span className="text-xs text-ocean-600">{s.category}</span>
                  </div>
                  <h3 className="font-medium text-sm text-gray-900">{s.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{s.description}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <a
          href="/can-help/offer"
          className="block bg-earth-600 hover:bg-earth-700 active:bg-earth-800 text-white rounded-xl px-6 py-5 transition-colors"
        >
          <span className="text-lg font-semibold block mb-1">Offer Supplies or Services</span>
          <span className="text-sm text-earth-100">
            Share what you have — food, water, transportation, space, or supplies.
          </span>
        </a>

        <a
          href="/can-help/volunteer"
          className="block bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 text-white rounded-xl px-6 py-5 transition-colors"
        >
          <span className="text-lg font-semibold block mb-1">Volunteer Your Time</span>
          <span className="text-sm text-ocean-100">
            Sign up to help with cleanup, delivery, coordination, or other tasks.
          </span>
        </a>

        <a
          href="/can-help/share-info"
          className="block bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-6 py-5 transition-colors"
        >
          <span className="text-lg font-semibold block mb-1">Share a Resource</span>
          <span className="text-sm text-gray-500">
            Know about a shelter, supply site, or service? Let coordinators know.
          </span>
        </a>
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        All submissions are reviewed by volunteer coordinators.
      </p>
    </div>
  )
}
