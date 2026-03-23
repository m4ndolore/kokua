import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const HUB_CATEGORY_MAP = {
  evacuation_center: 'Shelter',
  shelter: 'Shelter',
  food_distribution: 'Food distribution',
  water_distribution: 'Water distribution',
  supply_distribution: 'Supply distribution',
  help_center: 'Government office',
  volunteer_coordination: 'Volunteer hub',
  donation_dropoff: 'Donation drop-off',
  other: 'Other',
}

const HUB_STATUS_MAP = {
  active: 'Open',
  likely_closed: 'Closed',
  unknown: 'Unknown',
}

const NEED_CATEGORY_MAP = {
  volunteers: 'Volunteers needed',
  donations: 'Donations needed',
  food: 'Supplies needed',
  water: 'Supplies needed',
  other: 'General',
}

const NEED_URGENCY_MAP = {
  urgent: 'Urgent',
  soon: 'High',
}

const ISLAND_MAP = {
  Oahu: 'Oʻahu',
  Oʻahu: 'Oʻahu',
  Oʿahu: 'Oʻahu',
  Molokai: 'Molokaʻi',
}

function normalizeIsland(value) {
  if (!value) return null
  return ISLAND_MAP[value] || value
}

function normalizeVisibility(record) {
  if (record.visibility_status) return record.visibility_status
  if (typeof record.is_public === 'boolean') return record.is_public ? 'public' : 'review'
  return 'review'
}

function normalizeHubCategory(resourceType) {
  return HUB_CATEGORY_MAP[resourceType] || 'Other'
}

function normalizeHubStatus(status) {
  return HUB_STATUS_MAP[status] || 'Unknown'
}

function normalizeNeedCategory(category) {
  return NEED_CATEGORY_MAP[category] || 'General'
}

function normalizeNeedUrgency(urgency) {
  return NEED_URGENCY_MAP[urgency] || 'Normal'
}

function normalizeRecommendedAction(action) {
  switch ((action || '').toLowerCase()) {
    case 'volunteer':
      return 'Direct users to current volunteer opportunities.'
    case 'check_updates':
      return 'Keep public copy brief and direct users to the source for the latest updates.'
    case 'go_to_hub':
      return 'Prefer linking users to the primary organization page or resource hub.'
    default:
      return action || null
  }
}

function normalizeTextArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return []
}

function joinNotes(...parts) {
  return parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join('\n\n') || null
}

function getClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_API_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_API_KEY are required.')
  }
  return createClient(url, key)
}

