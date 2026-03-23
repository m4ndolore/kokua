import { supabase } from '@/lib/supabase'
import type { DonationLink } from '@/lib/types'
import { DonateContent } from './donate-content'

export const dynamic = 'force-dynamic'

export default async function DonatePage() {
  const res = await supabase?.from('donation_links')
    .select('*')
    .eq('is_visible', true)
    .order('trust_score', { ascending: false })
    .order('confidence')
    .order('last_verified_at', { ascending: false })

  const donations = (res?.data ?? []) as DonationLink[]
  return <DonateContent donations={donations} />
}
