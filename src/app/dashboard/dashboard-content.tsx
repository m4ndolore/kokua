'use client'

import { useState, useTransition, useRef } from 'react'
import {
  updateStatus, updateCoordinatorNotes,
  updateHubStatus, updateHubVisibility,
  updateSummaryVisibility,
  updateReviewItemStatus,
  promoteToHub, promoteToSummary,
  updateSignalReview,
  updateSourceActive,
  approveDonation, hideDonation, updateDonationFlags,
  bulkUpdateHubVisibility, bulkApproveDonations, bulkHideDonations, bulkUpdateReviewStatus,
  logoutAction,
  createGitHubIssue,
  approveAndCreateGitHubIssue,
  createDashboardUser,
  toggleUserActive,
} from '@/lib/dashboard-actions'
import {
  ISLANDS, REQUEST_STATUSES, OFFER_STATUSES, VOLUNTEER_STATUSES,
  URGENCY_LEVELS, HUB_STATUSES, REVIEW_STATUSES, VISIBILITY_STATUSES,
  SIGNAL_REVIEW_STATUSES, CONFIDENCE_LEVELS, SIGNAL_TYPES, DONATION_TYPES, GITHUB_SAFE_CATEGORIES,
} from '@/lib/types'
import type {
  HelpRequest, HelpOffer, Volunteer,
  HelpHub, PublicNeedSummary, ReviewQueueItem,
  SourceRegistry, SourceSignal, DashboardUser, DonationLink, Role,
} from '@/lib/types'

// ============================================================
// Shared utilities
// ============================================================

type Tab = 'requests' | 'offers' | 'volunteers' | 'hubs' | 'summaries' | 'review' | 'signals' | 'sources' | 'donations' | 'users'

const WORKFLOW_CONFIG: Record<Tab, {
  family: string
  title: string
  description: string
  accent: string
  panel: string
  chip: string
}> = {
  requests: {
    family: 'Coordination',
    title: 'Incoming help requests',
    description: 'Triage community requests, move them into active handling, and keep coordinator notes close to the record.',
    accent: 'text-ocean-700',
    panel: 'border-ocean-100 bg-ocean-50/40',
    chip: 'bg-ocean-100 text-ocean-800',
  },
  offers: {
    family: 'Coordination',
    title: 'Incoming offers',
    description: 'Track offered help, assign viable offers quickly, and archive what has already been used or exhausted.',
    accent: 'text-earth-700',
    panel: 'border-earth-100 bg-earth-50/40',
    chip: 'bg-earth-100 text-earth-800',
  },
  volunteers: {
    family: 'Coordination',
    title: 'Volunteer coordination',
    description: 'Keep volunteer records actionable: who is ready, who is on hold, and who should be removed from active rotation.',
    accent: 'text-ocean-700',
    panel: 'border-ocean-100 bg-ocean-50/40',
    chip: 'bg-ocean-100 text-ocean-800',
  },
  hubs: {
    family: 'Public Curation',
    title: 'Public help hubs',
    description: 'Curate what should be public, what needs review, and what stays internal while keeping source provenance visible.',
    accent: 'text-ocean-700',
    panel: 'border-ocean-100 bg-ocean-50/40',
    chip: 'bg-ocean-100 text-ocean-800',
  },
  summaries: {
    family: 'Public Curation',
    title: 'Public need summaries',
    description: 'Maintain short, public-facing summaries that point people to the latest source rather than becoming the source themselves.',
    accent: 'text-ocean-700',
    panel: 'border-ocean-100 bg-ocean-50/40',
    chip: 'bg-ocean-100 text-ocean-800',
  },
  review: {
    family: 'Intake Triage',
    title: 'Review queue',
    description: 'Handle incoming reports, resource leads, and GitHub-safe feedback with fast triage and clear next actions.',
    accent: 'text-amber-700',
    panel: 'border-amber-100 bg-amber-50/50',
    chip: 'bg-amber-100 text-amber-800',
  },
  signals: {
    family: 'Intake Triage',
    title: 'Source signals',
    description: 'Review incoming source signals, decide whether they are usable, and escalate uncertain items before they leak into public data.',
    accent: 'text-purple-700',
    panel: 'border-purple-100 bg-purple-50/40',
    chip: 'bg-purple-100 text-purple-800',
  },
  sources: {
    family: 'System',
    title: 'Source registry',
    description: 'Manage the upstream source list, trust level, and source monitoring posture.',
    accent: 'text-gray-700',
    panel: 'border-gray-200 bg-gray-50',
    chip: 'bg-gray-100 text-gray-700',
  },
  donations: {
    family: 'Public Curation',
    title: 'Donation listings',
    description: 'Review donation records for visibility, provenance, and trust signals before they appear on public pages.',
    accent: 'text-earth-700',
    panel: 'border-earth-100 bg-earth-50/40',
    chip: 'bg-earth-100 text-earth-800',
  },
  users: {
    family: 'System',
    title: 'Dashboard users',
    description: 'Manage operator access and keep coordinator accounts clean and active.',
    accent: 'text-gray-700',
    panel: 'border-gray-200 bg-gray-50',
    chip: 'bg-gray-100 text-gray-700',
  },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function isStale(lastVerifiedAt: string | null): boolean {
  if (!lastVerifiedAt) return true
  const ageMs = Date.now() - new Date(lastVerifiedAt).getTime()
  return ageMs > 72 * 60 * 60 * 1000
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>
}

function ExternalLink({
  href,
  label,
  tone = 'ocean',
}: {
  href: string
  label: string
  tone?: 'ocean' | 'earth'
}) {
  const classes = tone === 'earth'
    ? 'border-earth-200 text-earth-700 hover:bg-earth-50'
    : 'border-ocean-200 text-ocean-700 hover:bg-ocean-50'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${classes}`}
    >
      {label} ↗
    </a>
  )
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
      <label className="text-xs text-gray-400 block mb-1">
        {table === 'help_hubs' || table === 'public_need_summaries' ? 'Internal notes / operator guidance' : 'Coordinator notes'}
      </label>
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

function ActionButton({
  label,
  active = false,
  tone = 'neutral',
  onClick,
}: {
  label: string
  active?: boolean
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
  onClick: () => void
}) {
  const styles = {
    success: active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-white text-green-800 border-green-200 hover:bg-green-50',
    warning: active ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50',
    danger: active ? 'bg-lava-500/10 text-lava-700 border-lava-200' : 'bg-white text-lava-700 border-lava-200 hover:bg-lava-50',
    neutral: active ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
  } as const

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded border transition-colors ${styles[tone]}`}
    >
      {label}
    </button>
  )
}

