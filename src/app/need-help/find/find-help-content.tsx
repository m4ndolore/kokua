'use client'

import { useState } from 'react'
import { ISLANDS } from '@/lib/types'
import type { HelpHub, PublicNeedSummary } from '@/lib/types'

function hubStatusColor(status: string) {
  const colors: Record<string, string> = {
    Open: 'bg-green-100 text-green-800',
    Limited: 'bg-amber-100 text-amber-800',
    Closed: 'bg-gray-100 text-gray-500',
    Unknown: 'bg-gray-100 text-gray-500',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-700'
}

function needUrgencyColor(urgency: string) {
  const colors: Record<string, string> = {
    Urgent: 'bg-lava-500/15 text-lava-700',
    High: 'bg-amber-100 text-amber-800',
    Normal: 'bg-ocean-50 text-ocean-700',
  }
  return colors[urgency] ?? 'bg-gray-100 text-gray-700'
}

export function FindHelpContent({
  hubs,
  summaries,
}: {
  hubs: HelpHub[]
  summaries: PublicNeedSummary[]
}) {
  const [islandFilter, setIslandFilter] = useState('')

  const filteredHubs = hubs.filter(h =>
    !islandFilter || h.island === islandFilter
  )
  const filteredSummaries = summaries.filter(s =>
    !islandFilter || s.island === islandFilter
  )

  const openHubs = filteredHubs.filter(h => h.status !== 'Closed')

  return (
    <div className="py-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ocean-900 mb-1">Find Help Near You</h1>
      <p className="text-sm text-gray-500 mb-4">
        Resources verified by volunteer coordinators. Call ahead when possible.
      </p>

      {/* Island filter */}
      <div className="mb-6">
        <select
          value={islandFilter}
          onChange={e => setIslandFilter(e.target.value)}
          className="w-full sm:w-auto rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-ocean-400"
        >
          <option value="">All islands</option>
          {ISLANDS.map(i => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>

      {/* Need summaries — "Ways to Help Right Now" from public perspective means "Current needs" */}
      {filteredSummaries.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-ocean-800 mb-3">Current Needs</h2>
          <div className="space-y-2">
            {filteredSummaries.map(s => (
              <div key={s.id} className="bg-white border border-ocean-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${needUrgencyColor(s.urgency)}`}>
                    {s.urgency}
                  </span>
                  <span className="text-xs text-gray-400">{s.island}{s.area ? ` · ${s.area}` : ''}</span>
                </div>
                <h3 className="font-medium text-sm text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Help Hubs */}
      <section>
        <h2 className="text-lg font-semibold text-ocean-800 mb-3">
          Resources &amp; Services
          {openHubs.length > 0 && (
            <span className="text-sm font-normal text-gray-400 ml-2">
              {openHubs.length} currently open
            </span>
          )}
        </h2>

        {filteredHubs.length === 0 ? (
          <div className="bg-white border border-ocean-100 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">
              No resources listed for this area yet.
            </p>
            <p className="text-sm text-gray-400">
              Coordinators are actively adding verified resources.
              Check back soon or <a href="/need-help/request" className="text-ocean-600 underline">submit a request</a>.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHubs.map(h => (
              <div key={h.id} className="bg-white border border-ocean-100 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-medium text-sm text-gray-900">{h.name}</h3>
                  <span className={`shrink-0 inline-block px-2 py-0.5 rounded text-xs font-medium ${hubStatusColor(h.status)}`}>
                    {h.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  <span>{h.island} · {h.area}</span>
                  <span className="mx-1">·</span>
                  <span className="text-ocean-600">{h.category}</span>
                </div>
                {h.address && (
                  <p className="text-sm text-gray-600 mb-1">{h.address}</p>
                )}
                {h.hours && (
                  <p className="text-xs text-gray-500 mb-1">Hours: {h.hours}</p>
                )}
                {h.notes && (
                  <p className="text-sm text-gray-600 mb-1">{h.notes}</p>
                )}
                <div className="text-xs text-gray-500 flex flex-wrap gap-3 mt-2">
                  {h.public_phone && <span>Phone: {h.public_phone}</span>}
                  {h.public_email && <span>Email: {h.public_email}</span>}
                </div>
                {h.last_verified_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last verified: {new Date(h.last_verified_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer links */}
      <div className="mt-8 pt-4 border-t border-ocean-100 text-center text-sm space-y-2">
        <p>
          <a href="/need-help/request" className="text-ocean-600 hover:text-ocean-800 underline">
            Don&apos;t see what you need? Submit a help request →
          </a>
        </p>
        <p>
          <a href="/can-help/share-info" className="text-gray-400 hover:text-ocean-600 underline">
            Know about a resource not listed here? Let us know.
          </a>
        </p>
      </div>
    </div>
  )
}
