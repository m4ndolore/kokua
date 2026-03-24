import { supabase } from '@/lib/supabase'
import type { DonationLink, GeoReferenceNode, HelpHub, PublicNeedSummary } from '@/lib/types'
import { MapContent } from './map-content'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const [hubsRes, donationsRes, summariesRes, geoNodesRes] = await Promise.all([
    supabase?.from('help_hubs')
      .select('*')
      .eq('visibility_status', 'public')
      .order('updated_at', { ascending: false }),
    supabase?.from('donation_links')
      .select('*')
      .eq('is_visible', true)
      .order('trust_score', { ascending: false }),
    supabase?.from('public_need_summaries')
      .select('*')
      .eq('visibility_status', 'public')
      .order('updated_at', { ascending: false }),
    supabase?.from('geo_reference_nodes')
      .select('*')
      .eq('is_active', true)
      .order('name'),
  ])

  const hubs = (hubsRes?.data ?? []) as HelpHub[]
  const donations = (donationsRes?.data ?? []) as DonationLink[]
  const summaries = (summariesRes?.data ?? []) as PublicNeedSummary[]
  const geoNodes = (geoNodesRes?.data ?? []) as GeoReferenceNode[]

  return <MapContent hubs={hubs} donations={donations} summaries={summaries} geoNodes={geoNodes} />
}
