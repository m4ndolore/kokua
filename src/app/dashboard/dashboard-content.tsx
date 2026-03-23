'use client'

import { useState, useTransition, useRef } from 'react'
import {
  updateStatus, updateCoordinatorNotes,
  updateHubStatus, updateHubVisibility,
  updateSummaryVisibility,
  updateReviewItemStatus,
} from '@/lib/dashboard-actions'
import {
  ISLANDS, REQUEST_STATUSES, OFFER_STATUSES, VOLUNTEER_STATUSES,
  URGENCY_LEVELS, HUB_STATUSES, REVIEW_STATUSES, HUB_CATEGORIES,
  NEED_SUMMARY_CATEGORIES, NEED_SUMMARY_URGENCY,
} from '@/lib/types'
import type {
  HelpRequest, HelpOffer, Volunteer,
  HelpHub, PublicNeedSummary, ReviewQueueItem, DashboardUser, Role,
} from '@/lib/types'

// ============================================================
// Shared utilities
// ============================================================

type Tab = 'requests' | 'offers' | 'volunteers' | 'hubs' | 'summaries' | 'review'

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
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

const urgencyColors: Record<string, string> = {
  Urgent: 'bg-lava-500/15 text-lava-700',
  Soon: 'bg-amber-100 text-amber-800',
  Flexible: 'bg-green-100 text-green-800',
  High: 'bg-amber-100 text-amber-800',
  Normal: 'bg-ocean-50 text-ocean-700',
}

const statusColors: Record<string, string> = {
  New: 'bg-blue-100 text-blue-800',
  Reviewing: 'bg-yellow-100 text-yellow-800',
  Available: 'bg-green-100 text-green-800',
  Matched: 'bg-purple-100 text-purple-800',
  Assigned: 'bg-purple-100 text-purple-800',
  Completed: 'bg-gray-100 text-gray-600',
  Archived: 'bg-gray-50 text-gray-400',
  Active: 'bg-green-100 text-green-800',
  'On hold': 'bg-yellow-100 text-yellow-800',
  Inactive: 'bg-gray-100 text-gray-500',
  Open: 'bg-green-100 text-green-800',
  Limited: 'bg-amber-100 text-amber-800',
  Closed: 'bg-gray-100 text-gray-500',
  Unknown: 'bg-gray-50 text-gray-400',
  Pending: 'bg-blue-100 text-blue-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-lava-500/15 text-lava-700',
  Duplicate: 'bg-gray-100 text-gray-500',
}

