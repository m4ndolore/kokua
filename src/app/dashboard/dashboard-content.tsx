'use client'

import { useState, useTransition, useRef } from 'react'
import { updateRequestStatus, updateOfferStatus, updateCoordinatorNotes } from '@/lib/dashboard-actions'
import { ISLANDS, REQUEST_STATUSES, OFFER_STATUSES, URGENCY_LEVELS } from '@/lib/types'
import type { HelpRequest, HelpOffer } from '@/lib/types'

type Tab = 'requests' | 'offers'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function urgencyBadge(urgency: string) {
  const colors: Record<string, string> = {
    Urgent: 'bg-lava-500/15 text-lava-700',
    Soon: 'bg-amber-100 text-amber-800',
    Flexible: 'bg-green-100 text-green-800',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[urgency] ?? 'bg-gray-100 text-gray-700'}`}>
      {urgency}
    </span>
  )
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    New: 'bg-blue-100 text-blue-800',
    Reviewing: 'bg-yellow-100 text-yellow-800',
    Available: 'bg-green-100 text-green-800',
    Matched: 'bg-purple-100 text-purple-800',
    Assigned: 'bg-purple-100 text-purple-800',
    Completed: 'bg-gray-100 text-gray-600',
    Archived: 'bg-gray-50 text-gray-400',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}

function StatusSelect({
  current,
  options,
  onUpdate,
}: {
  current: string
  options: readonly string[]
  onUpdate: (status: string) => void
}) {
  const [pending, startTransition] = useTransition()
  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) => {
        const newStatus = e.target.value
        startTransition(() => onUpdate(newStatus))
      }}
      className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white disabled:opacity-50"
    >
      {options.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}

function CoordinatorNotes({
  table,
  id,
  initial,
}: {
  table: 'help_requests' | 'help_offers'
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
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-ocean-400 focus:border-ocean-400"
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

export function DashboardContent({
  requests: initialRequests,
  offers: initialOffers,
}: {
  requests: HelpRequest[]
  offers: HelpOffer[]
}) {
  const [tab, setTab] = useState<Tab>('requests')
  const [requests, setRequests] = useState(initialRequests)
  const [offers, setOffers] = useState(initialOffers)
  const [islandFilter, setIslandFilter] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filteredRequests = requests.filter(r => {
    if (islandFilter && r.island !== islandFilter) return false
    if (urgencyFilter && r.urgency !== urgencyFilter) return false
    if (statusFilter && r.status !== statusFilter) return false
    return true
  })

  const filteredOffers = offers.filter(o => {
    if (islandFilter && o.island !== islandFilter) return false
    if (statusFilter && o.status !== statusFilter) return false
    return true
  })

  const newRequestCount = requests.filter(r => r.status === 'New').length
  const urgentCount = requests.filter(r => r.urgency === 'Urgent' && r.status !== 'Completed' && r.status !== 'Archived').length

  function handleRequestStatusUpdate(id: string, status: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    updateRequestStatus(id, status)
  }

  function handleOfferStatusUpdate(id: string, status: string) {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    updateOfferStatus(id, status)
  }

  const activeStatuses = tab === 'requests' ? REQUEST_STATUSES : OFFER_STATUSES

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-ocean-900">Dashboard</h1>
        <div className="text-xs text-gray-500 text-right">
          {newRequestCount > 0 && (
            <span className="block text-blue-700 font-medium">{newRequestCount} new requests</span>
          )}
          {urgentCount > 0 && (
            <span className="block text-lava-600 font-medium">{urgentCount} urgent</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-lg p-1 border border-ocean-100">
        <button
          onClick={() => { setTab('requests'); setStatusFilter(''); setUrgencyFilter('') }}
          className={`flex-1 text-sm font-medium rounded-md px-3 py-2.5 transition-colors ${
            tab === 'requests' ? 'bg-ocean-600 text-white' : 'text-gray-600 hover:text-ocean-800'
          }`}
        >
          Requests ({requests.length})
        </button>
        <button
          onClick={() => { setTab('offers'); setStatusFilter(''); setUrgencyFilter('') }}
          className={`flex-1 text-sm font-medium rounded-md px-3 py-2.5 transition-colors ${
            tab === 'offers' ? 'bg-earth-600 text-white' : 'text-gray-600 hover:text-earth-700'
          }`}
        >
          Offers ({offers.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={islandFilter}
          onChange={e => setIslandFilter(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white"
        >
          <option value="">All islands</option>
          {ISLANDS.map(i => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        {tab === 'requests' && (
          <select
            value={urgencyFilter}
            onChange={e => setUrgencyFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white"
          >
            <option value="">All urgency</option>
            {URGENCY_LEVELS.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white"
        >
          <option value="">All statuses</option>
          {activeStatuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Request cards */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {filteredRequests.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No requests match your filters.</p>
          )}
          {filteredRequests.map(r => (
            <div key={r.id} className="bg-white border border-ocean-100 rounded-lg p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {urgencyBadge(r.urgency)}
                  {statusBadge(r.status)}
                  <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                </div>
                <StatusSelect
                  current={r.status}
                  options={REQUEST_STATUSES}
                  onUpdate={(s) => handleRequestStatusUpdate(r.id, s)}
                />
              </div>
              <div className="text-sm mb-1.5">
                <span className="font-medium">{r.island}</span>
                <span className="text-gray-400 mx-1">·</span>
                <span className="text-gray-600">{r.neighborhood}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {r.need_types.map(t => (
                  <span key={t} className="bg-ocean-50 text-ocean-700 text-xs px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
              {r.note && (
                <p className="text-sm text-gray-600 mb-2">{r.note}</p>
              )}
              <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                <span>{r.contact_method}: {r.contact_value}</span>
                {r.alt_contact && <span>Alt: {r.alt_contact}</span>}
                {r.can_be_contacted && <span className="text-ocean-600 font-medium">Can contact</span>}
              </div>
              <CoordinatorNotes table="help_requests" id={r.id} initial={r.coordinator_notes} />
            </div>
          ))}
        </div>
      )}

      {/* Offer cards */}
      {tab === 'offers' && (
        <div className="space-y-3">
          {filteredOffers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No offers match your filters.</p>
          )}
          {filteredOffers.map(o => (
            <div key={o.id} className="bg-white border border-earth-100 rounded-lg p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {statusBadge(o.status)}
                  <span className="text-xs text-earth-600 font-medium">{o.availability}</span>
                  <span className="text-xs text-gray-400">{timeAgo(o.created_at)}</span>
                </div>
                <StatusSelect
                  current={o.status}
                  options={OFFER_STATUSES}
                  onUpdate={(s) => handleOfferStatusUpdate(o.id, s)}
                />
              </div>
              <div className="text-sm mb-1.5">
                <span className="font-medium">{o.island}</span>
                <span className="text-gray-400 mx-1">·</span>
                <span className="text-gray-600">{o.neighborhood}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {o.offer_types.map(t => (
                  <span key={t} className="bg-earth-50 text-earth-700 text-xs px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
              {o.capacity && (
                <p className="text-xs text-earth-600 mb-1">Capacity: {o.capacity}</p>
              )}
              {o.note && (
                <p className="text-sm text-gray-600 mb-2">{o.note}</p>
              )}
              <div className="text-xs text-gray-500">
                <span>{o.contact_method}: {o.contact_value}</span>
              </div>
              <CoordinatorNotes table="help_offers" id={o.id} initial={o.coordinator_notes} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
