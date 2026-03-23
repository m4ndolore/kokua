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
  if (!password) {
    return { success: false, error: 'Please enter a password.' }
  }

  const valid = await setDashboardAuth(password)
  if (!valid) {
    return { success: false, error: 'Incorrect password.' }
  }

  redirect('/dashboard')
}

// ============================================================
// Status updates (coordinator + admin)
// ============================================================

export async function updateStatus(
  table: 'help_requests' | 'help_offers' | 'volunteers',
  id: string,
  status: string
) {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from(table)
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error(`Failed to update ${table} status:`, error)
    return false
  }
  return true
}

export async function updateCoordinatorNotes(
  table: 'help_requests' | 'help_offers' | 'volunteers' | 'help_hubs' | 'public_need_summaries',
  id: string,
  notes: string
) {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from(table)
    .update({ coordinator_notes: notes })
    .eq('id', id)

  if (error) {
    console.error(`Failed to update ${table} notes:`, error)
    return false
  }
  return true
}

// ============================================================
// Help Hub management (coordinator + admin)
// ============================================================

export async function updateHubStatus(id: string, status: string) {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('help_hubs')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Failed to update hub status:', error)
    return false
  }
  return true
}

export async function updateHubVisibility(id: string, isVisible: boolean) {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('help_hubs')
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Failed to update hub visibility:', error)
    return false
  }
  return true
}

export async function createHub(formData: FormData) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('help_hubs').insert({
    name: formData.get('name') as string,
    island: formData.get('island') as string,
    area: formData.get('area') as string,
    category: formData.get('category') as string,
    status: formData.get('status') as string || 'Open',
    hours: formData.get('hours') as string || null,
    notes: formData.get('notes') as string || null,
    public_phone: formData.get('public_phone') as string || null,
    public_email: formData.get('public_email') as string || null,
    address: formData.get('address') as string || null,
    source_url: formData.get('source_url') as string || null,
    is_visible: formData.get('is_visible') === 'on',
  })

  if (error) {
    console.error('Failed to create hub:', error)
    return false
  }
  return true
}

// ============================================================
// Need Summary management (coordinator + admin)
// ============================================================

export async function updateSummaryVisibility(id: string, isVisible: boolean) {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('public_need_summaries')
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Failed to update summary visibility:', error)
    return false
  }
  return true
}

export async function createNeedSummary(formData: FormData) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('public_need_summaries').insert({
    island: formData.get('island') as string,
    area: formData.get('area') as string || null,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    category: formData.get('category') as string,
    urgency: formData.get('urgency') as string,
    is_visible: formData.get('is_visible') === 'on',
  })

  if (error) {
    console.error('Failed to create need summary:', error)
    return false
  }
  return true
}

// ============================================================
// Review Queue management (coordinator + admin)
// ============================================================

export async function updateReviewItemStatus(id: string, status: string, reviewerNotes: string) {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('review_queue_items')
    .update({ status, reviewer_notes: reviewerNotes })
    .eq('id', id)

  if (error) {
    console.error('Failed to update review item:', error)
    return false
  }
  return true
}

export async function promoteToHub(reviewItemId: string, formData: FormData) {
  const supabase = getServiceClient()

  // Create the hub
  const { data: hub, error: hubError } = await supabase.from('help_hubs').insert({
    name: formData.get('name') as string,
    island: formData.get('island') as string,
    area: formData.get('area') as string,
    category: formData.get('category') as string,
    status: 'Open',
    notes: formData.get('notes') as string || null,
    public_phone: formData.get('public_phone') as string || null,
    address: formData.get('address') as string || null,
    is_visible: false,
  }).select('id').single()

  if (hubError || !hub) {
    console.error('Failed to create hub from review item:', hubError)
    return false
  }

  // Update the review item
  const { error: reviewError } = await supabase
    .from('review_queue_items')
    .update({ status: 'Approved', promoted_hub_id: hub.id })
    .eq('id', reviewItemId)

  if (reviewError) {
    console.error('Failed to update review item after promotion:', reviewError)
  }

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

  if (error) {
    console.error('Failed to create dashboard user:', error)
    return false
  }
  return true
}

export async function toggleUserActive(id: string, isActive: boolean) {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('dashboard_users')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    console.error('Failed to toggle user active:', error)
    return false
  }
  return true
}
