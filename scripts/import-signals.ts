/**
 * Kōkua Hub — Import Source Signals from JSON
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/import-signals.ts data/signals.json
 *
 * Input format: see scripts/sample-signals.json
 *
 * Rules applied during import:
 * - Social-derived signals default to needs_review=true
 * - Low confidence signals default to needs_review=true
 * - Missing source stays needs_review=true
 * - High-trust official sources with high confidence may set needs_review=false
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const VALID_SIGNAL_TYPES = [
  'resource', 'need', 'update', 'closure', 'route_change',
  'donation_drive', 'volunteer_call', 'question', 'feedback', 'other',
]

interface SignalInput {
  source_registry_id?: string; title?: string; signal_type: string
  raw_url?: string; raw_text?: string; raw_payload?: Record<string, unknown>
  island?: string; area?: string; neighborhood?: string
  derived_resource_name?: string; derived_resource_type?: string; derived_status?: string
  confidence?: string; last_observed_at?: string
  review_reason?: string; needs_review?: boolean
}

async function main() {
  const file = process.argv[2]
  if (!file) { console.error('Usage: npx tsx scripts/import-signals.ts <path>'); process.exit(1) }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) { console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.'); process.exit(1) }

  const supabase = createClient(url, key)
  let data: SignalInput[]
  try {
    data = JSON.parse(readFileSync(file, 'utf-8'))
    if (!Array.isArray(data)) throw new Error('Expected JSON array')
  } catch (err) { console.error(`Error: ${err}`); process.exit(1) }

  // Load source registry for trust checks
  const { data: sources } = await supabase.from('source_registry').select('id, source_type, trust_level')
  const sourceMap = new Map((sources ?? []).map((s: { id: string; source_type: string; trust_level: string }) => [s.id, s]))

  console.log(`Importing ${data.length} signals...`)
  let imported = 0, skipped = 0

  for (const sig of data) {
    if (!sig.signal_type || !VALID_SIGNAL_TYPES.includes(sig.signal_type)) {
      console.warn(`Skip: bad signal_type "${sig.signal_type}"`)
      skipped++; continue
    }

    // Determine needs_review based on trust rules
    let needsReview = sig.needs_review ?? true
    const confidence = sig.confidence || 'low'

    if (confidence === 'low') needsReview = true
    if (!sig.source_registry_id) needsReview = true

    if (sig.source_registry_id) {
      const src = sourceMap.get(sig.source_registry_id)
      if (src?.source_type === 'social') needsReview = true
      // High-trust official with high confidence can skip review
      if (src?.trust_level === 'high' && src?.source_type === 'official' && confidence === 'high') {
        needsReview = sig.needs_review ?? false
      }
    }

    const { error } = await supabase.from('source_signals').insert({
      source_registry_id: sig.source_registry_id || null,
      title: sig.title || null,
      signal_type: sig.signal_type,
      raw_url: sig.raw_url || null,
      raw_text: sig.raw_text || null,
      raw_payload: sig.raw_payload || null,
      island: sig.island || null,
      area: sig.area || null,
      neighborhood: sig.neighborhood || null,
      derived_resource_name: sig.derived_resource_name || null,
      derived_resource_type: sig.derived_resource_type || null,
      derived_status: sig.derived_status || null,
      confidence,
      last_observed_at: sig.last_observed_at || new Date().toISOString(),
      needs_review: needsReview,
      review_reason: sig.review_reason || (needsReview ? 'Imported — awaiting review' : null),
      review_status: needsReview ? 'pending' : 'approved',
    })

    if (error) { console.error(`Error: ${error.message}`); skipped++ }
    else imported++
  }

  console.log(`Done. Imported: ${imported}, Skipped: ${skipped}`)
}

main()
