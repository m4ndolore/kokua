/**
 * Kōkua Hub — Import Source Registry entries from JSON
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SECRET_API_KEY=... npx tsx scripts/import-sources.ts data/sources.json
 *
 * Input format: see scripts/sample-sources.json
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const VALID_TYPES = ['official', 'nonprofit', 'news', 'social', 'community', 'internal', 'other']
const VALID_TRUST = ['high', 'medium', 'low']

interface SourceInput {
  name: string; source_type: string; platform?: string; base_url?: string
  organization?: string; trust_level?: string; update_frequency?: string
  strategy?: string; notes?: string
}

async function main() {
  const file = process.argv[2]
  if (!file) { console.error('Usage: npx tsx scripts/import-sources.ts <path>'); process.exit(1) }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_API_KEY
  if (!url || !key) { console.error('SUPABASE_URL and SUPABASE_SECRET_API_KEY required.'); process.exit(1) }

  const supabase = createClient(url, key)
  let data: SourceInput[]
  try {
    data = JSON.parse(readFileSync(file, 'utf-8'))
    if (!Array.isArray(data)) throw new Error('Expected JSON array')
  } catch (err) { console.error(`Error: ${err}`); process.exit(1) }

  console.log(`Importing ${data.length} sources...`)
  let imported = 0, skipped = 0

  for (const src of data) {
    if (!src.name || !src.source_type) { console.warn(`Skip: missing name or type — ${src.name || '?'}`); skipped++; continue }
    if (!VALID_TYPES.includes(src.source_type)) { console.warn(`Skip: bad type "${src.source_type}" — ${src.name}`); skipped++; continue }

    const { error } = await supabase.from('source_registry').insert({
      name: src.name, source_type: src.source_type,
      platform: src.platform || null, base_url: src.base_url || null,
      organization: src.organization || null,
      trust_level: src.trust_level || 'medium',
      update_frequency: src.update_frequency || 'unknown',
      strategy: src.strategy || 'monitor',
      notes: src.notes || null,
    })

    if (error) { console.error(`Error "${src.name}": ${error.message}`); skipped++ }
    else imported++
  }

  console.log(`Done. Imported: ${imported}, Skipped: ${skipped}`)
}

main()
