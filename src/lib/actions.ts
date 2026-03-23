'use server'

import { supabase, getServiceClient } from './supabase'

export type FormState = {
  success: boolean
  error: string | null
}

export async function submitRequest(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const island = formData.get('island') as string
  const neighborhood = formData.get('neighborhood') as string
  const needTypes = formData.getAll('need_types') as string[]
  const urgency = formData.get('urgency') as string
  const contactMethod = formData.get('contact_method') as string
  const contactValue = formData.get('contact_value') as string
  const note = formData.get('note') as string || null
  const canBeContacted = formData.get('can_be_contacted') === 'on'

  if (!island || !neighborhood || needTypes.length === 0 || !urgency || !contactMethod || !contactValue) {
    return { success: false, error: 'Please fill in all required fields.' }
  }

  const { error } = await supabase.from('help_requests').insert({
    island, neighborhood, need_types: needTypes, urgency,
    contact_method: contactMethod, contact_value: contactValue,
    note, can_be_contacted: canBeContacted,
  })

  if (error) {
    console.error('Request submission error:', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
  return { success: true, error: null }
}

export async function submitOffer(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const island = formData.get('island') as string
  const neighborhood = formData.get('neighborhood') as string
  const offerTypes = formData.getAll('offer_types') as string[]
  const availability = formData.get('availability') as string
  const contactMethod = formData.get('contact_method') as string
  const contactValue = formData.get('contact_value') as string
  const note = formData.get('note') as string || null
  const capacity = formData.get('capacity') as string || null

  if (!island || !neighborhood || offerTypes.length === 0 || !availability || !contactMethod || !contactValue) {
    return { success: false, error: 'Please fill in all required fields.' }
  }

  const { error } = await supabase.from('help_offers').insert({
    island, neighborhood, offer_types: offerTypes, availability,
    contact_method: contactMethod, contact_value: contactValue,
    note, capacity,
  })

  if (error) {
    console.error('Offer submission error:', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
  return { success: true, error: null }
}

export async function submitVolunteer(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = formData.get('name') as string
  const island = formData.get('island') as string
  const neighborhood = formData.get('neighborhood') as string || null
  const skills = formData.getAll('skills') as string[]
  const availability = formData.get('availability') as string
  const contactMethod = formData.get('contact_method') as string
  const contactValue = formData.get('contact_value') as string
  const languages = formData.get('languages') as string || null
  const hasVehicle = formData.get('has_vehicle') === 'on'
  const note = formData.get('note') as string || null

  if (!name || !island || skills.length === 0 || !availability || !contactMethod || !contactValue) {
    return { success: false, error: 'Please fill in all required fields.' }
  }

  const { error } = await supabase.from('volunteers').insert({
    name, island, neighborhood, skills, availability,
    contact_method: contactMethod, contact_value: contactValue,
    languages, has_vehicle: hasVehicle, note,
  })

  if (error) {
    console.error('Volunteer submission error:', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
  return { success: true, error: null }
}

export async function submitCommunityTip(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const submittedName = formData.get('submitted_name') as string || null
  const submittedIsland = formData.get('submitted_island') as string
  const submittedArea = formData.get('submitted_area') as string || null
  const submittedInfo = formData.get('submitted_info') as string
  const submittedCategory = formData.get('submitted_category') as string || null
  const submittedContact = formData.get('submitted_contact') as string || null

  if (!submittedIsland || !submittedInfo) {
    return { success: false, error: 'Please fill in the island and resource information.' }
  }

  const { error } = await supabase.from('review_queue_items').insert({
    origin: 'community_tip',
    submitted_name: submittedName,
    submitted_island: submittedIsland,
    submitted_area: submittedArea,
    submitted_info: submittedInfo,
    submitted_category: submittedCategory,
    submitted_contact: submittedContact,
  })

  if (error) {
    console.error('Community tip submission error:', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
  return { success: true, error: null }
}

export async function submitFeedback(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const category = formData.get('feedback_category') as string
  const message = formData.get('feedback_message') as string
  const contact = formData.get('feedback_contact') as string || null
  const pageUrl = formData.get('feedback_page_url') as string || null

  if (!category || !message) {
    return { success: false, error: 'Please select a category and enter your message.' }
  }

  const { error } = await supabase.from('review_queue_items').insert({
    origin: 'feedback',
    feedback_category: category,
    feedback_message: message,
    feedback_contact: contact,
    feedback_page_url: pageUrl,
  })

  if (error) {
    console.error('Feedback submission error:', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
  return { success: true, error: null }
}

export async function signalHubActive(hubId: string): Promise<boolean> {
  if (!hubId) return false
  const supa = getServiceClient()
  const { data } = await supa.from('help_hubs')
    .select('active_confirm_count')
    .eq('id', hubId)
    .eq('visibility_status', 'public')
    .single()
  if (!data) return false
  const { error } = await supa.from('help_hubs')
    .update({ active_confirm_count: (data.active_confirm_count ?? 0) + 1 })
    .eq('id', hubId)
  if (error) { console.error('Signal hub active error:', error); return false }
  return true
}

export async function signalHubStale(hubId: string): Promise<boolean> {
  if (!hubId) return false
  const supa = getServiceClient()
  const { data } = await supa.from('help_hubs')
    .select('stale_flag_count')
    .eq('id', hubId)
    .eq('visibility_status', 'public')
    .single()
  if (!data) return false
  const { error } = await supa.from('help_hubs')
    .update({ stale_flag_count: (data.stale_flag_count ?? 0) + 1 })
    .eq('id', hubId)
  if (error) { console.error('Signal hub stale error:', error); return false }
  return true
}