async function ensureSource(supabase, source, externalSourceMap) {
  if (!source?.name || !source?.source_type) return null

  const { data: existing, error: existingError } = await supabase
    .from('source_registry')
    .select('id')
    .eq('name', source.name)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('source_registry')
      .update({
        source_type: source.source_type,
        platform: source.platform || null,
        base_url: source.base_url || null,
        organization: source.organization || null,
        trust_level: source.trust_level || 'medium',
        update_frequency: source.update_frequency || 'unknown',
        strategy: source.strategy || 'monitor',
        is_active: source.is_active ?? true,
        notes: source.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    if (updateError) throw updateError
    if (source.external_id) externalSourceMap.set(source.external_id, existing.id)
    return existing.id
  }

  const { data, error } = await supabase
    .from('source_registry')
    .insert({
      name: source.name,
      source_type: source.source_type,
      platform: source.platform || null,
      base_url: source.base_url || null,
      organization: source.organization || null,
      trust_level: source.trust_level || 'medium',
      update_frequency: source.update_frequency || 'unknown',
      strategy: source.strategy || 'monitor',
      is_active: source.is_active ?? true,
      notes: source.notes || null,
    })
    .select('id')
    .single()

  if (error) throw error
  if (source.external_id) externalSourceMap.set(source.external_id, data.id)
  return data.id
}

async function ensureSignal(supabase, signal, externalSourceMap) {
  const sourceRegistryId = signal.source_external_id
    ? externalSourceMap.get(signal.source_external_id) || null
    : null

  const title = signal.title || signal.derived_resource_name || null
  const rawUrl = signal.raw_url || null

  const query = supabase
    .from('source_signals')
    .select('id')
    .eq('title', title)

  if (rawUrl) query.eq('raw_url', rawUrl)
  else query.is('raw_url', null)

  if (sourceRegistryId) query.eq('source_registry_id', sourceRegistryId)
  else query.is('source_registry_id', null)

  const { data: existing, error: existingError } = await query.maybeSingle()
  if (existingError) throw existingError
  const confidence = signal.confidence || 'medium'
  const needsReview = signal.needs_review ?? true
  const payload = {
    source_registry_id: sourceRegistryId,
    title,
    signal_type: signal.signal_type,
    raw_url: rawUrl,
    raw_text: signal.raw_text || signal.raw_text_summary || null,
    raw_payload: signal.raw_payload || null,
    island: normalizeIsland(signal.island),
    area: signal.area || null,
    neighborhood: signal.neighborhood || null,
    derived_resource_name: signal.derived_resource_name || null,
    derived_resource_type: signal.derived_resource_type || null,
    derived_status: signal.derived_status || 'unknown',
    confidence,
    freshness_score: signal.freshness_score ?? null,
    last_observed_at: signal.last_observed_at || new Date().toISOString(),
    needs_review: needsReview,
    review_reason: signal.review_reason || (needsReview ? 'Imported from data-raw seed' : null),
    review_status: needsReview ? 'pending' : 'approved',
    coordinator_notes: signal.suggested_action || null,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('source_signals')
      .update(payload)
      .eq('id', existing.id)
    if (updateError) throw updateError
    return existing.id
  }

  const { data, error } = await supabase
    .from('source_signals')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function ensureHub(supabase, hub) {
  const island = normalizeIsland(hub.island)
  const area = hub.area || hub.neighborhood || island || 'Unknown area'
  const name = hub.name

  const { data: existing, error: existingError } = await supabase
    .from('help_hubs')
    .select('id')
    .eq('name', name)
    .eq('island', island)
    .eq('area', area)
    .maybeSingle()

  if (existingError) throw existingError
  const payload = {
    name,
    island,
    area,
    category: normalizeHubCategory(hub.resource_type),
    status: normalizeHubStatus(hub.status),
    hours: hub.hours || null,
    notes: hub.description || null,
    public_phone: hub.public_phone || null,
    public_email: hub.public_email || null,
    address: hub.address || null,
    source_name: hub.source_name || hub.organization || null,
    source_type: hub.source_type || null,
    source_url: hub.source_url || null,
    confidence: hub.confidence || 'medium',
    last_verified_at: hub.last_verified_at || new Date().toISOString(),
    visibility_status: normalizeVisibility(hub),
    coordinator_notes: hub.notes || null,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('help_hubs')
      .update(payload)
      .eq('id', existing.id)
    if (updateError) throw updateError
    return existing.id
  }

  const { data, error } = await supabase
    .from('help_hubs')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function ensureSummary(supabase, summary) {
  const island = normalizeIsland(summary.island) || 'Statewide'
  const area = summary.area || null

  const { data: existing, error: existingError } = await supabase
    .from('public_need_summaries')
    .select('id')
    .eq('title', summary.title)
    .eq('island', island)
    .maybeSingle()

  if (existingError) throw existingError
  const payload = {
    island,
    area,
    title: summary.title,
    description: summary.description,
    category: normalizeNeedCategory(summary.category),
    urgency: normalizeNeedUrgency(summary.urgency),
    source_name: summary.source_name || null,
    source_type: summary.source_type || null,
    source_url: summary.source_url || null,
    confidence: summary.confidence || 'medium',
    last_verified_at: summary.last_verified_at || new Date().toISOString(),
    visibility_status: normalizeVisibility(summary),
    coordinator_notes: normalizeRecommendedAction(summary.recommended_action),
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('public_need_summaries')
      .update(payload)
      .eq('id', existing.id)
    if (updateError) throw updateError
    return existing.id
  }

  const { data, error } = await supabase
    .from('public_need_summaries')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function ensureDonationLink(supabase, donation) {
  const externalId = donation.external_id
  if (!externalId) return null

  const { data: existing, error: existingError } = await supabase
    .from('donation_links')
    .select('id')
    .eq('external_id', externalId)
    .maybeSingle()

  if (existingError) throw existingError
  const payload = {
    external_id: externalId,
    title: donation.title,
    organization: donation.organization || null,
    donation_type: donation.donation_type,
    description: donation.description || null,
    island: normalizeIsland(donation.island),
    area: donation.area || null,
    neighborhood: donation.neighborhood || null,
    address: donation.address || null,
    hours: donation.hours || null,
    destination_url: donation.destination_url,
    source_name: donation.source_name || null,
    source_type: donation.source_type || null,
    source_url: donation.source_url || null,
    confidence: donation.confidence || 'medium',
    trust_score: donation.trust_score ?? null,
    badges: normalizeTextArray(donation.badges),
    flags: normalizeTextArray(donation.flags),
    last_verified_at: donation.last_verified_at || new Date().toISOString(),
    is_visible: donation.is_visible ?? false,
    needs_review: donation.needs_review ?? true,
    review_reason: donation.review_reason || null,
    tags: normalizeTextArray(donation.tags),
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('donation_links')
      .update(payload)
      .eq('id', existing.id)
    if (updateError) throw updateError
    return existing.id
  }

  const { data, error } = await supabase
    .from('donation_links')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function main() {
  const files = process.argv.slice(2)
  if (files.length === 0) {
    console.error('Usage: node scripts/import-data-raw.mjs <data-raw/*.json> [...]')
    process.exit(1)
  }

  const supabase = getClient()
  const externalSourceMap = new Map()
  const counts = {
    sources: 0,
    signals: 0,
    hubs: 0,
    summaries: 0,
    donationLinks: 0,
    skippedReviewQueueItems: 0,
  }

  for (const file of files) {
    const raw = JSON.parse(readFileSync(file, 'utf8'))
    const seed = raw.seed_json || {}
    console.log(`Processing ${file}`)

    for (const source of seed.source_registry || []) {
      await ensureSource(supabase, source, externalSourceMap)
      counts.sources += 1
    }

    for (const signal of seed.source_signals || []) {
      await ensureSignal(supabase, signal, externalSourceMap)
      counts.signals += 1
    }

    for (const hub of seed.help_hubs || []) {
      await ensureHub(supabase, hub)
      counts.hubs += 1
    }

    for (const summary of seed.public_need_summaries || []) {
      await ensureSummary(supabase, summary)
      counts.summaries += 1
    }

    for (const donation of seed.donation_links || []) {
      await ensureDonationLink(supabase, donation)
      counts.donationLinks += 1
    }

    if (Array.isArray(seed.review_queue) && seed.review_queue.length > 0) {
      counts.skippedReviewQueueItems += seed.review_queue.length
      console.warn(`Skipped ${seed.review_queue.length} legacy review_queue items from ${file}; shape does not match current review_queue_items schema.`)
    }
  }

  console.log('Import summary:', counts)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
