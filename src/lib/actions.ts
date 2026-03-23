'use server'

import { supabase } from './supabase'

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
  const altContact = formData.get('alt_contact') as string || null
  const note = formData.get('note') as string || null
  const canBeContacted = formData.get('can_be_contacted') === 'on'

  if (!island || !neighborhood || needTypes.length === 0 || !urgency || !contactMethod || !contactValue) {
    return { success: false, error: 'Please fill in all required fields.' }
  }

  const { error } = await supabase.from('help_requests').insert({
    island,
    neighborhood,
    need_types: needTypes,
    urgency,
    contact_method: contactMethod,
    contact_value: contactValue,
    alt_contact: altContact,
    note,
    can_be_contacted: canBeContacted,
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
    island,
    neighborhood,
    offer_types: offerTypes,
    availability,
    contact_method: contactMethod,
    contact_value: contactValue,
    note,
    capacity,
  })

  if (error) {
    console.error('Offer submission error:', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true, error: null }
}
