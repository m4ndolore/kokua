'use client'

import { useState, useTransition, useRef } from 'react'
import {
  updateStatus, updateCoordinatorNotes,
  updateHubStatus, updateHubVisibility,
  updateSummaryVisibility,
  updateReviewItemStatus,
  updateSignalReview,
  updateSourceActive,
} from '@/lib/dashboard-actions'
import {
  ISLANDS, REQUEST_STATUSES, OFFER_STATUSES, VOLUNTEER_STATUSES,
  URGENCY_LEVELS, HUB_STATUSES, REVIEW_STATUSES, VISIBILITY_STATUSES,
  SIGNAL_REVIEW_STATUSES, CONFIDENCE_LEVELS, SIGNAL_TYPES,
} from '@/lib/types'
import type {
  HelpRequest, HelpOffer, Volunteer,
  HelpHub, PublicNeedSummary, ReviewQueueItem,
  SourceRegistry, SourceSignal, DashboardUser, Role,
} from '@/lib/types'

// ============================================================
// Shared utilities
// ============================================================

type Tab = 'requests' | 'offers' | 'volunteers' | 'hubs' | 'summaries' | 'review' | 'signals' | 'sources'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>
}

const urgencyColors: Record<string, string> = {
  Urgent: 'bg-lava-500/15 text-lava-700', Soon: 'bg-amber-100 text-amber-800',
  Flexible: 'bg-green-100 text-green-800', High: 'bg-amber-100 text-amber-800',
  Normal: 'bg-ocean-50 text-ocean-700',
}

const statusColors: Record<string, string> = {
  New: 'bg-blue-100 text-blue-800', Reviewing: 'bg-yellow-100 text-yellow-800',
  Available: 'bg-green-100 text-green-800', Matched: 'bg-purple-100 text-purple-800',
  Assigned: 'bg-purple-100 text-purple-800', Completed: 'bg-gray-100 text-gray-600',
  Archived: 'bg-gray-50 text-gray-400', Active: 'bg-green-100 text-green-800',
  'On hold': 'bg-yellow-100 text-yellow-800', Inactive: 'bg-gray-100 text-gray-500',
  Open: 'bg-green-100 text-green-800', Limited: 'bg-amber-100 text-amber-800',
  Closed: 'bg-gray-100 text-gray-500', Unknown: 'bg-gray-50 text-gray-400',
  Pending: 'bg-blue-100 text-blue-800', Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-lava-500/15 text-lava-700', Duplicate: 'bg-gray-100 text-gray-500',
  Escalated: 'bg-purple-100 text-purple-800',
  pending: 'bg-blue-100 text-blue-800', approved: 'bg-green-100 text-green-800',
  rejected: 'bg-lava-500/15 text-lava-700', escalated: 'bg-purple-100 text-purple-800',
}

const confidenceColors: Record<string, string> = {
  high: 'bg-green-100 text-green-800', medium: 'bg-amber-100 text-amber-800',
  low: 'bg-lava-500/10 text-lava-600',
}

const trustColors: Record<string, string> = {
  high: 'bg-green-100 text-green-800', medium: 'bg-amber-100 text-amber-800',
  low: 'bg-lava-500/10 text-lava-600',
}

const visibilityColors: Record<string, string> = {
  public: 'bg-green-100 text-green-800', internal: 'bg-gray-100 text-gray-600',
  review: 'bg-yellow-100 text-yellow-800',
}

