export const ISLANDS = [
  'Oʻahu',
  'Maui',
  'Hawaiʻi (Big Island)',
  'Kauaʻi',
  'Molokaʻi',
  'Lānaʻi',
] as const

export type Island = typeof ISLANDS[number]

export const REQUEST_TYPES = [
  'Food',
  'Water',
  'Supplies',
  'Transportation',
  'Cleanup help',
  'Wellness check',
  'Temporary shelter',
  'Other',
] as const

export const OFFER_TYPES = [
  'Supplies',
  'Transportation',
  'Labor / cleanup help',
  'Storage space',
  'Shelter space',
  'Food / water',
  'Other',
] as const

export const URGENCY_LEVELS = ['Urgent', 'Soon', 'Flexible'] as const

export const AVAILABILITY_OPTIONS = ['Today', 'Next 24 hours', 'This week'] as const

export const CONTACT_METHODS = ['Phone', 'Email'] as const

export const REQUEST_STATUSES = ['New', 'Reviewing', 'Matched', 'Completed', 'Archived'] as const
export const OFFER_STATUSES = ['New', 'Available', 'Assigned', 'Completed', 'Archived'] as const

export type HelpRequest = {
  id: string
  created_at: string
  island: string
  neighborhood: string
  need_types: string[]
  urgency: string
  contact_method: string
  contact_value: string
  alt_contact: string | null
  note: string | null
  can_be_contacted: boolean
  status: string
  coordinator_notes: string | null
}

export type HelpOffer = {
  id: string
  created_at: string
  island: string
  neighborhood: string
  offer_types: string[]
  availability: string
  contact_method: string
  contact_value: string
  note: string | null
  capacity: string | null
  status: string
  coordinator_notes: string | null
}
