import { supabase } from '@/lib/supabase'
import type { DonationLink, HelpHub, PublicNeedSummary } from '@/lib/types'
import { FindHelpContent } from './find-help-content'

export const dynamic = 'force-dynamic'

export default async function FindHelp() {
  // Anon client can only read visibility_status='public' rows via RLS
  const [hubsRes, summariesRes, donationsRes] = await Promise.all([
    supabase?.from('help_hubs')
      .select('*')
      .eq('visibility_status', 'public')
      .order('island')
      .order('category'),
    supabase?.from('public_need_summaries')
      .select('*')
      .eq('visibility_status', 'public')
      .order('urgency')
      .order('created_at', { ascending: false }),
    supabase?.from('donation_links')
      .select('*')
      .eq('is_visible', true)
      .order('trust_score', { ascending: false })
      .limit(4),
  ])

  const hubs = (hubsRes?.data ?? []) as HelpHub[]
  const summaries = (summariesRes?.data ?? []) as PublicNeedSummary[]
  const donations = (donationsRes?.data ?? []) as DonationLink[]

  return <FindHelpContent hubs={hubs} summaries={summaries} donations={donations} />
}
