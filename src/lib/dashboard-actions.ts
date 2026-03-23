'use server'

import { requireDashboardUser, setDashboardAuth, clearDashboardAuth } from './auth'
import { getServiceClient } from './supabase'
import { redirect } from 'next/navigation'
import type { FormState } from './actions'

async function requireCoordinatorAccess() {
  await requireDashboardUser('coordinator', 'admin')
}

async function requireAdminAccess() {
  await requireDashboardUser('admin')
}

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  if (!email || !password) return { success: false, error: 'Please enter your email and password.' }

  const valid = await setDashboardAuth(email, password)
  if (!valid) return { success: false, error: 'Invalid login.' }

  redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
  await clearDashboardAuth()
  redirect('/dashboard/login')
}

// ============================================================
// Generic status and notes updates (coordinator + admin)
// ============================================================

export async function updateStatus(
  table: 'help_requests' | 'help_offers' | 'volunteers',
  id: string,
  status: string
) {
  await requireCoordinatorAccess()
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
  await requireCoordinatorAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from(table).update({ coordinator_notes: notes }).eq('id', id)
  if (error) { console.error(`Failed to update ${table} notes:`, error); return false }
  return true
}

// ============================================================
// Help Hub management
// ============================================================

export async function updateHubStatus(id: string, status: string) {
  await requireCoordinatorAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('help_hubs')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('Failed to update hub status:', error); return false }
  return true
}

export async function updateHubVisibility(id: string, visibility: string) {
  await requireCoordinatorAccess()
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
  await requireCoordinatorAccess()
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
  await requireCoordinatorAccess()
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
  await requireCoordinatorAccess()
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
  await requireCoordinatorAccess()
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
  await requireCoordinatorAccess()
  const hubId = await createHub({ ...hubData, visibility_status: 'review' })
  if (!hubId) return null

  const supabase = getServiceClient()
  await supabase.from('review_queue_items')
    .update({ status: 'Approved', promoted_hub_id: hubId, reviewed_at: new Date().toISOString() })
    .eq('id', reviewItemId)

  return hubId
}

export async function promoteToSummary(reviewItemId: string, summaryData: {
  island: string; title: string; description: string; category: string; urgency: string;
  area?: string; source_name?: string; source_type?: string; source_url?: string;
  confidence?: string;
}) {
  await requireCoordinatorAccess()
  const summaryId = await createNeedSummary({ ...summaryData, visibility_status: 'review' })
  if (!summaryId) return null

  const supabase = getServiceClient()
  await supabase.from('review_queue_items')
    .update({ status: 'Approved', promoted_summary_id: summaryId, reviewed_at: new Date().toISOString() })
    .eq('id', reviewItemId)

  return summaryId
}

// ============================================================
// Source Signal management (coordinator + admin)
// ============================================================

export async function updateSignalReview(
  id: string,
  reviewStatus: string,
  notes: string
) {
  await requireCoordinatorAccess()
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
  await requireCoordinatorAccess()
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
  await requireCoordinatorAccess()
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
  await requireAdminAccess()
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
  await requireAdminAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('source_registry')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('Failed to update source active:', error); return false }
  return true
}

// ============================================================
// Donation Link management (coordinator + admin)
// ============================================================