function VisibilityActionRow({
  current,
  onUpdate,
}: {
  current: string
  onUpdate: (val: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <ActionButton label="Make public" tone="success" active={current === 'public'} onClick={() => onUpdate('public')} />
      <ActionButton label="Move to review" tone="warning" active={current === 'review'} onClick={() => onUpdate('review')} />
      <ActionButton label="Keep internal" tone="neutral" active={current === 'internal'} onClick={() => onUpdate('internal')} />
    </div>
  )
}

function StatusActionRow({
  current,
  actions,
  onUpdate,
}: {
  current: string
  actions: Array<{ label: string; value: string; tone?: 'success' | 'warning' | 'danger' | 'neutral' }>
  onUpdate: (val: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map(action => (
        <ActionButton
          key={action.value}
          label={action.label}
          tone={action.tone ?? 'neutral'}
          active={current === action.value}
          onClick={() => onUpdate(action.value)}
        />
      ))}
    </div>
  )
}

function SelectionToolbar({
  visibleCount,
  selectedCount,
  onSelectVisible,
  onClear,
}: {
  visibleCount: number
  selectedCount: number
  onSelectVisible: () => void
  onClear: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <button
        type="button"
        onClick={onSelectVisible}
        className="text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded hover:bg-gray-50 transition-colors"
      >
        Select visible ({visibleCount})
      </button>
      {selectedCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded hover:bg-gray-50 transition-colors"
        >
          Clear selection
        </button>
      )}
    </div>
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

function WorkflowHeader({
  family,
  title,
  description,
  accent,
  panel,
  chip,
}: {
  family: string
  title: string
  description: string
  accent: string
  panel: string
  chip: string
}) {
  return (
    <div className={`mb-4 rounded-xl border p-4 ${panel}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${chip}`}>
            {family}
          </div>
          <h2 className={`mt-2 text-lg font-semibold ${accent}`}>{title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  )
}

function CardFrame({
  children,
  borderClass = 'border-ocean-100',
}: {
  children: React.ReactNode
  borderClass?: string
}) {
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] ${borderClass}`}>
      {children}
    </div>
  )
}

function summarizeReviewText(item: ReviewQueueItem) {
  return (item.submitted_info || item.feedback_message || '').trim()
}

function inferTitleFromReviewItem(item: ReviewQueueItem) {
  const direct = item.submitted_name?.trim()
  if (direct) return direct
  const text = summarizeReviewText(item)
  const firstLine = text.split('\n')[0]?.trim() || ''
  if (!firstLine) return 'Community resource lead'
  return firstLine.slice(0, 80)
}

function inferHubCategory(item: ReviewQueueItem) {
  const text = `${item.submitted_category || ''} ${summarizeReviewText(item)}`.toLowerCase()
  if (text.includes('shelter')) return 'Shelter'
  if (text.includes('food')) return 'Food distribution'
  if (text.includes('water')) return 'Water distribution'
  if (text.includes('supply')) return 'Supply distribution'
  if (text.includes('volunteer')) return 'Volunteer hub'
  if (text.includes('donation')) return 'Donation drop-off'
  if (text.includes('government')) return 'Government office'
  return 'Other'
}

function inferSummaryCategory(item: ReviewQueueItem) {
  const text = `${item.submitted_category || ''} ${summarizeReviewText(item)}`.toLowerCase()
  if (text.includes('volunteer')) return 'Volunteers needed'
  if (text.includes('transport')) return 'Transportation needed'
  if (text.includes('donation')) return 'Donations needed'
  if (text.includes('food') || text.includes('water') || text.includes('supply')) return 'Supplies needed'
  return 'General'
}

function canPromoteReviewItem(item: ReviewQueueItem) {
  return !!item.submitted_island && !item.promoted_hub_id && !item.promoted_summary_id
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 4)
}

function scoreCandidate(recordTitle: string, reviewText: string) {
  const titleTokens = tokenize(recordTitle)
  if (titleTokens.length === 0) return 0
  const haystack = reviewText.toLowerCase()
  return titleTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0)
}

function findRelatedHubs(item: ReviewQueueItem, hubs: HelpHub[]) {
  const reviewText = `${item.feedback_message || ''} ${item.feedback_page_url || ''}`
  return hubs
    .map(hub => ({ hub, score: scoreCandidate(hub.name, reviewText) }))
    .filter(entry => entry.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(entry => entry.hub)
}

function findRelatedSummaries(item: ReviewQueueItem, summaries: PublicNeedSummary[]) {
  const reviewText = `${item.feedback_message || ''} ${item.feedback_page_url || ''}`
  return summaries
    .map(summary => ({ summary, score: scoreCandidate(summary.title, reviewText) }))
    .filter(entry => entry.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(entry => entry.summary)
}

function findRelatedDonations(item: ReviewQueueItem, donations: DonationLink[]) {
  const reviewText = `${item.feedback_message || ''} ${item.feedback_page_url || ''}`
  return donations
    .map(donation => ({ donation, score: scoreCandidate(donation.title, reviewText) }))
    .filter(entry => entry.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(entry => entry.donation)
}

// ============================================================
// Main dashboard
// ============================================================

export function DashboardContent({
  role, userName,
  systemStatus,
  requests: initialRequests, offers: initialOffers, volunteers: initialVolunteers,
  hubs: initialHubs, summaries: initialSummaries, reviewItems: initialReview,
  signals: initialSignals, sources: initialSources, users,
  donations: initialDonations,
}: {
  role: Role; userName: string
  systemStatus: {
    hasSharedPassword: boolean
    hasGithubToken: boolean
    githubRepo: string
    allowBootstrap: boolean
    nodeEnv: string
  }
  requests: HelpRequest[]; offers: HelpOffer[]; volunteers: Volunteer[]
  hubs: HelpHub[]; summaries: PublicNeedSummary[]; reviewItems: ReviewQueueItem[]
  signals: SourceSignal[]; sources: SourceRegistry[]; users: DashboardUser[]
  donations: DonationLink[]
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
  const [dashboardUsers, setDashboardUsers] = useState(users)
  const [donations, setDonations] = useState(initialDonations)
  const [islandFilter, setIslandFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const isAdminRole = role === 'admin'

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll(ids: string[]) {
    setSelected(new Set(ids))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  const pendingReviewCount = reviewItems.filter(r => r.status === 'Pending').length
  const pendingSignalCount = signals.filter(s => s.needs_review).length
  const newRequestCount = requests.filter(r => r.status === 'New').length
  const urgentCount = requests.filter(r => r.urgency === 'Urgent' && r.status !== 'Completed' && r.status !== 'Archived').length
  const needsReviewDonations = donations.filter(d => d.needs_review).length
  const staleHubCount = hubs.filter(h => h.visibility_status === 'public' && isStale(h.last_verified_at)).length

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
    { key: 'donations', label: 'Donations', count: donations.length },
    { key: 'sources', label: 'Sources', count: sources.length, adminOnly: true },
    { key: 'users', label: 'Users', count: dashboardUsers.length, adminOnly: true },
  ]

  const visibleTabs = tabs.filter(t => !t.adminOnly || isAdminRole)
  const filteredRequests = requests.filter(r => (!islandFilter || r.island === islandFilter) && (!statusFilter || r.status === statusFilter))
  const filteredOffers = offers.filter(o => (!islandFilter || o.island === islandFilter) && (!statusFilter || o.status === statusFilter))
  const filteredVolunteers = volunteers.filter(v => (!islandFilter || v.island === islandFilter) && (!statusFilter || v.status === statusFilter))
  const filteredHubs = hubs.filter(h => (!islandFilter || h.island === islandFilter) && (!statusFilter || (statusFilter === 'stale' ? isStale(h.last_verified_at) : h.status === statusFilter)))
  const filteredSummaries = summaries.filter(s => !islandFilter || s.island === islandFilter)
  const filteredReviewItems = reviewItems.filter(r => (!islandFilter || r.submitted_island === islandFilter) && (!statusFilter || r.status === statusFilter))
  const filteredSignals = signals.filter(s => (!islandFilter || s.island === islandFilter) && (!statusFilter || s.review_status === statusFilter))
  const filteredDonations = donations.filter(d => (!islandFilter || d.island === islandFilter) && (!statusFilter || d.donation_type === statusFilter))
  const workflow = WORKFLOW_CONFIG[tab]

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-ocean-900">Coordination Board</h1>
          <p className="text-xs text-gray-400">Signed in as {userName} ({role})</p>
        </div>
        <div className="flex items-center gap-3">
        <form action={logoutAction}>
          <button type="submit" className="text-xs text-gray-400 hover:text-lava-600 transition-colors">
            Sign out
          </button>
        </form>
        <div className="text-xs text-right text-gray-500">
          {newRequestCount > 0 && <span className="block text-blue-700 font-medium">{newRequestCount} new requests</span>}
          {urgentCount > 0 && <span className="block text-lava-600 font-medium">{urgentCount} urgent</span>}
          {pendingReviewCount > 0 && <span className="block text-amber-700 font-medium">{pendingReviewCount} pending review</span>}
          {pendingSignalCount > 0 && <span className="block text-purple-700 font-medium">{pendingSignalCount} signals need review</span>}
          {staleHubCount > 0 && <span className="block text-amber-600 font-medium">{staleHubCount} stale hubs</span>}
        </div>
        </div>
      </div>

      <div className="mb-4 bg-white border border-ocean-100 rounded-lg p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-medium text-gray-700">System status</div>
          <div className="text-[11px] text-gray-400">env: {systemStatus.nodeEnv}</div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge
            label={systemStatus.hasSharedPassword ? 'Shared password: OK' : 'Shared password: missing'}
            color={systemStatus.hasSharedPassword ? 'bg-green-100 text-green-800' : 'bg-lava-500/10 text-lava-700'}
          />
          <Badge
            label={systemStatus.hasGithubToken ? 'GitHub bridge: OK' : 'GitHub bridge: not configured'}
            color={systemStatus.hasGithubToken ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}
          />
          <Badge
            label={`Repo: ${systemStatus.githubRepo}`}
            color="bg-gray-100 text-gray-700"
          />
          {systemStatus.allowBootstrap && (
            <Badge
              label="Bootstrap login enabled"
              color="bg-amber-100 text-amber-800"
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-4 bg-white rounded-lg p-1 border border-ocean-100 overflow-x-auto">
        {visibleTabs.map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); setStatusFilter(''); clearSelection() }}
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
        {tab === 'hubs' && (
          <button
            onClick={() => setStatusFilter(statusFilter === 'stale' ? '' : 'stale')}
            className={`text-xs px-2 py-2 rounded-lg border transition-colors ${
              statusFilter === 'stale' ? 'bg-amber-100 border-amber-300 text-amber-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Stale only
          </button>
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
        {tab === 'donations' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white">
            <option value="">All types</option>
            {DONATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      <WorkflowHeader
        family={workflow.family}
        title={workflow.title}
        description={workflow.description}
        accent={workflow.accent}
        panel={workflow.panel}
        chip={workflow.chip}
      />

      {/* ============ USERS (admin only) ============ */}
      {tab === 'users' && isAdminRole && (
        <div className="space-y-3">
          <div className="bg-white border border-ocean-100 rounded-lg p-4">
            <div className="text-sm font-medium mb-2">Add a dashboard user</div>
            <form action={async (formData: FormData) => {
              const created = await createDashboardUser(formData)
              if (created) {
                setDashboardUsers(p => [created as unknown as DashboardUser, ...p])
              }
            }} className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input name="email" type="email" required placeholder="email@domain"
                className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white" />
              <input name="name" type="text" required placeholder="Name"
                className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white" />
              <select name="role" required defaultValue="coordinator"
                className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white">
                <option value="coordinator">coordinator</option>
                <option value="admin">admin</option>
              </select>
              <div className="md:col-span-3">
                <button type="submit"
                  className="text-xs px-3 py-2 bg-ocean-600 text-white rounded hover:bg-ocean-700 transition-colors">
                  Create user
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-400 mt-2">
              Users sign in at <span className="font-mono">/dashboard/login</span> with their email and the shared password.
            </p>
          </div>

          <CardList empty="No dashboard users.">
            {dashboardUsers.map(u => (
              <CardFrame key={u.id} borderClass="border-gray-200">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                    <div className="text-xs text-gray-400">Role: {u.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ActiveToggle isActive={u.is_active}
                      onToggle={val => {
                        setDashboardUsers(p => p.map(x => x.id === u.id ? { ...x, is_active: val } : x))
                        toggleUserActive(u.id, val)
                      }} />
                  </div>
                </div>
              </CardFrame>
            ))}
          </CardList>
        </div>
      )}

      {/* ============ REQUESTS ============ */}
      {tab === 'requests' && (
        <CardList empty="No requests match your filters.">
          <SelectionToolbar
            visibleCount={filteredRequests.length}
            selectedCount={selected.size}
            onSelectVisible={() => selectAll(filteredRequests.map(r => r.id))}
            onClear={clearSelection}
          />
          <BulkActionBar count={selected.size}>
            <button onClick={async () => { const ids = Array.from(selected); await Promise.all(ids.map(id => updateStatus('help_requests', id, 'Reviewing'))); setRequests(p => p.map(r => selected.has(r.id) ? { ...r, status: 'Reviewing' } : r)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Mark Reviewing</button>
            <button onClick={async () => { const ids = Array.from(selected); await Promise.all(ids.map(id => updateStatus('help_requests', id, 'Matched'))); setRequests(p => p.map(r => selected.has(r.id) ? { ...r, status: 'Matched' } : r)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Mark Matched</button>
            <button onClick={async () => { const ids = Array.from(selected); await Promise.all(ids.map(id => updateStatus('help_requests', id, 'Completed'))); setRequests(p => p.map(r => selected.has(r.id) ? { ...r, status: 'Completed' } : r)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Mark Completed</button>
            <button onClick={() => clearSelection()}
              className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors">Clear</button>
          </BulkActionBar>
          {filteredRequests.map(r => (
              <CardFrame key={r.id} borderClass="border-ocean-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded border-gray-300" />
                    <Badge label={r.urgency} color={urgencyColors[r.urgency] ?? 'bg-gray-100 text-gray-700'} />
                    <Badge label={r.status} color={statusColors[r.status] ?? 'bg-gray-100 text-gray-700'} />
                    <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                  </div>
                </div>
                <div className="text-sm mb-1.5"><span className="font-medium">{r.island}</span><span className="text-gray-400 mx-1">·</span><span className="text-gray-600">{r.neighborhood}</span></div>
                <div className="flex flex-wrap gap-1 mb-2">{r.need_types.map(t => <span key={t} className="bg-ocean-50 text-ocean-700 text-xs px-2 py-0.5 rounded">{t}</span>)}</div>
                {r.note && <p className="text-sm text-gray-600 mb-2">{r.note}</p>}
                <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                  <span>{r.contact_method}: {r.contact_value}</span>
                  {r.alt_contact && <span>Alt: {r.alt_contact}</span>}
                  {r.can_be_contacted && <span className="text-ocean-600 font-medium">Can contact</span>}
                </div>
                <StatusActionRow
                  current={r.status}
                  actions={[
                    { label: 'New', value: 'New' },
                    { label: 'Reviewing', value: 'Reviewing', tone: 'warning' },
                    { label: 'Matched', value: 'Matched', tone: 'success' },
                    { label: 'Completed', value: 'Completed', tone: 'neutral' },
                    { label: 'Archive', value: 'Archived', tone: 'danger' },
                  ]}
                  onUpdate={s => { setRequests(p => p.map(x => x.id === r.id ? { ...x, status: s } : x)); updateStatus('help_requests', r.id, s) }}
                />
                <NotesField table="help_requests" id={r.id} initial={r.coordinator_notes} />
              </CardFrame>
            ))}
        </CardList>
      )}

      {/* ============ OFFERS ============ */}
      {tab === 'offers' && (
        <CardList empty="No offers match your filters.">
          <SelectionToolbar
            visibleCount={filteredOffers.length}
            selectedCount={selected.size}
            onSelectVisible={() => selectAll(filteredOffers.map(o => o.id))}
            onClear={clearSelection}
          />
          <BulkActionBar count={selected.size}>
            <button onClick={async () => { const ids = Array.from(selected); await Promise.all(ids.map(id => updateStatus('help_offers', id, 'Available'))); setOffers(p => p.map(o => selected.has(o.id) ? { ...o, status: 'Available' } : o)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Mark Available</button>
            <button onClick={async () => { const ids = Array.from(selected); await Promise.all(ids.map(id => updateStatus('help_offers', id, 'Assigned'))); setOffers(p => p.map(o => selected.has(o.id) ? { ...o, status: 'Assigned' } : o)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Mark Assigned</button>
            <button onClick={async () => { const ids = Array.from(selected); await Promise.all(ids.map(id => updateStatus('help_offers', id, 'Completed'))); setOffers(p => p.map(o => selected.has(o.id) ? { ...o, status: 'Completed' } : o)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Mark Completed</button>
            <button onClick={() => clearSelection()}
              className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors">Clear</button>
          </BulkActionBar>
          {filteredOffers.map(o => (
              <CardFrame key={o.id} borderClass="border-earth-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} className="rounded border-gray-300" />
                    <Badge label={o.status} color={statusColors[o.status] ?? 'bg-gray-100 text-gray-700'} />
                    <span className="text-xs text-earth-600 font-medium">{o.availability}</span>
                    <span className="text-xs text-gray-400">{timeAgo(o.created_at)}</span>
                  </div>
                </div>
                <div className="text-sm mb-1.5"><span className="font-medium">{o.island}</span><span className="text-gray-400 mx-1">·</span><span className="text-gray-600">{o.neighborhood}</span></div>
                <div className="flex flex-wrap gap-1 mb-2">{o.offer_types.map(t => <span key={t} className="bg-earth-50 text-earth-700 text-xs px-2 py-0.5 rounded">{t}</span>)}</div>
                {o.capacity && <p className="text-xs text-earth-600 mb-1">Capacity: {o.capacity}</p>}
                {o.note && <p className="text-sm text-gray-600 mb-2">{o.note}</p>}
                <div className="text-xs text-gray-500"><span>{o.contact_method}: {o.contact_value}</span></div>
                <StatusActionRow
                  current={o.status}
                  actions={[
                    { label: 'New', value: 'New' },
                    { label: 'Available', value: 'Available', tone: 'success' },
                    { label: 'Assigned', value: 'Assigned', tone: 'warning' },
                    { label: 'Completed', value: 'Completed', tone: 'neutral' },
                    { label: 'Archive', value: 'Archived', tone: 'danger' },
                  ]}
                  onUpdate={s => { setOffers(p => p.map(x => x.id === o.id ? { ...x, status: s } : x)); updateStatus('help_offers', o.id, s) }}
                />
                <NotesField table="help_offers" id={o.id} initial={o.coordinator_notes} />
              </CardFrame>
            ))}
        </CardList>
      )}

      {/* ============ VOLUNTEERS ============ */}
      {tab === 'volunteers' && (
        <CardList empty="No volunteers match your filters.">
          <SelectionToolbar
            visibleCount={filteredVolunteers.length}
            selectedCount={selected.size}
            onSelectVisible={() => selectAll(filteredVolunteers.map(v => v.id))}
            onClear={clearSelection}
          />
          <BulkActionBar count={selected.size}>
            <button onClick={async () => { const ids = Array.from(selected); await Promise.all(ids.map(id => updateStatus('volunteers', id, 'Active'))); setVolunteers(p => p.map(v => selected.has(v.id) ? { ...v, status: 'Active' } : v)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Mark Active</button>
            <button onClick={async () => { const ids = Array.from(selected); await Promise.all(ids.map(id => updateStatus('volunteers', id, 'On hold'))); setVolunteers(p => p.map(v => selected.has(v.id) ? { ...v, status: 'On hold' } : v)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Place On Hold</button>
            <button onClick={async () => { const ids = Array.from(selected); await Promise.all(ids.map(id => updateStatus('volunteers', id, 'Inactive'))); setVolunteers(p => p.map(v => selected.has(v.id) ? { ...v, status: 'Inactive' } : v)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Mark Inactive</button>
            <button onClick={() => clearSelection()}
              className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors">Clear</button>
          </BulkActionBar>
          {filteredVolunteers.map(v => (
              <CardFrame key={v.id} borderClass="border-ocean-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleSelect(v.id)} className="rounded border-gray-300" />
                    <Badge label={v.status} color={statusColors[v.status] ?? 'bg-gray-100 text-gray-700'} />
                    <span className="text-xs text-ocean-600 font-medium">{v.availability}</span>
                    <span className="text-xs text-gray-400">{timeAgo(v.created_at)}</span>
                  </div>
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
                <StatusActionRow
                  current={v.status}
                  actions={[
                    { label: 'New', value: 'New' },
                    { label: 'Active', value: 'Active', tone: 'success' },
                    { label: 'On hold', value: 'On hold', tone: 'warning' },
                    { label: 'Inactive', value: 'Inactive', tone: 'danger' },
                  ]}
                  onUpdate={s => { setVolunteers(p => p.map(x => x.id === v.id ? { ...x, status: s } : x)); updateStatus('volunteers', v.id, s) }}
                />
                <NotesField table="volunteers" id={v.id} initial={v.coordinator_notes} />
              </CardFrame>
            ))}
        </CardList>
      )}

      {/* ============ HELP HUBS ============ */}
      {tab === 'hubs' && (
        <CardList empty="No help hubs match your filters.">
          <SelectionToolbar
            visibleCount={filteredHubs.length}
            selectedCount={selected.size}
            onSelectVisible={() => selectAll(filteredHubs.map(h => h.id))}
            onClear={clearSelection}
          />
          <BulkActionBar count={selected.size}>
            <button onClick={async () => { await bulkUpdateHubVisibility(Array.from(selected), 'public'); setHubs(p => p.map(h => selected.has(h.id) ? { ...h, visibility_status: 'public' } : h)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Make Public</button>
            <button onClick={async () => { await bulkUpdateHubVisibility(Array.from(selected), 'internal'); setHubs(p => p.map(h => selected.has(h.id) ? { ...h, visibility_status: 'internal' } : h)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Make Internal</button>
            <button onClick={() => clearSelection()}
              className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors">Clear</button>
          </BulkActionBar>
          {filteredHubs.map(h => {
              const src = h.source_registry_id ? sourceMap.get(h.source_registry_id) : null
              return (
                <CardFrame key={h.id} borderClass="border-ocean-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <input type="checkbox" checked={selected.has(h.id)} onChange={() => toggleSelect(h.id)} className="rounded border-gray-300" />
                      <Badge label={h.status} color={statusColors[h.status] ?? 'bg-gray-100 text-gray-700'} />
                      <Badge label={h.confidence} color={confidenceColors[h.confidence] ?? 'bg-gray-100'} />
                      {isStale(h.last_verified_at) && <Badge label="stale" color="bg-amber-100 text-amber-700" />}
                      <span className="text-xs text-gray-400">{timeAgo(h.updated_at)}</span>
                    </div>
                    <StatusSelect current={h.status} options={HUB_STATUSES}
                      onUpdate={s => { setHubs(p => p.map(x => x.id === h.id ? { ...x, status: s } : x)); updateHubStatus(h.id, s) }} />
                  </div>
                  <div className="text-sm font-medium mb-0.5">{h.name}</div>
                  <div className="text-xs text-gray-500 mb-1">
                    {h.island} · {h.area} · <span className="text-ocean-600">{h.category}</span>
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Public description</div>
                  {h.address && <p className="text-xs text-gray-600 mb-0.5">{h.address}</p>}
                  {h.hours && <p className="text-xs text-gray-500 mb-0.5">Hours: {h.hours}</p>}
                  {h.notes && <p className="text-sm text-gray-600 mb-1">{h.notes}</p>}
                  <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                    {h.public_phone && <span>Phone: {h.public_phone}</span>}
                    {h.public_email && <span>Email: {h.public_email}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {h.source_url && <ExternalLink href={h.source_url} label="Open source" />}
                  </div>
                  <div className="text-xs text-gray-400 flex flex-wrap gap-2 mt-1">
                    {(h.source_name || src) && <span>Source: {h.source_name || src?.name}</span>}
                    {h.source_type && <span>({h.source_type})</span>}
                    {h.last_verified_at && <span>Verified: {new Date(h.last_verified_at).toLocaleDateString()}</span>}
                    <span>✓{h.verification_count} ⚠{h.stale_flag_count} ♻{h.active_confirm_count}</span>
                  </div>
                  <VisibilityActionRow
                    current={h.visibility_status}
                    onUpdate={v => {
                      setHubs(p => p.map(x => x.id === h.id ? { ...x, visibility_status: v } : x))
                      updateHubVisibility(h.id, v)
                    }}
                  />
                  <NotesField table="help_hubs" id={h.id} initial={h.coordinator_notes} />
                </CardFrame>
              )
            })}
        </CardList>
      )}

      {/* ============ NEED SUMMARIES ============ */}
      {tab === 'summaries' && (
        <CardList empty="No need summaries yet.">
          <SelectionToolbar
            visibleCount={filteredSummaries.length}
            selectedCount={selected.size}
            onSelectVisible={() => selectAll(filteredSummaries.map(s => s.id))}
            onClear={clearSelection}
          />
          <BulkActionBar count={selected.size}>
            <button onClick={async () => {
              const ids = Array.from(selected)
              await Promise.all(ids.map(id => updateSummaryVisibility(id, 'public')))
              setSummaries(p => p.map(s => selected.has(s.id) ? { ...s, visibility_status: 'public' } : s))
              clearSelection()
            }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Make Public</button>
            <button onClick={async () => {
              const ids = Array.from(selected)
              await Promise.all(ids.map(id => updateSummaryVisibility(id, 'review')))
              setSummaries(p => p.map(s => selected.has(s.id) ? { ...s, visibility_status: 'review' } : s))
              clearSelection()
            }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Move to Review</button>
            <button onClick={() => clearSelection()}
              className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors">Clear</button>
          </BulkActionBar>
          {filteredSummaries.map(s => (
              <CardFrame key={s.id} borderClass="border-ocean-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} className="rounded border-gray-300" />
                    <Badge label={s.urgency} color={urgencyColors[s.urgency] ?? 'bg-gray-100 text-gray-700'} />
                    <Badge label={s.category} color="bg-ocean-50 text-ocean-700" />
                    <Badge label={s.confidence} color={confidenceColors[s.confidence] ?? 'bg-gray-100'} />
                    </div>
                  <span className="text-xs text-gray-400">{timeAgo(s.updated_at)}</span>
                </div>
                <div className="text-xs text-gray-500 mb-0.5">{s.island}{s.area ? ` · ${s.area}` : ''}</div>
                <div className="text-sm font-medium mb-0.5">{s.title}</div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Public description</div>
                <p className="text-sm text-gray-600">{s.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {s.source_url && <ExternalLink href={s.source_url} label="Open source" />}
                </div>
                {(s.source_name || s.source_url) && (
                  <div className="text-xs text-gray-400 mt-1">
                    {s.source_name && <span>Source: {s.source_name} </span>}
                    {s.source_type && <span>({s.source_type}) </span>}
                    {s.last_verified_at && <span>Verified: {new Date(s.last_verified_at).toLocaleDateString()}</span>}
                  </div>
                )}
                <VisibilityActionRow
                  current={s.visibility_status}
                  onUpdate={v => {
                    setSummaries(p => p.map(x => x.id === s.id ? { ...x, visibility_status: v } : x))
                    updateSummaryVisibility(s.id, v)
                  }}
                />
                <NotesField table="public_need_summaries" id={s.id} initial={s.coordinator_notes} />
              </CardFrame>
            ))}
        </CardList>
      )}

      {/* ============ REVIEW QUEUE ============ */}
      {tab === 'review' && (
        <CardList empty="No items in the review queue.">
          <SelectionToolbar
            visibleCount={filteredReviewItems.length}
            selectedCount={selected.size}
            onSelectVisible={() => selectAll(filteredReviewItems.map(r => r.id))}
            onClear={clearSelection}
          />
          <BulkActionBar count={selected.size}>
            <button onClick={async () => { await bulkUpdateReviewStatus(Array.from(selected), 'Approved'); setReviewItems(p => p.map(r => selected.has(r.id) ? { ...r, status: 'Approved' } : r)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Approve</button>
            <button onClick={async () => { await bulkUpdateReviewStatus(Array.from(selected), 'Acknowledged'); setReviewItems(p => p.map(r => selected.has(r.id) ? { ...r, status: 'Acknowledged' } : r)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Acknowledge</button>
            <button onClick={async () => { await bulkUpdateReviewStatus(Array.from(selected), 'Escalated'); setReviewItems(p => p.map(r => selected.has(r.id) ? { ...r, status: 'Escalated' } : r)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Escalate</button>
            <button onClick={() => clearSelection()}
              className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors">Clear</button>
          </BulkActionBar>
          {filteredReviewItems.map(r => {
              const src = r.source_registry_id ? sourceMap.get(r.source_registry_id) : null
              return <ReviewCard key={r.id} item={r} sourceName={src?.name}
                selected={selected.has(r.id)}
                onToggleSelected={() => toggleSelect(r.id)}
                relatedHubs={findRelatedHubs(r, hubs)}
                relatedSummaries={findRelatedSummaries(r, summaries)}
                relatedDonations={findRelatedDonations(r, donations)}
                onStatusUpdate={(status, notes) => {
                setReviewItems(p => p.map(x => x.id === r.id ? { ...x, status, reviewer_notes: notes } : x))
                updateReviewItemStatus(r.id, status, notes)
              }} onPromoteHub={async (id) => {
                const reviewItem = reviewItems.find(x => x.id === id)
                if (!reviewItem || !reviewItem.submitted_island) return
                const hubId = await promoteToHub(id, {
                  name: inferTitleFromReviewItem(reviewItem),
                  island: reviewItem.submitted_island,
                  area: reviewItem.submitted_area || 'Unspecified area',
                  category: inferHubCategory(reviewItem),
                  notes: summarizeReviewText(reviewItem),
                  source_url: reviewItem.feedback_page_url || undefined,
                  confidence: 'medium',
                })
                if (hubId) {
                  setReviewItems(p => p.map(x => x.id === id ? {
                    ...x,
                    status: 'Approved',
                    promoted_hub_id: hubId,
                    reviewer_notes: x.reviewer_notes || 'Promoted to draft hub.',
                  } : x))
                }
              }} onPromoteSummary={async (id) => {
                const reviewItem = reviewItems.find(x => x.id === id)
                if (!reviewItem || !reviewItem.submitted_island) return
                const summaryId = await promoteToSummary(id, {
                  island: reviewItem.submitted_island,
                  area: reviewItem.submitted_area || undefined,
                  title: inferTitleFromReviewItem(reviewItem),
                  description: summarizeReviewText(reviewItem) || 'Submitted from review queue.',
                  category: inferSummaryCategory(reviewItem),
                  urgency: 'Normal',
                  source_url: reviewItem.feedback_page_url || undefined,
                  confidence: 'medium',
                })
                if (summaryId) {
                  setReviewItems(p => p.map(x => x.id === id ? {
                    ...x,
                    status: 'Approved',
                    promoted_summary_id: summaryId,
                    reviewer_notes: x.reviewer_notes || 'Promoted to draft need summary.',
                  } : x))
                }
              }} onMarkHubNeedsReview={async (reviewId, hubId, hubName) => {
                setHubs(p => p.map(x => x.id === hubId ? { ...x, visibility_status: 'review' } : x))
                await updateHubVisibility(hubId, 'review')
                const note = `Reported issue linked to hub: ${hubName}. Moved back to review.`
                setReviewItems(p => p.map(x => x.id === reviewId ? { ...x, status: 'Approved', reviewer_notes: note } : x))
                await updateReviewItemStatus(reviewId, 'Approved', note)
              }} onMarkSummaryNeedsReview={async (reviewId, summaryId, summaryTitle) => {
                setSummaries(p => p.map(x => x.id === summaryId ? { ...x, visibility_status: 'review' } : x))
                await updateSummaryVisibility(summaryId, 'review')
                const note = `Reported issue linked to need summary: ${summaryTitle}. Moved back to review.`
                setReviewItems(p => p.map(x => x.id === reviewId ? { ...x, status: 'Approved', reviewer_notes: note } : x))
                await updateReviewItemStatus(reviewId, 'Approved', note)
              }} onHideDonationFromReview={async (reviewId, donationId, donationTitle) => {
                setDonations(p => p.map(x => x.id === donationId ? { ...x, is_visible: false, needs_review: true, review_reason: 'Reported issue from review queue' } : x))
                await hideDonation(donationId, 'Reported issue from review queue')
                const note = `Reported issue linked to donation: ${donationTitle}. Hidden and marked for review.`
                setReviewItems(p => p.map(x => x.id === reviewId ? { ...x, status: 'Approved', reviewer_notes: note } : x))
                await updateReviewItemStatus(reviewId, 'Approved', note)
              }} onCreateIssue={async (id) => {
                const result = await createGitHubIssue(id)
                if (result) {
                  setReviewItems(p => p.map(x => x.id === id ? { ...x, github_issue_url: result.url, github_issue_number: result.number } : x))
                }
              }} onApproveAndCreateIssue={async (id, notes) => {
                const result = await approveAndCreateGitHubIssue(id, notes)
                if (result) {
                  setReviewItems(p => p.map(x => x.id === id ? {
                    ...x,
                    status: 'Approved',
                    reviewer_notes: notes,
                    github_issue_url: result.url,
                    github_issue_number: result.number,
                  } : x))
                }
              }} />
            })}
        </CardList>
      )}

      {/* ============ SIGNALS ============ */}
      {tab === 'signals' && (
        <CardList empty="No source signals.">
          <SelectionToolbar
            visibleCount={filteredSignals.length}
            selectedCount={selected.size}
            onSelectVisible={() => selectAll(filteredSignals.map(s => s.id))}
            onClear={clearSelection}
          />
          <BulkActionBar count={selected.size}>
            <button onClick={async () => { const ids = Array.from(selected); await Promise.all(ids.map(id => updateSignalReview(id, 'approved', ''))); setSignals(p => p.map(s => selected.has(s.id) ? { ...s, review_status: 'approved', needs_review: false } : s)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Approve</button>
            <button onClick={async () => { const ids = Array.from(selected); await Promise.all(ids.map(id => updateSignalReview(id, 'escalated', ''))); setSignals(p => p.map(s => selected.has(s.id) ? { ...s, review_status: 'escalated', needs_review: false } : s)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Escalate</button>
            <button onClick={async () => { const ids = Array.from(selected); await Promise.all(ids.map(id => updateSignalReview(id, 'rejected', ''))); setSignals(p => p.map(s => selected.has(s.id) ? { ...s, review_status: 'rejected', needs_review: false } : s)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Reject</button>
            <button onClick={() => clearSelection()}
              className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors">Clear</button>
          </BulkActionBar>
          {filteredSignals.map(s => {
              const src = s.source_registry_id ? sourceMap.get(s.source_registry_id) : null
              return <SignalCard key={s.id} signal={s} sourceName={src?.name} sourceType={src?.source_type}
                selected={selected.has(s.id)}
                onToggleSelected={() => toggleSelect(s.id)}
                onReview={(status, notes) => {
                  setSignals(p => p.map(x => x.id === s.id ? { ...x, review_status: status, needs_review: status === 'pending', coordinator_notes: notes } : x))
                  updateSignalReview(s.id, status, notes)
                }} />
            })}
        </CardList>
      )}

      {/* ============ DONATIONS ============ */}
      {tab === 'donations' && (
        <CardList empty="No donation links.">
          <SelectionToolbar
            visibleCount={filteredDonations.length}
            selectedCount={selected.size}
            onSelectVisible={() => selectAll(filteredDonations.map(d => d.id))}
            onClear={clearSelection}
          />
          <BulkActionBar count={selected.size}>
            <button onClick={async () => { await bulkApproveDonations(Array.from(selected)); setDonations(p => p.map(d => selected.has(d.id) ? { ...d, is_visible: true, needs_review: false } : d)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Approve All</button>
            <button onClick={async () => { await bulkHideDonations(Array.from(selected)); setDonations(p => p.map(d => selected.has(d.id) ? { ...d, is_visible: false, needs_review: true } : d)); clearSelection() }}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">Hide All</button>
            <button onClick={() => clearSelection()}
              className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors">Clear</button>
          </BulkActionBar>
          {filteredDonations.map(d => (
              <CardFrame key={d.id} borderClass="border-earth-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleSelect(d.id)} className="rounded border-gray-300" />
                    <Badge label={d.donation_type} color="bg-earth-50 text-earth-700" />
                    <Badge label={d.confidence} color={confidenceColors[d.confidence] ?? 'bg-gray-100'} />
                    {d.is_visible
                      ? <Badge label="public" color="bg-green-100 text-green-800" />
                      : <Badge label="hidden" color="bg-gray-100 text-gray-600" />}
                    {d.needs_review && <Badge label="needs review" color="bg-amber-100 text-amber-800" />}
                    {isStale(d.last_verified_at) && <Badge label="stale" color="bg-amber-100 text-amber-700" />}
                    {d.trust_score !== null && <span className="text-[10px] text-gray-400">Score: {d.trust_score}</span>}
                    <span className="text-xs text-gray-400">{timeAgo(d.updated_at)}</span>
                  </div>
                </div>
                <div className="text-sm font-medium mb-0.5">{d.title}</div>
                {d.organization && <div className="text-xs text-gray-500 mb-0.5">{d.organization}</div>}
                {d.description && <p className="text-xs text-gray-600 mb-1">{d.description}</p>}
                <div className="text-xs text-gray-500 mb-1">
                  {d.island && <span>{d.island}</span>}
                  {d.area && <span> · {d.area}</span>}
                </div>
                {/* Badges and flags */}
                <div className="flex flex-wrap gap-1 mb-1">
                {d.badges.map(b => <span key={b} className="bg-ocean-50 text-ocean-700 text-[10px] px-1.5 py-0.5 rounded">{b}</span>)}
                  {d.flags.map(f => <span key={f} className="bg-lava-500/10 text-lava-600 text-[10px] px-1.5 py-0.5 rounded">{f}</span>)}
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {d.destination_url && <ExternalLink href={d.destination_url} label="Open destination" tone="earth" />}
                  {d.source_url && <ExternalLink href={d.source_url} label="Open source" />}
                </div>
                <div className="text-xs text-gray-400 flex flex-wrap gap-2 mb-2">
                  {d.source_name && <span>Source: {d.source_name}</span>}
                  {d.source_type && <span>({d.source_type})</span>}
                  {d.last_verified_at && <span>Verified: {new Date(d.last_verified_at).toLocaleDateString()}</span>}
                  {d.review_reason && <span>Review: {d.review_reason}</span>}
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                  {!d.is_visible && (
                    <button onClick={() => { setDonations(p => p.map(x => x.id === d.id ? { ...x, is_visible: true, needs_review: false } : x)); approveDonation(d.id) }}
                      className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors">Approve</button>
                  )}
                  {d.is_visible && (
                    <button onClick={() => { setDonations(p => p.map(x => x.id === d.id ? { ...x, is_visible: false, needs_review: true } : x)); hideDonation(d.id, 'Hidden by coordinator') }}
                      className="text-xs px-3 py-1.5 bg-lava-500/10 text-lava-700 rounded hover:bg-lava-500/20 transition-colors">Hide</button>
                  )}
                </div>
              </CardFrame>
            ))}
        </CardList>
      )}

      {/* ============ SOURCES (admin only) ============ */}
      {tab === 'sources' && isAdminRole && (
        <CardList empty="No sources registered.">
          {sources.map(s => (
            <CardFrame key={s.id} borderClass="border-gray-200">
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
              <div className="flex flex-wrap gap-2 mt-2">
                {s.base_url && <ExternalLink href={s.base_url} label="Open source homepage" />}
              </div>
              <div className="text-xs text-gray-400 flex flex-wrap gap-2">
                <span>Strategy: {s.strategy}</span>
                <span>Updates: {s.update_frequency}</span>
                {s.last_checked_at && <span>Last checked: {new Date(s.last_checked_at).toLocaleDateString()}</span>}
              </div>
              {s.notes && <p className="text-xs text-gray-500 mt-1">{s.notes}</p>}
            </CardFrame>
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

function ReviewCard({
  item,
  sourceName,
  selected,
  onToggleSelected,
  relatedHubs,
  relatedSummaries,
  relatedDonations,
  onStatusUpdate,
  onPromoteHub,
  onPromoteSummary,
  onMarkHubNeedsReview,
  onMarkSummaryNeedsReview,
  onHideDonationFromReview,
  onCreateIssue,
  onApproveAndCreateIssue,
}: {
  item: ReviewQueueItem; sourceName?: string
  selected?: boolean
  onToggleSelected?: () => void
  relatedHubs: HelpHub[]
  relatedSummaries: PublicNeedSummary[]
  relatedDonations: DonationLink[]
  onStatusUpdate: (status: string, notes: string) => void
  onPromoteHub?: (id: string) => void
  onPromoteSummary?: (id: string) => void
  onMarkHubNeedsReview?: (reviewId: string, hubId: string, hubName: string) => void
  onMarkSummaryNeedsReview?: (reviewId: string, summaryId: string, summaryTitle: string) => void
  onHideDonationFromReview?: (reviewId: string, donationId: string, donationTitle: string) => void
  onCreateIssue?: (id: string) => void
  onApproveAndCreateIssue?: (id: string, notes: string) => void
}) {
  const [notes, setNotes] = useState(item.reviewer_notes ?? '')
  const isFeedback = item.origin === 'feedback'
  const canBridge = isFeedback && item.feedback_category && GITHUB_SAFE_CATEGORIES.includes(item.feedback_category as typeof GITHUB_SAFE_CATEGORIES[number])
  const isCorrectionReport = isFeedback && item.feedback_category === 'report_issue'
  const isResourceSuggestion = isFeedback && item.feedback_category === 'suggest_resource'
  const promotable = canPromoteReviewItem(item)
  const quickTemplates = isCorrectionReport
    ? [
        'Verify live source and update public copy.',
        'Reported as stale or incorrect. Check source and hide if no longer valid.',
        'Source link needs review or replacement.',
      ]
    : isResourceSuggestion
      ? [
          'Validate source and promote if confirmed.',
          'Needs source verification before publishing.',
        ]
      : []

  return (
    <CardFrame borderClass="border-amber-100">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {onToggleSelected && (
            <input type="checkbox" checked={selected ?? false} onChange={onToggleSelected} className="rounded border-gray-300" />
          )}
          <Badge label={item.status} color={statusColors[item.status] ?? 'bg-gray-100 text-gray-700'} />
          <Badge label={item.origin} color="bg-gray-100 text-gray-600" />
          {isFeedback && item.feedback_category && (
            <Badge label={item.feedback_category} color="bg-ocean-50 text-ocean-700" />
          )}
          {isCorrectionReport && (
            <Badge label="correction" color="bg-lava-500/10 text-lava-700" />
          )}
          {isResourceSuggestion && (
            <Badge label="resource lead" color="bg-green-100 text-green-800" />
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
          {item.feedback_page_url && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-gray-400 break-all">Page: {item.feedback_page_url}</span>
              <ExternalLink href={item.feedback_page_url} label="Open reported page" />
            </div>
          )}
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
        <a href={item.github_issue_url} target="_blank" rel="noopener noreferrer"
          className="inline-block text-xs text-ocean-500 hover:text-ocean-700 underline mt-1">
          GitHub #{item.github_issue_number}
        </a>
      )}

      {promotable && (onPromoteHub || onPromoteSummary) && (
        <div className="flex flex-wrap gap-2 mt-2">
          {onPromoteHub && (
            <button
              type="button"
              onClick={() => onPromoteHub(item.id)}
              className="text-xs px-3 py-1.5 bg-ocean-50 text-ocean-700 rounded hover:bg-ocean-100 transition-colors"
            >
              Create hub draft
            </button>
          )}
          {onPromoteSummary && (
            <button
              type="button"
              onClick={() => onPromoteSummary(item.id)}
              className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              Create need draft
            </button>
          )}
        </div>
      )}

      {isCorrectionReport && (relatedHubs.length > 0 || relatedSummaries.length > 0 || relatedDonations.length > 0) && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
          <div className="text-xs text-gray-400">Possible matches</div>
          {relatedHubs.map(hub => (
            <div key={hub.id} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-600">Hub: {hub.name}</span>
              {hub.source_url && <ExternalLink href={hub.source_url} label="Open source" />}
              {onMarkHubNeedsReview && (
                <button
                  type="button"
                  onClick={() => onMarkHubNeedsReview(item.id, hub.id, hub.name)}
                  className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 transition-colors"
                >
                  Move hub to review
                </button>
              )}
            </div>
          ))}
          {relatedSummaries.map(summary => (
            <div key={summary.id} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-600">Need: {summary.title}</span>
              {summary.source_url && <ExternalLink href={summary.source_url} label="Open source" />}
              {onMarkSummaryNeedsReview && (
                <button
                  type="button"
                  onClick={() => onMarkSummaryNeedsReview(item.id, summary.id, summary.title)}
                  className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 transition-colors"
                >
                  Move need to review
                </button>
              )}
            </div>
          ))}
          {relatedDonations.map(donation => (
            <div key={donation.id} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-600">Donation: {donation.title}</span>
              <ExternalLink href={donation.destination_url} label="Open destination" tone="earth" />
              {donation.source_url && <ExternalLink href={donation.source_url} label="Open source" />}
              {onHideDonationFromReview && (
                <button
                  type="button"
                  onClick={() => onHideDonationFromReview(item.id, donation.id, donation.title)}
                  className="px-2.5 py-1 bg-lava-500/10 text-lava-700 rounded hover:bg-lava-500/20 transition-colors"
                >
                  Hide donation
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* GitHub issue bridge for approved safe-category feedback */}
      {!item.github_issue_url && canBridge && item.status === 'Approved' && onCreateIssue && (
        <button onClick={() => onCreateIssue(item.id)}
          className="text-xs px-3 py-1.5 mt-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition-colors">
          Create GitHub Issue
        </button>
      )}

      {/* One-click flow: approve + create issue */}
      {!item.github_issue_url && canBridge && item.status === 'Pending' && onApproveAndCreateIssue && (
        <button onClick={() => onApproveAndCreateIssue(item.id, notes)}
          className="text-xs px-3 py-1.5 mt-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition-colors">
          Approve + Create GitHub Issue
        </button>
      )}

      {item.status === 'Pending' && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
          {quickTemplates.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Quick reviewer notes</div>
              <div className="flex flex-wrap gap-1.5">
                {quickTemplates.map(template => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setNotes(template)}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          )}
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Reviewer notes…"
            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-ocean-400" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onStatusUpdate('Approved', notes)}
              className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors">
              {isCorrectionReport ? 'Reviewed' : 'Approve'}
            </button>
            <button onClick={() => onStatusUpdate('Acknowledged', notes)}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
              Acknowledge
            </button>
            <button onClick={() => onStatusUpdate('Rejected', notes)}
              className="text-xs px-3 py-1.5 bg-lava-500/10 text-lava-700 rounded hover:bg-lava-500/20 transition-colors">
              {isCorrectionReport ? 'Not valid' : 'Reject'}
            </button>
            <button onClick={() => onStatusUpdate('Escalated', notes)}
              className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">
              {isCorrectionReport ? 'Needs follow-up' : 'Escalate'}
            </button>
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
    </CardFrame>
  )
}

function SignalCard({ signal, sourceName, sourceType, selected, onToggleSelected, onReview }: {
  signal: SourceSignal; sourceName?: string; sourceType?: string
  selected?: boolean
  onToggleSelected?: () => void
  onReview: (status: string, notes: string) => void
}) {
  const [notes, setNotes] = useState(signal.coordinator_notes ?? '')

  return (
    <CardFrame borderClass="border-purple-100">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {onToggleSelected && (
            <input type="checkbox" checked={selected ?? false} onChange={onToggleSelected} className="rounded border-gray-300" />
          )}
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
          <StatusActionRow
            current={signal.review_status}
            actions={[
              { label: 'Approve', value: 'approved', tone: 'success' },
              { label: 'Escalate', value: 'escalated', tone: 'warning' },
              { label: 'Reject', value: 'rejected', tone: 'danger' },
            ]}
            onUpdate={status => onReview(status, notes)}
          />
        </div>
      )}

      {!signal.needs_review && signal.coordinator_notes && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">Notes: {signal.coordinator_notes}</p>
        </div>
      )}
    </CardFrame>
  )
}

function BulkActionBar({ count, children }: { count: number; children: React.ReactNode }) {
  if (count === 0) return null
  return (
    <div className="sticky top-0 z-10 bg-ocean-600 text-white rounded-lg px-4 py-2 mb-3 flex items-center justify-between gap-3">
      <span className="text-xs font-medium">{count} selected</span>
      <div className="flex gap-2">{children}</div>
    </div>
  )
}
