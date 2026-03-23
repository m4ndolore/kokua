import { supabase } from '@/lib/supabase'
import type { DonationLink, PublicNeedSummary } from '@/lib/types'
import { CanHelpContent } from './can-help-content'

export const dynamic = 'force-dynamic'

export default async function CanHelp() {
  const [summariesRes, donationsRes] = await Promise.all([
    supabase?.from('public_need_summaries')
      .select('*')
      .eq('visibility_status', 'public')
      .order('urgency')
      .order('created_at', { ascending: false }),
    supabase?.from('donation_links')
      .select('*')
      .eq('is_visible', true)
      .order('trust_score', { ascending: false })
      .limit(6),
  ])

  const summaries = (summariesRes?.data ?? []) as PublicNeedSummary[]
  const donations = (donationsRes?.data ?? []) as DonationLink[]

  return <CanHelpContent summaries={summaries} donations={donations} />
}
