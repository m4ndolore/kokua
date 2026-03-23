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

export async function updateRequestStatus(id: string, status: string) {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('help_requests')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Failed to update request status:', error)
    return false
  }
  return true
}

export async function updateOfferStatus(id: string, status: string) {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('help_offers')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Failed to update offer status:', error)
    return false
  }
  return true
}

export async function updateCoordinatorNotes(
  table: 'help_requests' | 'help_offers',
  id: string,
  notes: string
) {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from(table)
    .update({ coordinator_notes: notes })
    .eq('id', id)

  if (error) {
    console.error('Failed to update coordinator notes:', error)
    return false
  }
  return true
}
