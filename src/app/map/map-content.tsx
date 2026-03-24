'use client'

import { useMemo, useRef, useState } from 'react'
import { ISLANDS } from '@/lib/types'
import type { DonationLink, GeoReferenceNode, HelpHub, PublicNeedSummary } from '@/lib/types'

type MapPoint = {
  id: string
  kind: 'hub' | 'donation' | 'need'
  title: string
  subtitle: string
  island: string
  area: string | null
  lat: number
  lng: number
  approximate: boolean
  href: string | null
  sourceHref: string | null
  sourceLabel: string | null
  status: string | null
  category: string
  description: string | null
  confidence: string
  verifiedAt: string | null
  noticeType: string | null
  radiusKm: number | null
}

type ViewState = {
  zoom: number
  offsetX: number
  offsetY: number
}

const ISLAND_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'Oʻahu': { lat: 21.483, lng: -157.98 },
  'Maui': { lat: 20.798, lng: -156.331 },
  'Hawaiʻi (Big Island)': { lat: 19.593, lng: -155.428 },
  'Kauaʻi': { lat: 22.096, lng: -159.526 },
  'Molokaʻi': { lat: 21.144, lng: -157.024 },
  'Lānaʻi': { lat: 20.828, lng: -156.918 },
}

const MAP_BOUNDS = {
  minLat: 18.7,
  maxLat: 22.4,
  minLng: -160.8,
  maxLng: -154.6,
}

const ISLAND_SHAPES = [
  { name: 'Kauaʻi', path: 'M 6 22 C 10 12, 22 8, 30 12 C 36 16, 38 26, 30 32 C 20 40, 8 34, 6 22 Z', lat: 22.08, lng: -159.53, scale: 1.2 },
  { name: 'Oʻahu', path: 'M 8 24 C 16 12, 36 10, 48 16 C 58 21, 60 31, 52 38 C 38 48, 18 46, 8 34 C 4 30, 4 27, 8 24 Z', lat: 21.47, lng: -157.98, scale: 1.55 },
  { name: 'Molokaʻi', path: 'M 6 24 C 16 18, 36 18, 46 24 C 38 30, 18 32, 6 24 Z', lat: 21.14, lng: -157.03, scale: 1.1 },
  { name: 'Lānaʻi', path: 'M 12 12 C 22 8, 34 10, 38 20 C 30 30, 16 30, 12 12 Z', lat: 20.82, lng: -156.92, scale: 0.9 },
  { name: 'Maui', path: 'M 10 16 C 18 8, 30 8, 36 16 C 40 22, 40 28, 34 34 C 28 40, 18 40, 12 34 C 8 30, 8 24, 10 16 Z M 40 24 C 48 18, 58 18, 62 26 C 56 34, 46 34, 40 24 Z', lat: 20.83, lng: -156.36, scale: 1.35 },
  { name: 'Hawaiʻi (Big Island)', path: 'M 10 12 C 26 6, 44 10, 54 22 C 62 34, 58 48, 44 56 C 28 64, 12 58, 8 42 C 4 30, 4 18, 10 12 Z', lat: 19.62, lng: -155.52, scale: 1.9 },
]

