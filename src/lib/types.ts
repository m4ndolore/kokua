// ============================================================
// Constants
// ============================================================

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

export const VOLUNTEER_SKILLS = [
  'General labor',
  'Driving / delivery',
  'Medical / first aid',
  'Childcare',
  'Translation',
  'Cooking',
  'Organizing / coordination',
  'Tech / communications',
  'Counseling',
  'Other',
] as const

export const URGENCY_LEVELS = ['Urgent', 'Soon', 'Flexible'] as const
export const AVAILABILITY_OPTIONS = ['Today', 'Next 24 hours', 'This week'] as const
export const VOLUNTEER_AVAILABILITY = ['Today', 'Next 24 hours', 'This week', 'Ongoing'] as const
export const CONTACT_METHODS = ['Phone', 'Email'] as const

export const REQUEST_STATUSES = ['New', 'Reviewing', 'Matched', 'Completed', 'Archived'] as const
export const OFFER_STATUSES = ['New', 'Available', 'Assigned', 'Completed', 'Archived'] as const
export const VOLUNTEER_STATUSES = ['New', 'Active', 'On hold', 'Inactive'] as const

export const HUB_CATEGORIES = [
  'Shelter',
  'Food distribution',
  'Water distribution',
  'Supply distribution',
  'Medical',
  'Charging station',
  'Laundry',
  'Shower',
  'Cleanup staging',
  'Government office',
  'Volunteer hub',
  'Donation drop-off',
  'Other',
] as const

export const HUB_STATUSES = ['Open', 'Limited', 'Closed', 'Unknown'] as const

export const NEED_SUMMARY_CATEGORIES = [
  'Volunteers needed',
  'Supplies needed',
  'Transportation needed',
  'Donations needed',
  'Skilled help needed',
  'General',
] as const

export const NEED_SUMMARY_URGENCY = ['Urgent', 'High', 'Normal'] as const

export const REVIEW_STATUSES = ['Pending', 'Approved', 'Rejected', 'Duplicate'] as const

export const ROLES = ['coordinator', 'admin'] as const
export type Role = typeof ROLES[number]

// ============================================================
// Record types
// ============================================================

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

export type Volunteer = {
  id: string
  created_at: string
  name: string
  island: string
  neighborhood: string | null
  skills: string[]
  availability: string
  contact_method: string
  contact_value: string
  languages: string | null
  has_vehicle: boolean
  note: string | null
  status: string
  coordinator_notes: string | null
}

export type HelpHub = {
  id: string
  created_at: string
  updated_at: string
  name: string
  island: string
  area: string
  category: string
  status: string
  hours: string | null
  notes: string | null
  public_phone: string | null
  public_email: string | null
  address: string | null
  last_verified_at: string | null
  source_url: string | null
  is_visible: boolean
  coordinator_notes: string | null
}

export type PublicNeedSummary = {
  id: string
  created_at: string
  updated_at: string
  island: string
  area: string | null
  title: string
  description: string
  category: string
  urgency: string
  is_visible: boolean
  coordinator_notes: string | null
}

export type ReviewQueueItem = {
  id: string
  created_at: string
  submitted_name: string | null
  submitted_island: string
  submitted_area: string | null
  submitted_info: string
  submitted_category: string | null
  submitted_contact: string | null
  status: string
  reviewer_notes: string | null
  promoted_hub_id: string | null
}

export type DashboardUser = {
  id: string
  created_at: string
  email: string
  name: string
  role: Role
  is_active: boolean
}
