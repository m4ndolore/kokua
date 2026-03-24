/**
 * Kokua Hub — Import Donation Links from JSON
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SECRET_API_KEY=... npx tsx scripts/import-donations.ts data/donations.json
 *
 * Input format: JSON array of donation link objects, or envelope with { source, items }.
 * Imported items default to needs_review=true, is_visible=false.
 * Trust rules: social source -> always hidden+review, low confidence -> always hidden+review.
 * High-trust official/nonprofit/platform with high confidence -> needs_review=false (still hidden until approved).
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const VALID_DONATION_TYPES = ['institutional', 'platform_hub', 'community_campaign', 'in_kind_support', 'volunteer']
const VALID_SOURCE_TYPES = ['official', 'nonprofit', 'news', 'social', 'community', 'platform', 'internal', 'other']
const VALID_CONFIDENCE = ['high', 'medium', 'low']

function computeTrustScore(link: DonationInput): number {
  let score = 50
  if (link.source_type === 'official') score += 20
  else if (link.source_type === 'nonprofit') score += 18
  else if (link.source_type === 'platform') score += 12
  else if (link.source_type === 'social') score -= 20
  if (link.donation_type === 'institutional') score += 12
  else if (link.donation_type === 'platform_hub') score += 8
  else if (link.donation_type === 'community_campaign') score -= 6
  if (link.confidence === 'high') score += 12
  else if (link.confidence === 'low') score -= 18
  const badges = link.badges ?? []
  if (badges.includes('Established Organization')) score += 8
  if (badges.includes('Platform Verified')) score += 6
  if (badges.includes('Local Organization')) score += 4
  if (badges.includes('501(c)(3) Verified')) score += 10
  if (badges.includes('Charity Navigator 4-Star')) score += 8
  if (badges.includes('Matching Fund')) score += 5
  const flags = link.flags ?? []
  if (flags.includes('low_confidence')) score -= 10
  if (flags.includes('source_conflict')) score -= 15
  if (flags.includes('stale')) score -= 12
  if (flags.includes('broken_link')) score -= 30
  if (flags.includes('suspicious')) score -= 25
  if (flags.includes('social_source')) score -= 20
  if (flags.includes('unresolved_shortlink')) score -= 8
  if (link.last_verified_at) {
    const ageMs = Date.now() - new Date(link.last_verified_at).getTime()
    if (ageMs <= 48 * 60 * 60 * 1000) score += 6
  }
  return Math.max(0, Math.min(100, score))
}

interface DonationInput {
  external_id: string
  title: string
  organization?: string | null
  donation_type: string
  description?: string | null
  island?: string | null
  area?: string | null
  neighborhood?: string | null
  address?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
  lat?: number | string | null
  lng?: number | string | null
  lon?: number | string | null
  hours?: string | null
  destination_url: string
  source_name?: string | null
  source_type?: string | null
  source_url?: string | null
  confidence?: string
  trust_score?: number | null
  badges?: string[]
  flags?: string[]
  last_verified_at?: string | null
  is_visible?: boolean
  needs_review?: boolean
  review_reason?: string | null
  tags?: string[]
}

interface Envelope {
  source?: { name: string; type: string; url: string }
  mode?: string
  items: DonationInput[]
}

function normalizeCoordinate(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

async function main() {
  const file = process.argv[2]
  if (!file) { console.error('Usage: npx tsx scripts/import-donations.ts <path>'); process.exit(1) }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_API_KEY
  if (!url || !key) { console.error('SUPABASE_URL and SUPABASE_SECRET_API_KEY required.'); process.exit(1) }

  const supabase = createClient(url, key)
  let items: DonationInput[]
  let defaultSource: Envelope['source'] | undefined

  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8'))
    if (Array.isArray(raw)) {
      items = raw
    } else if (raw.items && Array.isArray(raw.items)) {
      items = raw.items
      defaultSource = raw.source
    } else {
      throw new Error('Expected JSON array or { source, items } envelope')
    }
  } catch (err) { console.error(`Error: ${err}`); process.exit(1) }

  console.log(`Importing ${items.length} donation links...`)
  let imported = 0, skipped = 0

  for (const item of items) {
    if (!item.external_id || !item.title || !item.destination_url || !item.donation_type) {
      console.warn(`Skip: missing required field — ${item.title || item.external_id || '?'}`)
      skipped++; continue
    }
    if (!VALID_DONATION_TYPES.includes(item.donation_type)) {
      console.warn(`Skip: invalid donation_type "${item.donation_type}" — ${item.title}`)
      skipped++; continue
    }

    // Apply defaults from envelope source
    const sourceName = item.source_name ?? defaultSource?.name ?? null
    const sourceType = item.source_type ?? defaultSource?.type ?? null
    const sourceUrl = item.source_url ?? defaultSource?.url ?? null
    const confidence = VALID_CONFIDENCE.includes(item.confidence ?? '') ? item.confidence! : 'medium'
    const badges = item.badges ?? []
    const flags = item.flags ?? []

    // Trust rules
    let needsReview = item.needs_review ?? true
    let isVisible = item.is_visible ?? false

    // Social source -> always review
    if (sourceType === 'social') {
      needsReview = true
      isVisible = false
    }
    // Low confidence -> always review
    if (confidence === 'low') {
      needsReview = true
      isVisible = false
    }
    // High-trust auto-skip review (but still not visible until approved)
    if (
      confidence === 'high' &&
      sourceType && ['official', 'nonprofit', 'platform'].includes(sourceType) &&
      sourceName && sourceUrl && item.destination_url
    ) {
      needsReview = false
    }

    const trustScore = item.trust_score ?? computeTrustScore({
      ...item,
      source_type: sourceType,
      confidence,
      badges,
      flags,
    })

    const row = {
      external_id: item.external_id,
      title: item.title,
      organization: item.organization ?? null,
      donation_type: item.donation_type,
      description: item.description ?? null,
      island: item.island ?? null,
      area: item.area ?? null,
      neighborhood: item.neighborhood ?? null,
      address: item.address ?? null,
      latitude: normalizeCoordinate(item.latitude ?? item.lat),
      longitude: normalizeCoordinate(item.longitude ?? item.lng ?? item.lon),
      hours: item.hours ?? null,
      destination_url: item.destination_url,
      source_name: sourceName,
      source_type: VALID_SOURCE_TYPES.includes(sourceType ?? '') ? sourceType : null,
      source_url: sourceUrl,
      confidence,
      trust_score: trustScore,
      badges,
      flags,
      last_verified_at: item.last_verified_at ?? null,
      is_visible: isVisible,
      needs_review: needsReview,
      review_reason: item.review_reason ?? null,
      tags: item.tags ?? [],
    }

    const { error } = await supabase.from('donation_links')
      .upsert(row, { onConflict: 'external_id' })
    if (error) {
      console.warn(`Skip: DB error for "${item.title}" — ${error.message}`)
      skipped++
    } else {
      imported++
    }
  }

  console.log(`Done: ${imported} imported, ${skipped} skipped.`)
}

main()