function truncate(text: string | null | undefined, max = 140) {
  if (!text) return null
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}...`
}

function hostLabel(url: string | null) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function project(lat: number, lng: number) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100
  const y = (1 - (lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100
  return { x, y }
}

function buildPoints(
  hubs: HelpHub[],
  donations: DonationLink[],
  summaries: PublicNeedSummary[],
  geoNodes: GeoReferenceNode[],
): MapPoint[] {
  const geoNodeMap = new Map(geoNodes.map((node) => [node.id, node]))

  const hubPoints = hubs.map((hub) => {
    const geoNode = hub.geo_reference_node_id ? geoNodeMap.get(hub.geo_reference_node_id) : null
    const exact = hub.latitude !== null && hub.longitude !== null
    const fallback = geoNode || ISLAND_CENTROIDS[hub.island] || ISLAND_CENTROIDS['Oʻahu']

    return {
      id: hub.id,
      kind: 'hub' as const,
      title: hub.name,
      subtitle: hub.category,
      island: hub.island,
      area: hub.area,
      lat: exact ? hub.latitude! : ('latitude' in fallback ? fallback.latitude : fallback.lat),
      lng: exact ? hub.longitude! : ('longitude' in fallback ? fallback.longitude : fallback.lng),
      approximate: !exact,
      href: null,
      sourceHref: hub.source_url,
      sourceLabel: hub.source_name || hostLabel(hub.source_url),
      status: hub.status,
      category: hub.category,
      description: hub.notes,
      confidence: hub.confidence,
      verifiedAt: hub.last_verified_at,
      noticeType: geoNode?.notice_type || null,
      radiusKm: geoNode?.radius_km || null,
    }
  })

  const donationPoints = donations.map((donation) => {
    const island = donation.island || 'Oʻahu'
    const exact = donation.latitude !== null && donation.longitude !== null
    const centroid = ISLAND_CENTROIDS[island] || ISLAND_CENTROIDS['Oʻahu']
    return {
      id: donation.id,
      kind: 'donation' as const,
      title: donation.title,
      subtitle: donation.organization || donation.donation_type,
      island,
      area: donation.area,
      lat: exact ? donation.latitude! : centroid.lat,
      lng: exact ? donation.longitude! : centroid.lng,
      approximate: !exact,
      href: donation.destination_url,
      sourceHref: donation.source_url,
      sourceLabel: donation.source_name || hostLabel(donation.source_url),
      status: donation.is_visible ? 'Public' : 'Hidden',
      category: donation.donation_type,
      description: donation.description,
      confidence: donation.confidence,
      verifiedAt: donation.last_verified_at,
      noticeType: null,
      radiusKm: null,
    }
  })

  const summaryPoints = summaries
    .map((summary) => {
      const geoNode = summary.geo_reference_node_id ? geoNodeMap.get(summary.geo_reference_node_id) : null
      if (!geoNode) return null
      return {
        id: summary.id,
        kind: 'need' as const,
        title: summary.title,
        subtitle: summary.category,
        island: summary.island,
        area: summary.area,
        lat: geoNode.latitude,
        lng: geoNode.longitude,
        approximate: true,
        href: null,
        sourceHref: summary.source_url,
        sourceLabel: summary.source_name || hostLabel(summary.source_url),
        status: summary.urgency,
        category: summary.category,
        description: summary.description,
        confidence: summary.confidence,
        verifiedAt: summary.last_verified_at,
        noticeType: geoNode.notice_type,
        radiusKm: geoNode.radius_km,
      }
    })
    .filter(Boolean) as MapPoint[]

  return [...hubPoints, ...donationPoints, ...summaryPoints]
}

function needsByIsland(summaries: PublicNeedSummary[], island: string) {
  return summaries.filter((summary) => summary.island === island).slice(0, 3)
}

export function MapContent({
  hubs,
  donations,
  summaries,
  geoNodes,
}: {
  hubs: HelpHub[]
  donations: DonationLink[]
  summaries: PublicNeedSummary[]
  geoNodes: GeoReferenceNode[]
}) {
  const [islandFilter, setIslandFilter] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | 'hub' | 'donation' | 'need'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<ViewState>({ zoom: 1, offsetX: 0, offsetY: 0 })
  const dragRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null)

  const points = useMemo(() => buildPoints(hubs, donations, summaries, geoNodes), [hubs, donations, summaries, geoNodes])

  const visiblePoints = useMemo(() => {
    return points.filter((point) => {
      if (islandFilter && point.island !== islandFilter) return false
      if (kindFilter !== 'all' && point.kind !== kindFilter) return false
      if (categoryFilter && point.category !== categoryFilter) return false
      return true
    })
  }, [points, islandFilter, kindFilter, categoryFilter])

  const selectedPoint = visiblePoints.find((point) => point.id === selectedId) || visiblePoints[0] || null

  const visibleCategories = useMemo(() => {
    return Array.from(new Set(
      points
        .filter((point) => !islandFilter || point.island === islandFilter)
        .filter((point) => kindFilter === 'all' || point.kind === kindFilter)
        .map((point) => point.category),
    )).sort((a, b) => a.localeCompare(b))
  }, [points, islandFilter, kindFilter])

  const exactCount = visiblePoints.filter((point) => !point.approximate).length

  function startDrag(clientX: number, clientY: number) {
    dragRef.current = { x: clientX, y: clientY, originX: view.offsetX, originY: view.offsetY }
  }

  function moveDrag(clientX: number, clientY: number) {
    if (!dragRef.current) return
    const deltaX = clientX - dragRef.current.x
    const deltaY = clientY - dragRef.current.y
    setView((prev) => ({ ...prev, offsetX: dragRef.current!.originX + deltaX, offsetY: dragRef.current!.originY + deltaY }))
  }

  function endDrag() {
    dragRef.current = null
  }

  return (
    <div className="py-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-5">
          <div className="inline-flex rounded-full bg-ocean-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ocean-800">
            Public Map
          </div>
          <h1 className="mt-3 text-3xl font-bold text-ocean-900">Resource Map</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            View verified help hubs, donation options, and area-level notices. Exact facilities show as precise pins.
            Broader notices and unresolved locations are anchored to trusted reference nodes and labeled as approximate.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
          <section className="rounded-[28px] border border-ocean-100 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap gap-2 mb-4">
              <select value={islandFilter} onChange={(e) => setIslandFilter(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="">All islands</option>
                {ISLANDS.map((island) => <option key={island} value={island}>{island}</option>)}
              </select>
              <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as 'all' | 'hub' | 'donation' | 'need')} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="all">All map layers</option>
                <option value="hub">Help hubs</option>
                <option value="donation">Donations</option>
                <option value="need">Area notices</option>
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="">All categories</option>
                {visibleCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>

            <div className="relative overflow-hidden rounded-[24px] border border-ocean-100 bg-[radial-gradient(circle_at_top,#d7f0f8,transparent_45%),linear-gradient(180deg,#effafc_0%,#f8fdfe_100%)]">
              <div
                className="relative aspect-[1.28] touch-none cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
                onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={endDrag}
              >
                <div
                  className="absolute inset-0 origin-center transition-transform"
                  style={{ transform: `translate(${view.offsetX}px, ${view.offsetY}px) scale(${view.zoom})` }}
                >
                  <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(29,110,140,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(29,110,140,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    {ISLAND_SHAPES.map((shape) => {
                      const pos = project(shape.lat, shape.lng)
                      return (
                        <g key={shape.name} transform={`translate(${pos.x} ${pos.y}) scale(${shape.scale / 100})`}>
                          <path d={shape.path} fill="rgba(29,110,140,0.12)" stroke="rgba(29,110,140,0.28)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                        </g>
                      )
                    })}
                  </svg>

                  {Object.entries(ISLAND_CENTROIDS).map(([island, coords]) => {
                    const pos = project(coords.lat, coords.lng)
                    return (
                      <div
                        key={island}
                        className="absolute -translate-x-1/2 -translate-y-1/2 text-[11px] font-medium text-ocean-600/85"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      >
                        {island}
                      </div>
                    )
                  })}

                  {visiblePoints.map((point) => {
                    const pos = project(point.lat, point.lng)
                    const isSelected = selectedPoint?.id === point.id
                    const tone = point.kind === 'hub'
                      ? isSelected ? 'bg-ocean-700 ring-ocean-300' : 'bg-ocean-600 ring-ocean-200'
                      : point.kind === 'donation'
                        ? isSelected ? 'bg-earth-700 ring-earth-300' : 'bg-earth-600 ring-earth-200'
                        : isSelected ? 'bg-amber-700 ring-amber-300' : 'bg-amber-500 ring-amber-200'

                    return (
                      <button
                        key={point.id}
                        type="button"
                        onClick={() => setSelectedId(point.id)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 transition-transform hover:scale-110 ${tone} ${point.kind === 'need' ? 'h-6 w-6 border-2 border-white' : point.approximate ? 'h-4 w-4 border-2 border-dashed border-white' : 'h-5 w-5 border-2 border-white'} ${isSelected ? 'z-20 scale-110' : 'z-10'}`}
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        title={point.title}
                      />
                    )
                  })}
                </div>

                <div className="absolute left-4 top-4 rounded-2xl bg-white/92 px-3 py-2 shadow-sm backdrop-blur">
                  <div className="text-xs font-semibold text-ocean-800">{visiblePoints.length} visible map records</div>
                  <div className="mt-1 text-[11px] text-gray-500">{exactCount} exact pins, {visiblePoints.length - exactCount} approximate or area anchors</div>
                </div>

                <div className="absolute right-4 top-4 flex flex-col gap-2">
                  <button type="button" onClick={() => setView((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 0.2, 2.2) }))} className="rounded-xl bg-white/92 px-3 py-2 text-sm font-medium text-ocean-800 shadow-sm">+</button>
                  <button type="button" onClick={() => setView((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 0.2, 0.9) }))} className="rounded-xl bg-white/92 px-3 py-2 text-sm font-medium text-ocean-800 shadow-sm">-</button>
                  <button type="button" onClick={() => setView({ zoom: 1, offsetX: 0, offsetY: 0 })} className="rounded-xl bg-white/92 px-3 py-2 text-xs font-medium text-gray-600 shadow-sm">Reset</button>
                </div>

                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  <div className="rounded-full bg-white/95 px-3 py-1 text-[11px] text-gray-600 shadow-sm">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-ocean-600 mr-1.5 align-middle" />
                    Help hubs
                  </div>
                  <div className="rounded-full bg-white/95 px-3 py-1 text-[11px] text-gray-600 shadow-sm">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-earth-600 mr-1.5 align-middle" />
                    Donations
                  </div>
                  <div className="rounded-full bg-white/95 px-3 py-1 text-[11px] text-gray-600 shadow-sm">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 mr-1.5 align-middle" />
                    Area notices
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-ocean-100 bg-ocean-50/60 px-4 py-3 text-xs text-ocean-800">
              This is a coordinator-curated map, not an official emergency GIS layer. Open the linked source for the latest details. Some broad notices are intentionally shown as approximate area anchors.
            </div>
          </section>

          <aside className="space-y-4">
            {selectedPoint ? (
              <div className="rounded-[28px] border border-ocean-100 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${selectedPoint.kind === 'hub' ? 'bg-ocean-100 text-ocean-800' : selectedPoint.kind === 'donation' ? 'bg-earth-100 text-earth-800' : 'bg-amber-100 text-amber-800'}`}>
                    {selectedPoint.kind === 'hub' ? 'Help hub' : selectedPoint.kind === 'donation' ? 'Donation' : 'Area notice'}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {selectedPoint.island}{selectedPoint.area ? ` · ${selectedPoint.area}` : ''}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedPoint.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{selectedPoint.subtitle}</p>
                {selectedPoint.description && <p className="mt-3 text-sm leading-6 text-gray-600">{truncate(selectedPoint.description, 220)}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedPoint.href && <a href={selectedPoint.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl bg-earth-600 px-4 py-2 text-sm font-medium text-white hover:bg-earth-700">Open destination ↗</a>}
                  {selectedPoint.sourceHref && <a href={selectedPoint.sourceHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-ocean-200 px-4 py-2 text-sm font-medium text-ocean-700 hover:bg-ocean-50">Open source ↗</a>}
                </div>
                <div className="mt-4 space-y-1 text-xs text-gray-500">
                  <div>Status: {selectedPoint.status || 'Unknown'}</div>
                  <div>Confidence: {selectedPoint.confidence}</div>
                  {selectedPoint.sourceLabel && <div>Source: {selectedPoint.sourceLabel}</div>}
                  {selectedPoint.noticeType && <div>Notice type: {selectedPoint.noticeType.replace('_', ' ')}</div>}
                  {selectedPoint.radiusKm && <div>Coverage radius: ~{selectedPoint.radiusKm} km</div>}
                  {selectedPoint.verifiedAt && <div>Verified: {new Date(selectedPoint.verifiedAt).toLocaleDateString()}</div>}
                  {selectedPoint.approximate && <div className="text-amber-700">Map location is approximate or area-based.</div>}
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-ocean-100 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">No mapped records yet</h2>
                <p className="mt-2 text-sm text-gray-600">There are no public hubs, donations, or notices for the current filter set. Try another island, or use the list-based help finder.</p>
                <a href="/need-help/find" className="mt-4 inline-flex text-sm font-medium text-ocean-700 underline">Open list view →</a>
              </div>
            )}

            <div className="rounded-[28px] border border-ocean-100 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-ocean-900">Visible records</h2>
                <span className="text-xs text-gray-400">{visiblePoints.length}</span>
              </div>
              <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {visiblePoints.map((point) => (
                  <button key={point.id} type="button" onClick={() => setSelectedId(point.id)} className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${selectedPoint?.id === point.id ? 'border-ocean-300 bg-ocean-50/60' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-gray-900">{point.title}</div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${point.kind === 'hub' ? 'bg-ocean-100 text-ocean-700' : point.kind === 'donation' ? 'bg-earth-100 text-earth-700' : 'bg-amber-100 text-amber-700'}`}>
                        {point.kind}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{point.island}{point.area ? ` · ${point.area}` : ''} · {point.category}</div>
                    {point.description && <p className="mt-2 text-xs leading-5 text-gray-600">{truncate(point.description, 100)}</p>}
                    {point.approximate && <div className="mt-2 text-[11px] text-amber-700">Approximate or area anchor</div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-ocean-100 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              <h2 className="text-lg font-semibold text-ocean-900">Current needs</h2>
              <div className="mt-4 space-y-3">
                {(islandFilter ? needsByIsland(summaries, islandFilter) : summaries.slice(0, 3)).map((summary) => (
                  <div key={summary.id} className="rounded-2xl border border-ocean-100 bg-ocean-50/40 px-4 py-3">
                    <div className="text-xs text-gray-500">{summary.island}{summary.area ? ` · ${summary.area}` : ''}</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">{summary.title}</div>
                    <p className="mt-1 text-xs leading-5 text-gray-600">{truncate(summary.description, 110)}</p>
                    {summary.source_url && <a href={summary.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs font-medium text-ocean-700 underline">Open source ↗</a>}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
