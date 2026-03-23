/**
 * Kōkua Hub — Import Help Hubs from JSON
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SECRET_API_KEY=... npx tsx scripts/import-hubs.ts data/hubs.json
 *
 * Input format: see scripts/sample-hubs.json
 * Imported hubs default to visibility_status='review' and confidence='medium'.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const VALID_CATEGORIES = [
  'Shelter', 'Food distribution', 'Water distribution', 'Supply distribution',
  'Medical', 'Charging station', 'Laundry', 'Shower', 'Cleanup staging',
  'Government office', 'Volunteer hub', 'Donation drop-off', 'Other',
]

const VALID_STATUSES = ['Open', 'Limited', 'Closed', 'Unknown']

interface HubInput {
  name: string; island: string; area: string; category: string
  status?: string; hours?: string; notes?: string
  public_phone?: string; public_email?: string; address?: string
  source_name?: string; source_type?: string; source_url?: string
  source_registry_id?: string; confidence?: string
  visibility_status?: string
}

async function main() {
  const file = process.argv[2]
  if (!file) { console.error('Usage: npx tsx scripts/import-hubs.ts <path>'); process.exit(1) }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_API_KEY
  if (!url || !key) { console.error('SUPABASE_URL and SUPABASE_SECRET_API_KEY required.'); process.exit(1) }

  const supabase = createClient(url, key)
  let data: HubInput[]
  try {
    data = JSON.parse(readFileSync(file, 'utf-8'))
    if (!Array.isArray(data)) throw new Error('Expected JSON array')
  } catch (err) { console.error(`Error: ${err}`); process.exit(1) }

  console.log(`Importing ${data.length} hubs...`)
  let imported = 0, skipped = 0

  for (const hub of data) {
    if (!hub.name || !hub.island || !hub.area || !hub.category) { console.warn(`Skip: missing field — ${hub.name || '?'}`); skipped++; continue }
    if (!VALID_CATEGORIES.includes(hub.category)) { console.warn(`Skip: bad category "${hub.category}" — ${hub.name}`); skipped++; continue }
    const status = hub.status || 'Unknown'
    if (!VALID_STATUSES.includes(status)) { console.warn(`Skip: bad status "${status}" — ${hub.name}`); skipped++; continue }

    const { error } = await supabase.from('help_hubs').insert({
      name: hub.name, island: hub.island, area: hub.area, category: hub.category, status,
      hours: hub.hours || null, notes: hub.notes || null,
      public_phone: hub.public_phone || null, public_email: hub.public_email || null,
      address: hub.address || null,
      source_name: hub.source_name || null, source_type: hub.source_type || null,
      source_url: hub.source_url || null, source_registry_id: hub.source_registry_id || null,
      confidence: hub.confidence || 'medium',
      visibility_status: hub.visibility_status || 'review',
      last_verified_at: new Date().toISOString(),
    })

    if (error) { console.error(`Error "${hub.name}": ${error.message}`); skipped++ }
    else imported++
  }

  console.log(`Done. Imported: ${imported}, Skipped: ${skipped}`)
  if (imported > 0) console.log('Imported hubs default to visibility_status=review. Publish them in the dashboard.')
}

main()
