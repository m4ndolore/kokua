import { supabase } from '@/lib/supabase'
import type { HelpHub, PublicNeedSummary } from '@/lib/types'
import { FindHelpContent } from './find-help-content'

export const dynamic = 'force-dynamic'

export default async function FindHelp() {
  // Anon client can only read visibility_status='public' rows via RLS
  const [hubsRes, summariesRes] = await Promise.all([
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
  ])

  const hubs = (hubsRes?.data ?? []) as HelpHub[]
  const summaries = (summariesRes?.data ?? []) as PublicNeedSummary[]

  return <FindHelpContent hubs={hubs} summaries={summaries} />
}