function StatusSelect({ current, options, onUpdate }: {
  current: string; options: readonly string[]; onUpdate: (val: string) => void
}) {
  const [pending, startTransition] = useTransition()
  return (
    <select value={current} disabled={pending}
      onChange={e => startTransition(() => onUpdate(e.target.value))}
      className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white disabled:opacity-50">
      {options.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}

function NotesField({ table, id, initial }: {
  table: 'help_requests' | 'help_offers' | 'volunteers' | 'help_hubs' | 'public_need_summaries' | 'source_signals'
  id: string; initial: string | null
}) {
  const [value, setValue] = useState(initial ?? '')
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  function handleSave() {
    updateCoordinatorNotes(table, id, value)
    setSaved(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSaved(false), 2000)
  }
  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
      <label className="text-xs text-gray-400 block mb-1">Coordinator notes</label>
      <div className="flex gap-1.5">
        <input type="text" value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          placeholder="Internal notes…"
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-ocean-400" />
        <button onClick={handleSave}
          className="text-xs px-2 py-1.5 bg-ocean-50 text-ocean-700 rounded hover:bg-ocean-100 transition-colors">
          {saved ? '✓' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function VisibilitySelect({ current, onUpdate }: {
  current: string; onUpdate: (val: string) => void
}) {
  const [pending, startTransition] = useTransition()
  return (
    <select value={current} disabled={pending}
      onChange={e => startTransition(() => onUpdate(e.target.value))}
      className={`text-xs border rounded px-1.5 py-1 disabled:opacity-50 ${visibilityColors[current] ?? 'bg-gray-100'}`}>
      {VISIBILITY_STATUSES.map(v => <option key={v} value={v}>{v}</option>)}
    </select>
  )
}

function CardList({ children, empty }: { children: React.ReactNode[]; empty: string }) {
  return (
    <div className="space-y-3">
      {children.length === 0
        ? <p className="text-sm text-gray-400 text-center py-8">{empty}</p>
        : children}
    </div>
  )
}

// ============================================================
// Main dashboard
// ============================================================

export function DashboardContent({
  role, userName,
  requests: initialRequests, offers: initialOffers, volunteers: initialVolunteers,
  hubs: initialHubs, summaries: initialSummaries, reviewItems: initialReview,
  signals: initialSignals, sources: initialSources, users,
}: {
  role: Role; userName: string
  requests: HelpRequest[]; offers: HelpOffer[]; volunteers: Volunteer[]
  hubs: HelpHub[]; summaries: PublicNeedSummary[]; reviewItems: ReviewQueueItem[]
  signals: SourceSignal[]; sources: SourceRegistry[]; users: DashboardUser[]
}) {
  const [tab, setTab] = useState<Tab>('requests')
  const [requests, setRequests] = useState(initialRequests)
  const [offers, setOffers] = useState(initialOffers)
  const [volunteers, setVolunteers] = useState(initialVolunteers)
  const [hubs, setHubs] = useState(initialHubs)
  const [summaries, setSummaries] = useState(initialSummaries)
  const [reviewItems, setReviewItems] = useState(initialReview)
  const [signals, setSignals] = useState(initialSignals)
  const [sources, setSources] = useState(initialSources)
  const [islandFilter, setIslandFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const isAdminRole = role === 'admin'

  const pendingReviewCount = reviewItems.filter(r => r.status === 'Pending').length
  const pendingSignalCount = signals.filter(s => s.needs_review).length
  const newRequestCount = requests.filter(r => r.status === 'New').length
  const urgentCount = requests.filter(r => r.urgency === 'Urgent' && r.status !== 'Completed' && r.status !== 'Archived').length

  // Source name lookup
  const sourceMap = new Map(sources.map(s => [s.id, s]))

  const tabs: { key: Tab; label: string; count?: number; adminOnly?: boolean }[] = [
    { key: 'requests', label: 'Requests', count: requests.length },
    { key: 'offers', label: 'Offers', count: offers.length },
    { key: 'volunteers', label: 'Volunteers', count: volunteers.length },
    { key: 'hubs', label: 'Hubs', count: hubs.length },
    { key: 'summaries', label: 'Needs', count: summaries.length },
    { key: 'review', label: 'Review', count: pendingReviewCount || undefined },
    { key: 'signals', label: 'Signals', count: pendingSignalCount || undefined },
    { key: 'sources', label: 'Sources', count: sources.length, adminOnly: true },
  ]

  const visibleTabs = tabs.filter(t => !t.adminOnly || isAdminRole)

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-ocean-900">Coordination Board</h1>
          <p className="text-xs text-gray-400">Signed in as {userName} ({role})</p>
        </div>
        <div className="text-xs text-right text-gray-500">
          {newRequestCount > 0 && <span className="block text-blue-700 font-medium">{newRequestCount} new requests</span>}
          {urgentCount > 0 && <span className="block text-lava-600 font-medium">{urgentCount} urgent</span>}
          {pendingReviewCount > 0 && <span className="block text-amber-700 font-medium">{pendingReviewCount} pending review</span>}
          {pendingSignalCount > 0 && <span className="block text-purple-700 font-medium">{pendingSignalCount} signals need review</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-4 bg-white rounded-lg p-1 border border-ocean-100 overflow-x-auto">
        {visibleTabs.map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); setStatusFilter('') }}
            className={`flex-shrink-0 text-xs font-medium rounded-md px-2.5 py-2 transition-colors ${
              tab === t.key ? 'bg-ocean-600 text-white' : 'text-gray-500 hover:text-ocean-800'}`}>
            {t.label}
            {t.count !== undefined && <span className={`ml-1 ${tab === t.key ? 'text-ocean-200' : 'text-gray-400'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={islandFilter} onChange={e => setIslandFilter(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white">
          <option value="">All islands</option>
          {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        {tab === 'requests' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white">
            <option value="">All statuses</option>
            {REQUEST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {tab === 'offers' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white">
            <option value="">All statuses</option>
            {OFFER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {tab === 'volunteers' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white">
            <option value="">All statuses</option>
            {VOLUNTEER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {tab === 'hubs' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white">
            <option value="">All statuses</option>
            {HUB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {tab === 'review' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white">
            <option value="">All statuses</option>
            {REVIEW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {tab === 'signals' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white">
            <option value="">All review statuses</option>
            {SIGNAL_REVIEW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* ============ REQUESTS ============ */}
      {tab === 'requests' && (
        <CardList empty="No requests match your filters.">
          {requests
            .filter(r => (!islandFilter || r.island === islandFilter) && (!statusFilter || r.status === statusFilter))
            .map(r => (
              <div key={r.id} className="bg-white border border-ocean-100 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge label={r.urgency} color={urgencyColors[r.urgency] ?? 'bg-gray-100 text-gray-700'} />
                    <Badge label={r.status} color={statusColors[r.status] ?? 'bg-gray-100 text-gray-700'} />
                    <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                  </div>
                  <StatusSelect current={r.status} options={REQUEST_STATUSES}
                    onUpdate={s => { setRequests(p => p.map(x => x.id === r.id ? { ...x, status: s } : x)); updateStatus('help_requests', r.id, s) }} />
                </div>
                <div className="text-sm mb-1.5"><span className="font-medium">{r.island}</span><span className="text-gray-400 mx-1">·</span><span className="text-gray-600">{r.neighborhood}</span></div>
                <div className="flex flex-wrap gap-1 mb-2">{r.need_types.map(t => <span key={t} className="bg-ocean-50 text-ocean-700 text-xs px-2 py-0.5 rounded">{t}</span>)}</div>
                {r.note && <p className="text-sm text-gray-600 mb-2">{r.note}</p>}
                <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                  <span>{r.contact_method}: {r.contact_value}</span>
                  {r.alt_contact && <span>Alt: {r.alt_contact}</span>}
                  {r.can_be_contacted && <span className="text-ocean-600 font-medium">Can contact</span>}
                </div>
                <NotesField table="help_requests" id={r.id} initial={r.coordinator_notes} />
              </div>
            ))}
        </CardList>
      )}

      {/* ============ OFFERS ============ */}
      {tab === 'offers' && (
        <CardList empty="No offers match your filters.">
          {offers
            .filter(o => (!islandFilter || o.island === islandFilter) && (!statusFilter || o.status === statusFilter))
            .map(o => (
              <div key={o.id} className="bg-white border border-earth-100 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge label={o.status} color={statusColors[o.status] ?? 'bg-gray-100 text-gray-700'} />
                    <span className="text-xs text-earth-600 font-medium">{o.availability}</span>
                    <span className="text-xs text-gray-400">{timeAgo(o.created_at)}</span>
                  </div>
                  <StatusSelect current={o.status} options={OFFER_STATUSES}
                    onUpdate={s => { setOffers(p => p.map(x => x.id === o.id ? { ...x, status: s } : x)); updateStatus('help_offers', o.id, s) }} />
                </div>
                <div className="text-sm mb-1.5"><span className="font-medium">{o.island}</span><span className="text-gray-400 mx-1">·</span><span className="text-gray-600">{o.neighborhood}</span></div>
                <div className="flex flex-wrap gap-1 mb-2">{o.offer_types.map(t => <span key={t} className="bg-earth-50 text-earth-700 text-xs px-2 py-0.5 rounded">{t}</span>)}</div>
                {o.capacity && <p className="text-xs text-earth-600 mb-1">Capacity: {o.capacity}</p>}
                {o.note && <p className="text-sm text-gray-600 mb-2">{o.note}</p>}
                <div className="text-xs text-gray-500"><span>{o.contact_method}: {o.contact_value}</span></div>
                <NotesField table="help_offers" id={o.id} initial={o.coordinator_notes} />
              </div>
            ))}
        </CardList>
      )}

      {/* ============ VOLUNTEERS ============ */}
      {tab === 'volunteers' && (
        <CardList empty="No volunteers match your filters.">
          {volunteers
            .filter(v => (!islandFilter || v.island === islandFilter) && (!statusFilter || v.status === statusFilter))
            .map(v => (
              <div key={v.id} className="bg-white border border-ocean-100 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge label={v.status} color={statusColors[v.status] ?? 'bg-gray-100 text-gray-700'} />
                    <span className="text-xs text-ocean-600 font-medium">{v.availability}</span>
                    <span className="text-xs text-gray-400">{timeAgo(v.created_at)}</span>
                  </div>
                  <StatusSelect current={v.status} options={VOLUNTEER_STATUSES}
                    onUpdate={s => { setVolunteers(p => p.map(x => x.id === v.id ? { ...x, status: s } : x)); updateStatus('volunteers', v.id, s) }} />
                </div>
                <div className="text-sm font-medium mb-1">{v.name}</div>
                <div className="text-xs text-gray-500 mb-1.5">{v.island}{v.neighborhood ? ` · ${v.neighborhood}` : ''}</div>
                <div className="flex flex-wrap gap-1 mb-2">{v.skills.map(s => <span key={s} className="bg-ocean-50 text-ocean-700 text-xs px-2 py-0.5 rounded">{s}</span>)}</div>
                <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                  <span>{v.contact_method}: {v.contact_value}</span>
                  {v.languages && <span>Languages: {v.languages}</span>}
                  {v.has_vehicle && <span className="text-ocean-600 font-medium">Has vehicle</span>}
                </div>
                {v.note && <p className="text-sm text-gray-600 mt-1">{v.note}</p>}
                <NotesField table="volunteers" id={v.id} initial={v.coordinator_notes} />
              </div>
            ))}
        </CardList>
      )}

      {/* ============ HELP HUBS ============ */}
      {tab === 'hubs' && (
        <CardList empty="No help hubs match your filters.">
          {hubs
            .filter(h => (!islandFilter || h.island === islandFilter) && (!statusFilter || h.status === statusFilter))
            .map(h => {
              const src = h.source_registry_id ? sourceMap.get(h.source_registry_id) : null
              return (
                <div key={h.id} className="bg-white border border-ocean-100 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge label={h.status} color={statusColors[h.status] ?? 'bg-gray-100 text-gray-700'} />
                      <Badge label={h.confidence} color={confidenceColors[h.confidence] ?? 'bg-gray-100'} />
                      <VisibilitySelect current={h.visibility_status}
                        onUpdate={v => { setHubs(p => p.map(x => x.id === h.id ? { ...x, visibility_status: v } : x)); updateHubVisibility(h.id, v) }} />
                      <span className="text-xs text-gray-400">{timeAgo(h.updated_at)}</span>
                    </div>
                    <StatusSelect current={h.status} options={HUB_STATUSES}
                      onUpdate={s => { setHubs(p => p.map(x => x.id === h.id ? { ...x, status: s } : x)); updateHubStatus(h.id, s) }} />
                  </div>
                  <div className="text-sm font-medium mb-0.5">{h.name}</div>
                  <div className="text-xs text-gray-500 mb-1">
                    {h.island} · {h.area} · <span className="text-ocean-600">{h.category}</span>
                  </div>
                  {h.address && <p className="text-xs text-gray-600 mb-0.5">{h.address}</p>}
                  {h.hours && <p className="text-xs text-gray-500 mb-0.5">Hours: {h.hours}</p>}
                  {h.notes && <p className="text-sm text-gray-600 mb-1">{h.notes}</p>}
                  <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                    {h.public_phone && <span>Phone: {h.public_phone}</span>}
                    {h.public_email && <span>Email: {h.public_email}</span>}
                  </div>
                  {/* Source provenance */}
                  <div className="text-xs text-gray-400 flex flex-wrap gap-2 mt-1">
                    {(h.source_name || src) && <span>Source: {h.source_name || src?.name}</span>}
                    {h.source_type && <span>({h.source_type})</span>}
                    {h.source_url && <span className="text-ocean-500">Link</span>}
                    {h.last_verified_at && <span>Verified: {new Date(h.last_verified_at).toLocaleDateString()}</span>}
                    <span>✓{h.verification_count} ⚠{h.stale_flag_count} ♻{h.active_confirm_count}</span>
                  </div>
                  <NotesField table="help_hubs" id={h.id} initial={h.coordinator_notes} />
                </div>
              )
            })}
        </CardList>
      )}

      {/* ============ NEED SUMMARIES ============ */}
      {tab === 'summaries' && (
        <CardList empty="No need summaries yet.">
          {summaries
            .filter(s => !islandFilter || s.island === islandFilter)
            .map(s => (
              <div key={s.id} className="bg-white border border-ocean-100 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge label={s.urgency} color={urgencyColors[s.urgency] ?? 'bg-gray-100 text-gray-700'} />
                    <Badge label={s.category} color="bg-ocean-50 text-ocean-700" />
                    <Badge label={s.confidence} color={confidenceColors[s.confidence] ?? 'bg-gray-100'} />
                    <VisibilitySelect current={s.visibility_status}
                      onUpdate={v => { setSummaries(p => p.map(x => x.id === s.id ? { ...x, visibility_status: v } : x)); updateSummaryVisibility(s.id, v) }} />
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(s.updated_at)}</span>
                </div>
                <div className="text-xs text-gray-500 mb-0.5">{s.island}{s.area ? ` · ${s.area}` : ''}</div>
                <div className="text-sm font-medium mb-0.5">{s.title}</div>
                <p className="text-sm text-gray-600">{s.description}</p>
                {(s.source_name || s.source_url) && (
                  <div className="text-xs text-gray-400 mt-1">
                    {s.source_name && <span>Source: {s.source_name} </span>}
                    {s.source_type && <span>({s.source_type}) </span>}
                    {s.source_url && <span className="text-ocean-500">Link </span>}
                  </div>
                )}
                <NotesField table="public_need_summaries" id={s.id} initial={s.coordinator_notes} />
              </div>
            ))}
        </CardList>
      )}

      {/* ============ REVIEW QUEUE ============ */}
      {tab === 'review' && (
        <CardList empty="No items in the review queue.">
          {reviewItems
            .filter(r => (!islandFilter || r.submitted_island === islandFilter) && (!statusFilter || r.status === statusFilter))
            .map(r => {
              const src = r.source_registry_id ? sourceMap.get(r.source_registry_id) : null
              return <ReviewCard key={r.id} item={r} sourceName={src?.name} onStatusUpdate={(status, notes) => {
                setReviewItems(p => p.map(x => x.id === r.id ? { ...x, status, reviewer_notes: notes } : x))
                updateReviewItemStatus(r.id, status, notes)
              }} />
            })}
        </CardList>
      )}

      {/* ============ SIGNALS ============ */}
      {tab === 'signals' && (
        <CardList empty="No source signals.">
          {signals
            .filter(s => (!islandFilter || s.island === islandFilter) && (!statusFilter || s.review_status === statusFilter))
            .map(s => {
              const src = s.source_registry_id ? sourceMap.get(s.source_registry_id) : null
              return <SignalCard key={s.id} signal={s} sourceName={src?.name} sourceType={src?.source_type}
                onReview={(status, notes) => {
                  setSignals(p => p.map(x => x.id === s.id ? { ...x, review_status: status, needs_review: status === 'pending', coordinator_notes: notes } : x))
                  updateSignalReview(s.id, status, notes)
                }} />
            })}
        </CardList>
      )}

      {/* ============ SOURCES (admin only) ============ */}
      {tab === 'sources' && isAdminRole && (
        <CardList empty="No sources registered.">
          {sources.map(s => (
            <div key={s.id} className="bg-white border border-ocean-100 rounded-lg p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge label={s.source_type} color="bg-ocean-50 text-ocean-700" />
                  <Badge label={s.trust_level} color={trustColors[s.trust_level] ?? 'bg-gray-100'} />
                  {s.platform && <span className="text-xs text-gray-400">{s.platform}</span>}
                </div>
                <ActiveToggle isActive={s.is_active}
                  onToggle={val => { setSources(p => p.map(x => x.id === s.id ? { ...x, is_active: val } : x)); updateSourceActive(s.id, val) }} />
              </div>
              <div className="text-sm font-medium mb-0.5">{s.name}</div>
              {s.organization && <div className="text-xs text-gray-500 mb-0.5">{s.organization}</div>}
              <div className="text-xs text-gray-400 flex flex-wrap gap-2">
                <span>Strategy: {s.strategy}</span>
                <span>Updates: {s.update_frequency}</span>
                {s.base_url && <span className="text-ocean-500">URL</span>}
                {s.last_checked_at && <span>Last checked: {new Date(s.last_checked_at).toLocaleDateString()}</span>}
              </div>
              {s.notes && <p className="text-xs text-gray-500 mt-1">{s.notes}</p>}
            </div>
          ))}
        </CardList>
      )}
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function ActiveToggle({ isActive, onToggle }: { isActive: boolean; onToggle: (val: boolean) => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <button disabled={pending}
      onClick={() => startTransition(() => onToggle(!isActive))}
      className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 ${
        isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </button>
  )
}

function ReviewCard({ item, sourceName, onStatusUpdate }: {
  item: ReviewQueueItem; sourceName?: string
  onStatusUpdate: (status: string, notes: string) => void
}) {
  const [notes, setNotes] = useState(item.reviewer_notes ?? '')
  const isFeedback = item.origin === 'feedback'

  return (
    <div className="bg-white border border-amber-100 rounded-lg p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge label={item.status} color={statusColors[item.status] ?? 'bg-gray-100 text-gray-700'} />
          <Badge label={item.origin} color="bg-gray-100 text-gray-600" />
          {isFeedback && item.feedback_category && (
            <Badge label={item.feedback_category} color="bg-ocean-50 text-ocean-700" />
          )}
          <span className="text-xs text-gray-400">{timeAgo(item.created_at)}</span>
        </div>
      </div>

      {/* Source signal context */}
      {item.origin === 'source_signal' && sourceName && (
        <div className="text-xs text-gray-400 mb-1">Source: {sourceName}</div>
      )}

      {/* Content based on origin */}
      {isFeedback ? (
        <>
          <p className="text-sm text-gray-800 mb-1 whitespace-pre-line">{item.feedback_message}</p>
          {item.feedback_contact && <div className="text-xs text-gray-500">Contact: {item.feedback_contact}</div>}
          {item.feedback_page_url && <div className="text-xs text-gray-400">Page: {item.feedback_page_url}</div>}
        </>
      ) : (
        <>
          <div className="text-xs text-gray-500 mb-1">
            {item.submitted_island}{item.submitted_area ? ` · ${item.submitted_area}` : ''}
            {item.submitted_category && <span className="ml-1 text-ocean-600">· {item.submitted_category}</span>}
          </div>
          <p className="text-sm text-gray-800 mb-2 whitespace-pre-line">{item.submitted_info}</p>
          <div className="text-xs text-gray-500 flex flex-wrap gap-3">
            {item.submitted_name && <span>From: {item.submitted_name}</span>}
            {item.submitted_contact && <span>Contact: {item.submitted_contact}</span>}
          </div>
        </>
      )}

      {item.github_issue_url && (
        <div className="text-xs text-gray-400 mt-1">
          GitHub: #{item.github_issue_number}
        </div>
      )}

      {item.status === 'Pending' && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Reviewer notes…"
            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-ocean-400" />
          <div className="flex gap-2">
            <button onClick={() => onStatusUpdate('Approved', notes)}
              className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors">Approve</button>
            <button onClick={() => onStatusUpdate('Rejected', notes)}
              className="text-xs px-3 py-1.5 bg-lava-500/10 text-lava-700 rounded hover:bg-lava-500/20 transition-colors">Reject</button>
            <button onClick={() => onStatusUpdate('Escalated', notes)}
              className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">Escalate</button>
            <button onClick={() => onStatusUpdate('Duplicate', notes)}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">Duplicate</button>
          </div>
        </div>
      )}
      {item.reviewer_notes && item.status !== 'Pending' && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">Reviewer: {item.reviewer_notes}</p>
        </div>
      )}
    </div>
  )
}

function SignalCard({ signal, sourceName, sourceType, onReview }: {
  signal: SourceSignal; sourceName?: string; sourceType?: string
  onReview: (status: string, notes: string) => void
}) {
  const [notes, setNotes] = useState(signal.coordinator_notes ?? '')

  return (
    <div className="bg-white border border-purple-100 rounded-lg p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge label={signal.review_status} color={statusColors[signal.review_status] ?? 'bg-gray-100 text-gray-700'} />
          <Badge label={signal.signal_type} color="bg-purple-50 text-purple-700" />
          <Badge label={signal.confidence} color={confidenceColors[signal.confidence] ?? 'bg-gray-100'} />
          {signal.needs_review && <Badge label="needs review" color="bg-amber-100 text-amber-800" />}
          <span className="text-xs text-gray-400">{timeAgo(signal.created_at)}</span>
        </div>
      </div>

      {/* Source info */}
      <div className="text-xs text-gray-400 mb-1 flex flex-wrap gap-2">
        {sourceName && <span>Source: {sourceName}</span>}
        {sourceType && <span>({sourceType})</span>}
        {signal.raw_url && <a href={signal.raw_url} target="_blank" rel="noopener noreferrer" className="text-ocean-500 hover:text-ocean-700 underline">Raw link</a>}
      </div>

      {signal.title && <div className="text-sm font-medium mb-0.5">{signal.title}</div>}

      <div className="text-xs text-gray-500 mb-1">
        {signal.island && <span>{signal.island}</span>}
        {signal.area && <span> · {signal.area}</span>}
        {signal.neighborhood && <span> · {signal.neighborhood}</span>}
      </div>

      {/* Derived info */}
      {(signal.derived_resource_name || signal.derived_resource_type || signal.derived_status) && (
        <div className="text-xs text-gray-600 mb-1 flex flex-wrap gap-2">
          {signal.derived_resource_name && <span>Resource: {signal.derived_resource_name}</span>}
          {signal.derived_resource_type && <span>Type: {signal.derived_resource_type}</span>}
          {signal.derived_status && <Badge label={signal.derived_status} color={statusColors[signal.derived_status] ?? 'bg-gray-100 text-gray-700'} />}
        </div>
      )}

      {signal.raw_text && (
        <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded p-2 whitespace-pre-line max-h-24 overflow-y-auto">
          {signal.raw_text}
        </p>
      )}

      {signal.review_reason && (
        <p className="text-xs text-amber-700 mt-1">Review reason: {signal.review_reason}</p>
      )}

      {signal.last_observed_at && (
        <p className="text-xs text-gray-400 mt-0.5">Last observed: {new Date(signal.last_observed_at).toLocaleString()}</p>
      )}

      {signal.linked_help_hub_id && (
        <p className="text-xs text-ocean-600 mt-0.5">Linked to hub</p>
      )}

      {/* Review actions */}
      {signal.needs_review && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Review notes…"
            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-ocean-400" />
          <div className="flex gap-2">
            <button onClick={() => onReview('approved', notes)}
              className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors">Approve</button>
            <button onClick={() => onReview('rejected', notes)}
              className="text-xs px-3 py-1.5 bg-lava-500/10 text-lava-700 rounded hover:bg-lava-500/20 transition-colors">Reject</button>
            <button onClick={() => onReview('escalated', notes)}
              className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">Escalate</button>
          </div>
        </div>
      )}

      {!signal.needs_review && signal.coordinator_notes && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">Notes: {signal.coordinator_notes}</p>
        </div>
      )}
    </div>
  )
}
