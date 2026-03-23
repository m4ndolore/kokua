'use client'

import { useState, useMemo } from 'react'
import { ISLANDS, HUB_CATEGORIES } from '@/lib/types'
import type { DonationLink, HelpHub, PublicNeedSummary } from '@/lib/types'
import { ShareButton } from '@/components/share-button'
import { HubSignalButtons } from '@/components/signal-buttons'

function truncateText(text: string, maxLength = 180) {
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

function hubStatusColor(status: string) {
  const colors: Record<string, string> = {
    Open: 'bg-green-100 text-green-800',
    Limited: 'bg-amber-100 text-amber-800',
    Closed: 'bg-gray-100 text-gray-500',
    Unknown: 'bg-gray-100 text-gray-500',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-700'
}

function confidenceBadge(confidence: string) {
  if (confidence === 'high') return null // don't clutter high-confidence items
  const colors: Record<string, string> = {
    medium: 'bg-amber-50 text-amber-700',
    low: 'bg-lava-500/10 text-lava-600',
  }
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[confidence] ?? ''}`}>
      {confidence === 'low' ? 'Unverified' : 'Needs verification'}
    </span>
  )
}

function sourceLabel(sourceName: string | null, sourceType: string | null) {
  if (!sourceName) return null
  const typeLabel: Record<string, string> = {
    official: 'Official',
    nonprofit: 'Nonprofit',
    news: 'News',
    community: 'Community',
    internal: '',
  }
  const prefix = sourceType ? typeLabel[sourceType] : null
  return (
    <span className="text-xs text-gray-400">
      {prefix ? `${prefix}: ` : ''}{sourceName}
    </span>
  )
}

function SourceAction({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-md border border-ocean-200 px-3 py-1.5 text-xs font-medium text-ocean-700 hover:bg-ocean-50 transition-colors"
    >
      {label} ↗
    </a>
  )
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
  donations,
}: {
  hubs: HelpHub[]
  summaries: PublicNeedSummary[]
  donations: DonationLink[]
}) {
  const [islandFilter, setIslandFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState<'category' | 'status' | 'recent'>('category')

  const filteredSummaries = summaries.filter(s => !islandFilter || s.island === islandFilter)
  const filteredDonations = donations.filter(d => !islandFilter || !d.island || d.island === islandFilter)

  const filteredHubs = useMemo(() => {
    let result = hubs
      .filter(h => !islandFilter || h.island === islandFilter)
      .filter(h => !categoryFilter || h.category === categoryFilter)
      .filter(h => !statusFilter || h.status === statusFilter)

    if (sortBy === 'status') {
      const order: Record<string, number> = { Open: 0, Limited: 1, Unknown: 2, Closed: 3 }
      result = [...result].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
    } else if (sortBy === 'recent') {
      result = [...result].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    } else {
      result = [...result].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    }
    return result
  }, [hubs, islandFilter, categoryFilter, statusFilter, sortBy])

  const openHubs = filteredHubs.filter(h => h.status !== 'Closed')
  const activeCategories = useMemo(() => {
    const cats = new Map<string, number>()
    hubs.filter(h => !islandFilter || h.island === islandFilter).forEach(h => cats.set(h.category, (cats.get(h.category) ?? 0) + 1))
    return cats
  }, [hubs, islandFilter])

  return (
    <div className="py-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ocean-900 mb-1">Find Help Near You</h1>
      <p className="text-sm text-gray-500 mb-4">
        Resources verified by volunteer coordinators. Call ahead when possible.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <select
          value={islandFilter}
          onChange={e => { setIslandFilter(e.target.value); setCategoryFilter('') }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-ocean-400"
        >
          <option value="">All islands</option>
          {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-ocean-400"
        >
          <option value="">All categories</option>
          {HUB_CATEGORIES.filter(c => activeCategories.has(c)).map(c => (
            <option key={c} value={c}>{c} ({activeCategories.get(c)})</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-ocean-400"
        >
          <option value="">Any status</option>
          <option value="Open">Open</option>
          <option value="Limited">Limited</option>
          <option value="Closed">Closed</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'category' | 'status' | 'recent')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-ocean-400"
        >
          <option value="category">Sort: Category</option>
          <option value="status">Sort: Status</option>
          <option value="recent">Sort: Recently updated</option>
        </select>
      </div>

      {/* Need summaries */}
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
                <p className="text-sm text-gray-600">{truncateText(s.description, 160)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {s.source_url && (
                    <SourceAction
                      href={s.source_url}
                      label={s.source_name ? `Read source: ${s.source_name}` : `Read source: ${sourceHost(s.source_url)}`}
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {sourceLabel(s.source_name, s.source_type)}
                  {s.last_verified_at && (
                    <span className="text-[10px] text-gray-400">
                      Verified {new Date(s.last_verified_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Donation links */}
      {filteredDonations.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-earth-700 mb-3">Donate & Support</h2>
          <div className="space-y-2">
            {filteredDonations.slice(0, 4).map(d => (
              <div key={d.id} className="bg-white border border-earth-100 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-sm text-gray-900">{d.title}</h3>
                    {d.organization && <p className="text-xs text-gray-500">{d.organization}</p>}
                    {d.description && <p className="text-xs text-gray-600 mt-0.5">{truncateText(d.description, 140)}</p>}
                  </div>
                  <div className="shrink-0 flex flex-col gap-2">
                    <a href={d.destination_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium text-earth-700 bg-earth-50 hover:bg-earth-100 px-3 py-1.5 rounded transition-colors text-center">
                      Donate ↗
                    </a>
                    {d.source_url && (
                      <a href={d.source_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium text-ocean-700 border border-ocean-200 hover:bg-ocean-50 px-3 py-1.5 rounded transition-colors text-center">
                        Source ↗
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                  {sourceLabel(d.source_name, d.source_type)}
                  {confidenceBadge(d.confidence)}
                  {d.last_verified_at && (
                    <span className="text-[10px] text-gray-400">
                      Verified {new Date(d.last_verified_at).toLocaleDateString()}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">External site</span>
                  <ShareButton title={d.title} text={`${d.title}${d.organization ? ` by ${d.organization}` : ''}`} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-center mt-3">
            <a href="/donate" className="text-sm text-earth-600 hover:text-earth-800 underline">
              View all donation options →
            </a>
          </p>
        </section>
      )}

      {/* Help Hubs */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold text-ocean-800">
            Resources &amp; Services
          </h2>
          <span className="text-xs text-gray-400">
            {filteredHubs.length} shown
            {openHubs.length !== filteredHubs.length && ` · ${openHubs.length} open`}
          </span>
        </div>

        {filteredHubs.length === 0 ? (
          <div className="bg-white border border-ocean-100 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">No resources listed for this area yet.</p>
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
                {h.address && <p className="text-sm text-gray-600 mb-1">{h.address}</p>}
                {h.hours && <p className="text-xs text-gray-500 mb-1">Hours: {h.hours}</p>}
                {h.notes && <p className="text-sm text-gray-600 mb-1">{truncateText(h.notes, 180)}</p>}
                <div className="text-xs text-gray-500 flex flex-wrap gap-3 mt-2">
                  {h.public_phone && <span>Phone: {h.public_phone}</span>}
                  {h.public_email && <span>Email: {h.public_email}</span>}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {h.source_url && (
                    <SourceAction
                      href={h.source_url}
                      label={h.source_name ? `Open latest source: ${h.source_name}` : `Open latest source: ${sourceHost(h.source_url)}`}
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                  {sourceLabel(h.source_name, h.source_type)}
                  {confidenceBadge(h.confidence)}
                  {h.last_verified_at && (
                    <span className="text-[10px] text-gray-400">
                      Verified {new Date(h.last_verified_at).toLocaleDateString()}
                    </span>
                  )}
                  <ShareButton title={h.name} text={`${h.name} — ${h.category} on ${h.island}`} />
                  <HubSignalButtons hubId={h.id} />
                </div>
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