export async function updateDonationVisibility(id: string, isVisible: boolean) {
  await requireCoordinatorAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('donation_links')
    .update({ is_visible: isVisible, needs_review: false, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('Failed to update donation visibility:', error); return false }
  return true
}

export async function updateDonationReview(id: string, needsReview: boolean, reviewReason: string) {
  await requireCoordinatorAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('donation_links')
    .update({ needs_review: needsReview, review_reason: reviewReason, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('Failed to update donation review:', error); return false }
  return true
}

export async function approveDonation(id: string) {
  await requireCoordinatorAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('donation_links')
    .update({
      is_visible: true,
      needs_review: false,
      review_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) { console.error('Failed to approve donation:', error); return false }
  return true
}

export async function hideDonation(id: string, reason: string) {
  await requireCoordinatorAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('donation_links')
    .update({
      is_visible: false,
      needs_review: true,
      review_reason: reason || 'Hidden by coordinator',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) { console.error('Failed to hide donation:', error); return false }
  return true
}

export async function updateDonationFlags(id: string, flags: string[]) {
  await requireCoordinatorAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('donation_links')
    .update({ flags, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('Failed to update donation flags:', error); return false }
  return true
}

export async function updateDonationTrustScore(id: string, trustScore: number) {
  await requireCoordinatorAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('donation_links')
    .update({ trust_score: trustScore, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('Failed to update donation trust score:', error); return false }
  return true
}

// ============================================================
// Bulk operations (coordinator + admin)
// ============================================================

export async function bulkUpdateHubVisibility(ids: string[], visibility: string) {
  await requireCoordinatorAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('help_hubs')
    .update({ visibility_status: visibility, updated_at: new Date().toISOString() })
    .in('id', ids)
  if (error) { console.error('Bulk hub visibility error:', error); return false }
  return true
}

export async function bulkApproveDonations(ids: string[]) {
  await requireCoordinatorAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('donation_links')
    .update({ is_visible: true, needs_review: false, review_reason: null, updated_at: new Date().toISOString() })
    .in('id', ids)
  if (error) { console.error('Bulk donation approve error:', error); return false }
  return true
}

export async function bulkHideDonations(ids: string[]) {
  await requireCoordinatorAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('donation_links')
    .update({ is_visible: false, needs_review: true, review_reason: 'Bulk hidden by coordinator', updated_at: new Date().toISOString() })
    .in('id', ids)
  if (error) { console.error('Bulk donation hide error:', error); return false }
  return true
}

export async function bulkUpdateReviewStatus(ids: string[], status: string) {
  await requireCoordinatorAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('review_queue_items')
    .update({ status, reviewed_at: new Date().toISOString() })
    .in('id', ids)
  if (error) { console.error('Bulk review status error:', error); return false }
  return true
}

// ============================================================
// Admin-only: User management
// ============================================================

export async function createDashboardUser(formData: FormData) {
  await requireAdminAccess()
  const supabase = getServiceClient()
  const { data, error } = await supabase.from('dashboard_users').insert({
    email: formData.get('email') as string,
    name: formData.get('name') as string,
    role: formData.get('role') as string,
  }).select('*').single()
  if (error) { console.error('Failed to create dashboard user:', error); return null }
  return data
}

export async function toggleUserActive(id: string, isActive: boolean) {
  await requireAdminAccess()
  const supabase = getServiceClient()
  const { error } = await supabase.from('dashboard_users')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) { console.error('Failed to toggle user active:', error); return false }
  return true
}

// ============================================================
// GitHub Issue Bridge
// ============================================================

const GITHUB_SAFE_CATEGORIES = ['bug', 'feature_request', 'suggest_resource']

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'bug',
  feature_request: 'enhancement',
  suggest_resource: 'enhancement',
}

export async function createGitHubIssue(reviewItemId: string): Promise<{ url: string; number: number } | null> {
  await requireCoordinatorAccess()

  const token = process.env.GITHUB_TOKEN
  if (!token) { console.error('GITHUB_TOKEN not configured'); return null }

  const supabase = getServiceClient()
  const { data: item } = await supabase.from('review_queue_items')
    .select('*')
    .eq('id', reviewItemId)
    .single()

  if (!item) { console.error('Review item not found'); return null }
  if (item.github_issue_url) { return { url: item.github_issue_url, number: item.github_issue_number } }
  if (!item.feedback_category || !GITHUB_SAFE_CATEGORIES.includes(item.feedback_category)) {
    console.error('Category not safe for GitHub'); return null
  }

  // Sanitize: no personal data (contact info) in the issue
  const title = item.feedback_category === 'bug'
    ? `Bug: ${(item.feedback_message ?? '').slice(0, 80)}`
    : item.feedback_category === 'feature_request'
      ? `Feature: ${(item.feedback_message ?? '').slice(0, 80)}`
      : `Resource suggestion: ${(item.feedback_message ?? '').slice(0, 80)}`

  const body = [
    `**Category:** ${item.feedback_category}`,
    item.feedback_page_url ? `**Page:** ${item.feedback_page_url}` : null,
    '',
    item.feedback_message ?? '',
    '',
    `---`,
    `_Created from Kōkua Hub feedback (review queue item)_`,
  ].filter(Boolean).join('\n')

  const labels = [CATEGORY_LABELS[item.feedback_category] ?? 'enhancement', 'agent-ready']

  const repo = process.env.GITHUB_REPO ?? 'm4ndolore/kokua'
  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body, labels }),
  })

  if (!res.ok) {
    console.error('GitHub API error:', res.status, await res.text())
    return null
  }

  const issue = await res.json() as { html_url: string; number: number }

  await supabase.from('review_queue_items')
    .update({ github_issue_url: issue.html_url, github_issue_number: issue.number })
    .eq('id', reviewItemId)

  return { url: issue.html_url, number: issue.number }
}