function StatusSelect({
  current,
  options,
  onUpdate,
}: {
  current: string
  options: readonly string[]
  onUpdate: (val: string) => void
}) {
  const [pending, startTransition] = useTransition()
  return (
    <select
      value={current}
      disabled={pending}
      onChange={e => startTransition(() => onUpdate(e.target.value))}
      className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white disabled:opacity-50"
    >
      {options.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}

function NotesField({
  table,
  id,
  initial,
}: {
  table: 'help_requests' | 'help_offers' | 'volunteers' | 'help_hubs' | 'public_need_summaries'
  id: string
  initial: string | null
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
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          placeholder="Internal notes…"
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-ocean-400"
        />
        <button
          onClick={handleSave}
          className="text-xs px-2 py-1.5 bg-ocean-50 text-ocean-700 rounded hover:bg-ocean-100 transition-colors"
        >
          {saved ? '✓' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function VisibilityToggle({
  isVisible,
  onToggle,
}: {
  isVisible: boolean
  onToggle: (val: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => onToggle(!isVisible))}
      className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 ${
        isVisible
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {isVisible ? 'Public' : 'Hidden'}
    </button>
  )
}

// ============================================================
// Main dashboard
// ============================================================

export function DashboardContent({
  role,
  userName,
  requests: initialRequests,
  offers: initialOffers,
  volunteers: initialVolunteers,
  hubs: initialHubs,
  summaries: initialSummaries,
  reviewItems: initialReview,
  users,
}: {
  role: Role
  userName: string
  requests: HelpRequest[]
  offers: HelpOffer[]
  volunteers: Volunteer[]
  hubs: HelpHub[]
  summaries: PublicNeedSummary[]
  reviewItems: ReviewQueueItem[]
  users: DashboardUser[]
}) {
  const [tab, setTab] = useState<Tab>('requests')
  const [requests, setRequests] = useState(initialRequests)
  const [offers, setOffers] = useState(initialOffers)
  const [volunteers, setVolunteers] = useState(initialVolunteers)
  const [hubs, setHubs] = useState(initialHubs)
  const [summaries, setSummaries] = useState(initialSummaries)
  const [reviewItems, setReviewItems] = useState(initialReview)
  const [islandFilter, setIslandFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const isAdminRole = role === 'admin'

  const pendingReviewCount = reviewItems.filter(r => r.status === 'Pending').length
  const newRequestCount = requests.filter(r => r.status === 'New').length
  const urgentCount = requests.filter(r => r.urgency === 'Urgent' && r.status !== 'Completed' && r.status !== 'Archived').length

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'requests', label: 'Requests', count: requests.length },
    { key: 'offers', label: 'Offers', count: offers.length },
    { key: 'volunteers', label: 'Volunteers', count: volunteers.length },
    { key: 'hubs', label: 'Help Hubs', count: hubs.length },
    { key: 'summaries', label: 'Needs', count: summaries.length },
    { key: 'review', label: 'Review', count: pendingReviewCount || undefined },
  ]

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-ocean-900">Coordination Board</h1>
          <p className="text-xs text-gray-400">
            Signed in as {userName} ({role})
          </p>
        </div>
        <div className="text-xs text-right text-gray-500">
          {newRequestCount > 0 && <span className="block text-blue-700 font-medium">{newRequestCount} new requests</span>}
          {urgentCount > 0 && <span className="block text-lava-600 font-medium">{urgentCount} urgent</span>}
          {pendingReviewCount > 0 && <span className="block text-amber-700 font-medium">{pendingReviewCount} pending review</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-4 bg-white rounded-lg p-1 border border-ocean-100 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setStatusFilter('') }}
            className={`flex-shrink-0 text-xs font-medium rounded-md px-2.5 py-2 transition-colors ${
              tab === t.key ? 'bg-ocean-600 text-white' : 'text-gray-500 hover:text-ocean-800'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`ml-1 ${tab === t.key ? 'text-ocean-200' : 'text-gray-400'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={islandFilter}
          onChange={e => setIslandFilter(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white"
        >
          <option value="">All islands</option>
          {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        {tab === 'requests' && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white"
          >
            <option value="">All statuses</option>
            {REQUEST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {tab === 'offers' && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white"
          >
            <option value="">All statuses</option>
            {OFFER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {tab === 'volunteers' && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white"
          >
            <option value="">All statuses</option>
            {VOLUNTEER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {tab === 'hubs' && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white"
          >
            <option value="">All statuses</option>
            {HUB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {tab === 'review' && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white"
          >
            <option value="">All statuses</option>
            {REVIEW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
                  <StatusSelect
                    current={r.status}
                    options={REQUEST_STATUSES}
                    onUpdate={s => { setRequests(p => p.map(x => x.id === r.id ? { ...x, status: s } : x)); updateStatus('help_requests', r.id, s) }}
                  />
                </div>
                <div className="text-sm mb-1.5">
                  <span className="font-medium">{r.island}</span>
                  <span className="text-gray-400 mx-1">·</span>
                  <span className="text-gray-600">{r.neighborhood}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {r.need_types.map(t => <span key={t} className="bg-ocean-50 text-ocean-700 text-xs px-2 py-0.5 rounded">{t}</span>)}
                </div>
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
                  <StatusSelect
                    current={o.status}
                    options={OFFER_STATUSES}
                    onUpdate={s => { setOffers(p => p.map(x => x.id === o.id ? { ...x, status: s } : x)); updateStatus('help_offers', o.id, s) }}
                  />
                </div>
                <div className="text-sm mb-1.5">
                  <span className="font-medium">{o.island}</span>
                  <span className="text-gray-400 mx-1">·</span>
                  <span className="text-gray-600">{o.neighborhood}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {o.offer_types.map(t => <span key={t} className="bg-earth-50 text-earth-700 text-xs px-2 py-0.5 rounded">{t}</span>)}
                </div>
                {o.capacity && <p className="text-xs text-earth-600 mb-1">Capacity: {o.capacity}</p>}
                {o.note && <p className="text-sm text-gray-600 mb-2">{o.note}</p>}
                <div className="text-xs text-gray-500">
                  <span>{o.contact_method}: {o.contact_value}</span>
                </div>
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
                  <StatusSelect
                    current={v.status}
                    options={VOLUNTEER_STATUSES}
                    onUpdate={s => { setVolunteers(p => p.map(x => x.id === v.id ? { ...x, status: s } : x)); updateStatus('volunteers', v.id, s) }}
                  />
                </div>
                <div className="text-sm font-medium mb-1">{v.name}</div>
                <div className="text-xs text-gray-500 mb-1.5">
                  {v.island}{v.neighborhood ? ` · ${v.neighborhood}` : ''}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {v.skills.map(s => <span key={s} className="bg-ocean-50 text-ocean-700 text-xs px-2 py-0.5 rounded">{s}</span>)}
                </div>
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
            .map(h => (
              <div key={h.id} className="bg-white border border-ocean-100 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge label={h.status} color={statusColors[h.status] ?? 'bg-gray-100 text-gray-700'} />
                    <VisibilityToggle
                      isVisible={h.is_visible}
                      onToggle={val => { setHubs(p => p.map(x => x.id === h.id ? { ...x, is_visible: val } : x)); updateHubVisibility(h.id, val) }}
                    />
                    <span className="text-xs text-gray-400">{timeAgo(h.updated_at)}</span>
                  </div>
                  <StatusSelect
                    current={h.status}
                    options={HUB_STATUSES}
                    onUpdate={s => { setHubs(p => p.map(x => x.id === h.id ? { ...x, status: s } : x)); updateHubStatus(h.id, s) }}
                  />
                </div>
                <div className="text-sm font-medium mb-0.5">{h.name}</div>
                <div className="text-xs text-gray-500 mb-1">
                  {h.island} · {h.area}
                  <span className="mx-1">·</span>
                  <span className="text-ocean-600">{h.category}</span>
                </div>
                {h.address && <p className="text-xs text-gray-600 mb-0.5">{h.address}</p>}
                {h.hours && <p className="text-xs text-gray-500 mb-0.5">Hours: {h.hours}</p>}
                {h.notes && <p className="text-sm text-gray-600 mb-1">{h.notes}</p>}
                <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                  {h.public_phone && <span>Phone: {h.public_phone}</span>}
                  {h.public_email && <span>Email: {h.public_email}</span>}
                  {h.source_url && <span className="text-ocean-500">Source link</span>}
                </div>
                {h.last_verified_at && (
                  <p className="text-xs text-gray-400 mt-0.5">Verified: {new Date(h.last_verified_at).toLocaleDateString()}</p>
                )}
                <NotesField table="help_hubs" id={h.id} initial={h.coordinator_notes} />
              </div>
            ))}
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
                    <VisibilityToggle
                      isVisible={s.is_visible}
                      onToggle={val => { setSummaries(p => p.map(x => x.id === s.id ? { ...x, is_visible: val } : x)); updateSummaryVisibility(s.id, val) }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(s.updated_at)}</span>
                </div>
                <div className="text-xs text-gray-500 mb-0.5">
                  {s.island}{s.area ? ` · ${s.area}` : ''}
                </div>
                <div className="text-sm font-medium mb-0.5">{s.title}</div>
                <p className="text-sm text-gray-600">{s.description}</p>
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
            .map(r => (
              <ReviewCard
                key={r.id}
                item={r}
                onStatusUpdate={(status, notes) => {
                  setReviewItems(p => p.map(x => x.id === r.id ? { ...x, status, reviewer_notes: notes } : x))
                  updateReviewItemStatus(r.id, status, notes)
                }}
              />
            ))}
        </CardList>
      )}
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function CardList({ children, empty }: { children: React.ReactNode[]; empty: string }) {
  return (
    <div className="space-y-3">
      {children.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{empty}</p>
      ) : children}
    </div>
  )
}

function ReviewCard({
  item,
  onStatusUpdate,
}: {
  item: ReviewQueueItem
  onStatusUpdate: (status: string, notes: string) => void
}) {
  const [notes, setNotes] = useState(item.reviewer_notes ?? '')

  return (
    <div className="bg-white border border-amber-100 rounded-lg p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge label={item.status} color={statusColors[item.status] ?? 'bg-gray-100 text-gray-700'} />
          <span className="text-xs text-gray-400">{timeAgo(item.created_at)}</span>
        </div>
      </div>
      <div className="text-xs text-gray-500 mb-1">
        {item.submitted_island}{item.submitted_area ? ` · ${item.submitted_area}` : ''}
        {item.submitted_category && <span className="ml-1 text-ocean-600">· {item.submitted_category}</span>}
      </div>
      <p className="text-sm text-gray-800 mb-2 whitespace-pre-line">{item.submitted_info}</p>
      <div className="text-xs text-gray-500 flex flex-wrap gap-3 mb-2">
        {item.submitted_name && <span>From: {item.submitted_name}</span>}
        {item.submitted_contact && <span>Contact: {item.submitted_contact}</span>}
      </div>
      {item.status === 'Pending' && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Reviewer notes…"
            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-ocean-400"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onStatusUpdate('Approved', notes)}
              className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => onStatusUpdate('Rejected', notes)}
              className="text-xs px-3 py-1.5 bg-lava-500/10 text-lava-700 rounded hover:bg-lava-500/20 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => onStatusUpdate('Duplicate', notes)}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            >
              Duplicate
            </button>
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
