/**
 * Kōkua Hub — Import Script for Curated Public Resources
 *
 * Usage:
 *   npx tsx scripts/import-hubs.ts data/hubs.json
 *
 * Input format (JSON array):
 * [
 *   {
 *     "name": "Kapolei Shelter",
 *     "island": "Oʻahu",
 *     "area": "Kapolei",
 *     "category": "Shelter",
 *     "status": "Open",
 *     "hours": "24 hours",
 *     "notes": "Red Cross managed.",
 *     "public_phone": "808-555-1001",
 *     "public_email": null,
 *     "address": "91-1001 Farrington Hwy",
 *     "source_url": "https://example.com/source",
 *     "is_visible": false
 *   }
 * ]
 *
 * Valid categories:
 *   Shelter, Food distribution, Water distribution, Supply distribution,
 *   Medical, Charging station, Laundry, Shower, Cleanup staging,
 *   Government office, Volunteer hub, Donation drop-off, Other
 *
 * Valid statuses: Open, Limited, Closed, Unknown
 *
 * Notes:
 * - is_visible defaults to false (manual review before publishing)
 * - Duplicates are NOT checked — run against a clean table or check manually
 * - source_url tracks where the data came from
 * - Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const VALID_CATEGORIES = [
  'Shelter', 'Food distribution', 'Water distribution',
  'Supply distribution', 'Medical', 'Charging station',
  'Laundry', 'Shower', 'Cleanup staging', 'Government office',
  'Volunteer hub', 'Donation drop-off', 'Other',
]

const VALID_STATUSES = ['Open', 'Limited', 'Closed', 'Unknown']

interface HubInput {
  name: string
  island: string
  area: string
  category: string
  status?: string
  hours?: string | null
  notes?: string | null
  public_phone?: string | null
  public_email?: string | null
  address?: string | null
  source_url?: string | null
  is_visible?: boolean
}

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: npx tsx scripts/import-hubs.ts <path-to-json>')
    process.exit(1)
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  let data: HubInput[]
  try {
    const raw = readFileSync(file, 'utf-8')
    data = JSON.parse(raw)
    if (!Array.isArray(data)) throw new Error('Expected a JSON array')
  } catch (err) {
    console.error(`Error reading file: ${err}`)
    process.exit(1)
  }

  console.log(`Importing ${data.length} hubs...`)

  let imported = 0
  let skipped = 0

  for (const hub of data) {
    // Validate required fields
    if (!hub.name || !hub.island || !hub.area || !hub.category) {
      console.warn(`Skipping: missing required field — ${JSON.stringify(hub).slice(0, 80)}`)
      skipped++
      continue
    }

    if (!VALID_CATEGORIES.includes(hub.category)) {
      console.warn(`Skipping: invalid category "${hub.category}" — ${hub.name}`)
      skipped++
      continue
    }

    const status = hub.status || 'Unknown'
    if (!VALID_STATUSES.includes(status)) {
      console.warn(`Skipping: invalid status "${status}" — ${hub.name}`)
      skipped++
      continue
    }

    const { error } = await supabase.from('help_hubs').insert({
      name: hub.name,
      island: hub.island,
      area: hub.area,
      category: hub.category,
      status,
      hours: hub.hours || null,
      notes: hub.notes || null,
      public_phone: hub.public_phone || null,
      public_email: hub.public_email || null,
      address: hub.address || null,
      source_url: hub.source_url || null,
      is_visible: hub.is_visible ?? false,
      last_verified_at: new Date().toISOString(),
    })

    if (error) {
      console.error(`Error inserting "${hub.name}": ${error.message}`)
      skipped++
    } else {
      imported++
    }
  }

  console.log(`Done. Imported: ${imported}, Skipped: ${skipped}`)
  if (imported > 0) {
    console.log('Note: Imported hubs default to is_visible=false. Set them visible in the dashboard.')
  }
}

main()
