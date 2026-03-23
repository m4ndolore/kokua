'use server'

import { setDashboardAuth } from './auth'
import { getServiceClient } from './supabase'
import { redirect } from 'next/navigation'
import type { FormState } from './actions'

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const password = formData.get('password') as string
  if (!password) return { success: false, error: 'Please enter a password.' }

  const valid = await setDashboardAuth(password)
  if (!valid) return { success: false, error: 'Incorrect password.' }

  redirect('/dashboard')
}

// ============================================================
// Generic status and notes updates (coordinator + admin)
// ============================================================

export async function updateStatus(
  table: 'help_requests' | 'help_offers' | 'volunteers',
  id: string,
  status: string
) {
  const supabase = getServiceClient()
  const { error } = await supabase.from(table).update({ status }).eq('id', id)
  if (error) { console.error(`Failed to update ${table} status:`, error); return false }
  return true
}

export async function updateCoordinatorNotes(
  table: 'help_requests' | 'help_offers' | 'volunteers' | 'help_hubs' | 'public_need_summaries' | 'source_signals',
  id: string,
  notes: string
) {
  const supabase = getServiceClient()
  const { error } = await supabase.from(table).update({ coordinator_notes: notes }).eq('id', id)
  if (error) { console.error(`Failed to update ${table} notes:`, error); return false }
  return true
}

// ============================================================
// Help Hub management
// ============================================================

export async function updateHubStatus(id: string, status: string) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('help_hubs')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('Failed to update hub status:', error); return false }
  return true
}

export async function updateHubVisibility(id: string, visibility: string) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('help_hubs')
    .update({ visibility_status: visibility, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('Failed to update hub visibility:', error); return false }
  return true
}

export async function createHub(data: {
  name: string; island: string; area: string; category: string;
  status?: string; hours?: string; notes?: string;
  public_phone?: string; public_email?: string; address?: string;
  source_name?: string; source_type?: string; source_url?: string;
  source_registry_id?: string; confidence?: string; visibility_status?: string;
}) {
  const supabase = getServiceClient()
  const { data: hub, error } = await supabase.from('help_hubs').insert({
    ...data,
    status: data.status || 'Open',
    confidence: data.confidence || 'medium',
    visibility_status: data.visibility_status || 'review',
    last_verified_at: new Date().toISOString(),
  }).select('id').single()
  if (error) { console.error('Failed to create hub:', error); return null }
  return hub?.id ?? null
}

// ============================================================
// Need Summary management
// ============================================================

export async function updateSummaryVisibility(id: string, visibility: string) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('public_need_summaries')
    .update({ visibility_status: visibility, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('Failed to update summary visibility:', error); return false }
  return true
}

export async function createNeedSummary(data: {
  island: string; title: string; description: string; category: string; urgency: string;
  area?: string; source_name?: string; source_type?: string; source_url?: string;
  source_registry_id?: string; confidence?: string; visibility_status?: string;
}) {
  const supabase = getServiceClient()
  const { data: summary, error } = await supabase.from('public_need_summaries').insert({
    ...data,
    confidence: data.confidence || 'medium',
    visibility_status: data.visibility_status || 'review',
    last_verified_at: new Date().toISOString(),
  }).select('id').single()
  if (error) { console.error('Failed to create summary:', error); return null }
  return summary?.id ?? null
}

// ============================================================
// Review Queue management
// ============================================================

export async function updateReviewItemStatus(id: string, status: string, reviewerNotes: string) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('review_queue_items')
    .update({ status, reviewer_notes: reviewerNotes, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('Failed to update review item:', error); return false }
  return true
}

export async function promoteToHub(reviewItemId: string, hubData: {
  name: string; island: string; area: string; category: string;
  notes?: string; public_phone?: string; address?: string;
  source_name?: string; source_type?: string; source_url?: string;
  source_registry_id?: string; confidence?: string;
}) {
  const hubId = await createHub({ ...hubData, visibility_status: 'review' })
  if (!hubId) return false

  const supabase = getServiceClient()
  await supabase.from('review_queue_items')
    .update({ status: 'Approved', promoted_hub_id: hubId, reviewed_at: new Date().toISOString() })
    .eq('id', reviewItemId)

  return true
}

export async function promoteToSummary(reviewItemId: string, summaryData: {
  island: string; title: string; description: string; category: string; urgency: string;
  area?: string; source_name?: string; source_type?: string; source_url?: string;
  confidence?: string;
}) {
  const summaryId = await createNeedSummary({ ...summaryData, visibility_status: 'review' })
  if (!summaryId) return false

  const supabase = getServiceClient()
  await supabase.from('review_queue_items')
    .update({ status: 'Approved', promoted_summary_id: summaryId, reviewed_at: new Date().toISOString() })
    .eq('id', reviewItemId)

  return true
}

// ============================================================
// Source Signal management (coordinator + admin)
// ============================================================

export async function updateSignalReview(
  id: string,
  reviewStatus: string,
  notes: string
) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('source_signals')
    .update({
      review_status: reviewStatus,
      coordinator_notes: notes,
      needs_review: reviewStatus === 'pending',
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) { console.error('Failed to update signal review:', error); return false }
  return true
}

export async function linkSignalToHub(signalId: string, hubId: string) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('source_signals')
    .update({ linked_help_hub_id: hubId, updated_at: new Date().toISOString() })
    .eq('id', signalId)
  if (error) { console.error('Failed to link signal to hub:', error); return false }
  return true
}

export async function createHubFromSignal(signalId: string, hubData: {
  name: string; island: string; area: string; category: string;
  notes?: string; public_phone?: string; address?: string;
  source_name?: string; source_type?: string; source_url?: string;
  source_registry_id?: string; confidence?: string;
}) {
  const hubId = await createHub({ ...hubData, visibility_status: 'review' })
  if (!hubId) return false

  await linkSignalToHub(signalId, hubId)
  await updateSignalReview(signalId, 'approved', '')
  return true
}

// ============================================================
// Source Registry management (admin only)
// ============================================================

export async function createSource(data: {
  name: string; source_type: string; platform?: string; base_url?: string;
  organization?: string; trust_level?: string; update_frequency?: string;
  strategy?: string; notes?: string;
}) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('source_registry').insert({
    ...data,
    trust_level: data.trust_level || 'medium',
    update_frequency: data.update_frequency || 'unknown',
    strategy: data.strategy || 'monitor',
  })
  if (error) { console.error('Failed to create source:', error); return false }
  return true
}

export async function updateSourceActive(id: string, isActive: boolean) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('source_registry')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('Failed to update source active:', error); return false }
  return true
}

// ============================================================
// Admin-only: User management
// ============================================================

export async function createDashboardUser(formData: FormData) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('dashboard_users').insert({
    email: formData.get('email') as string,
    name: formData.get('name') as string,
    role: formData.get('role') as string,
  })
  if (error) { console.error('Failed to create dashboard user:', error); return false }
  return true
}

export async function toggleUserActive(id: string, isActive: boolean) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('dashboard_users')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) { console.error('Failed to toggle user active:', error); return false }
  return true
}
