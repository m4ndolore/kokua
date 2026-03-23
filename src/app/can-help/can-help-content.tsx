'use client'

import { useState } from 'react'
import { ISLANDS } from '@/lib/types'
import type { DonationLink, PublicNeedSummary } from '@/lib/types'

function truncateText(text: string, maxLength = 160) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}...`
}

function sourceHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function CanHelpContent({
  summaries,
  donations,
}: {
  summaries: PublicNeedSummary[]
  donations: DonationLink[]
}) {
  const [islandFilter, setIslandFilter] = useState('')

  const filteredSummaries = summaries.filter(s => !islandFilter || s.island === islandFilter)
  const filteredDonations = donations.filter(d => !islandFilter || !d.island || d.island === islandFilter)

  return (
    <div className="py-6 sm:py-10 max-w-lg mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-earth-800 mb-2 text-center">
        I Can Help
      </h1>
      <p className="text-sm text-gray-500 text-center mb-6">
        Thank you for stepping up. Here are ways to get involved.
      </p>

      {/* Island filter */}
      <div className="flex justify-center mb-6">
        <select
          value={islandFilter}
          onChange={e => setIslandFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-ocean-400"
        >
          <option value="">All islands</option>
          {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {/* Ways to help right now */}
      {filteredSummaries.length > 0 && (
        <section className="mb-8">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold text-ocean-800">Ways to Help Right Now</h2>
            <span className="text-xs text-gray-400">{filteredSummaries.length}</span>
          </div>
          <div className="space-y-2 mb-4">
            {filteredSummaries.map(s => {
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
                  <p className="text-sm text-gray-600 mt-0.5">{truncateText(s.description)}</p>
                  {s.source_url && (
                    <div className="mt-2">
                      <a
                        href={s.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md border border-ocean-200 px-3 py-1.5 text-xs font-medium text-ocean-700 hover:bg-ocean-50 transition-colors"
                      >
                        {s.source_name ? `Read source: ${s.source_name}` : `Read source: ${sourceHost(s.source_url)}`} ↗
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Donation options */}
      {filteredDonations.length > 0 && (
        <section className="mb-8">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold text-earth-700">Donate & Support</h2>
            <span className="text-xs text-gray-400">{filteredDonations.length}</span>
          </div>
          <div className="space-y-2 mb-3">
            {filteredDonations.map(d => (
              <a key={d.id} href={d.destination_url} target="_blank" rel="noopener noreferrer"
                className="block bg-white border border-earth-100 rounded-lg p-3 hover:bg-earth-50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-sm text-gray-900">{d.title}</h3>
                    {d.organization && <p className="text-xs text-gray-500">{d.organization}</p>}
                    {d.description && <p className="text-xs text-gray-600 mt-1">{truncateText(d.description, 120)}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-earth-600">Donate ↗</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {d.source_url && (
                    <span className="text-[11px] text-gray-500">
                      Listed from {d.source_name || sourceHost(d.source_url)}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
          <p className="text-center">
            <a href="/donate" className="text-sm text-earth-600 hover:text-earth-800 underline">
              View all donation options →
            </a>
          </p>
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
