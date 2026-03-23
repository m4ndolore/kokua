import { redirect } from 'next/navigation'
import { verifyDashboardAuth } from '@/lib/auth'
import { getServiceClient } from '@/lib/supabase'
import { DashboardContent } from './dashboard-content'
import type { HelpRequest, HelpOffer } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const authed = await verifyDashboardAuth()
  if (!authed) {
    redirect('/dashboard/login')
  }

  const supabase = getServiceClient()

  const [requestsRes, offersRes] = await Promise.all([
    supabase
      .from('help_requests')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('help_offers')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const requests = (requestsRes.data ?? []) as HelpRequest[]
  const offers = (offersRes.data ?? []) as HelpOffer[]

  return <DashboardContent requests={requests} offers={offers} />
}
