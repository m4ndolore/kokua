import { redirect } from 'next/navigation'
import { verifyDashboardAuth, isAdmin } from '@/lib/auth'
import { getServiceClient } from '@/lib/supabase'
import { DashboardContent } from './dashboard-content'
import type {
  HelpRequest, HelpOffer, Volunteer,
  HelpHub, PublicNeedSummary, ReviewQueueItem,
  SourceRegistry, SourceSignal, DashboardUser, DonationLink,
} from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const session = await verifyDashboardAuth()
  if (!session.authenticated) {
    redirect('/dashboard/login')
  }

  const supabase = getServiceClient()
  const admin = isAdmin(session)

  const [
    requestsRes, offersRes, volunteersRes,
    hubsRes, summariesRes, reviewRes,
    signalsRes, sourcesRes, usersRes, donationsRes,
  ] = await Promise.all([
    supabase.from('help_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('help_offers').select('*').order('created_at', { ascending: false }),
    supabase.from('volunteers').select('*').order('created_at', { ascending: false }),
    supabase.from('help_hubs').select('*').order('updated_at', { ascending: false }),
    supabase.from('public_need_summaries').select('*').order('updated_at', { ascending: false }),
    supabase.from('review_queue_items').select('*').order('created_at', { ascending: false }),
    supabase.from('source_signals').select('*').order('created_at', { ascending: false }),
    admin
      ? supabase.from('source_registry').select('*').order('name')
      : supabase.from('source_registry').select('id, name, source_type').order('name'),
    admin
      ? supabase.from('dashboard_users').select('*').order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from('donation_links').select('*').order('updated_at', { ascending: false }),
  ])

  return (
    <DashboardContent
      role={session.user.role}
      userName={session.user.name}
      requests={(requestsRes.data ?? []) as HelpRequest[]}
      offers={(offersRes.data ?? []) as HelpOffer[]}
      volunteers={(volunteersRes.data ?? []) as Volunteer[]}
      hubs={(hubsRes.data ?? []) as HelpHub[]}
      summaries={(summariesRes.data ?? []) as PublicNeedSummary[]}
      reviewItems={(reviewRes.data ?? []) as ReviewQueueItem[]}
      signals={(signalsRes.data ?? []) as SourceSignal[]}
      sources={(sourcesRes.data ?? []) as SourceRegistry[]}
      users={(usersRes.data ?? []) as DashboardUser[]}
      donations={(donationsRes.data ?? []) as DonationLink[]}
    />
  )
}
