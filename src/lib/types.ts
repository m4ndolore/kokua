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
  'Food', 'Water', 'Supplies', 'Transportation',
  'Cleanup help', 'Wellness check', 'Temporary shelter', 'Other',
] as const

export const OFFER_TYPES = [
  'Supplies', 'Transportation', 'Labor / cleanup help',
  'Storage space', 'Shelter space', 'Food / water', 'Other',
] as const

export const VOLUNTEER_SKILLS = [
  'General labor', 'Driving / delivery', 'Medical / first aid',
  'Childcare', 'Translation', 'Cooking', 'Organizing / coordination',
  'Tech / communications', 'Counseling', 'Other',
] as const

export const URGENCY_LEVELS = ['Urgent', 'Soon', 'Flexible'] as const
export const AVAILABILITY_OPTIONS = ['Today', 'Next 24 hours', 'This week'] as const
export const VOLUNTEER_AVAILABILITY = ['Today', 'Next 24 hours', 'This week', 'Ongoing'] as const
export const CONTACT_METHODS = ['Phone', 'Email'] as const

export const REQUEST_STATUSES = ['New', 'Reviewing', 'Matched', 'Completed', 'Archived'] as const
export const OFFER_STATUSES = ['New', 'Available', 'Assigned', 'Completed', 'Archived'] as const
export const VOLUNTEER_STATUSES = ['New', 'Active', 'On hold', 'Inactive'] as const

export const HUB_CATEGORIES = [
  'Shelter', 'Food distribution', 'Water distribution', 'Supply distribution',
  'Medical', 'Charging station', 'Laundry', 'Shower', 'Cleanup staging',
  'Government office', 'Volunteer hub', 'Donation drop-off', 'Other',
] as const

export const HUB_STATUSES = ['Open', 'Limited', 'Closed', 'Unknown'] as const

export const NEED_SUMMARY_CATEGORIES = [
  'Volunteers needed', 'Supplies needed', 'Transportation needed',
  'Donations needed', 'Skilled help needed', 'General',
] as const

export const NEED_SUMMARY_URGENCY = ['Urgent', 'High', 'Normal'] as const

export const REVIEW_STATUSES = ['Pending', 'Approved', 'Rejected', 'Duplicate', 'Escalated'] as const
export const REVIEW_ORIGINS = ['community_tip', 'source_signal', 'stale_flag', 'feedback', 'conflict', 'other'] as const

// Source system constants
export const SOURCE_TYPES = ['official', 'nonprofit', 'news', 'social', 'community', 'internal', 'other'] as const
export const SOURCE_PLATFORMS = ['facebook', 'x', 'instagram', 'website', 'email', 'word_of_mouth', 'github', 'other'] as const
export const TRUST_LEVELS = ['high', 'medium', 'low'] as const
export const UPDATE_FREQUENCIES = ['realtime', 'hourly', 'daily', 'weekly', 'ad_hoc', 'unknown'] as const
export const SOURCE_STRATEGIES = ['monitor', 'mirror', 'redirect'] as const
export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const
export const VISIBILITY_STATUSES = ['public', 'internal', 'review'] as const

export const SIGNAL_TYPES = [
  'resource', 'need', 'update', 'closure', 'route_change',
  'donation_drive', 'volunteer_call', 'question', 'feedback', 'other',
] as const

export const SIGNAL_DERIVED_STATUSES = ['active', 'limited', 'planned', 'inactive', 'unknown'] as const
export const SIGNAL_REVIEW_STATUSES = ['pending', 'approved', 'rejected', 'escalated'] as const

export const FEEDBACK_CATEGORIES = [
  'question', 'feedback', 'report_issue', 'suggest_resource',
  'bug', 'feature_request', 'other',
] as const

// Categories safe to bridge to GitHub issues (no personal data risk)
export const GITHUB_SAFE_CATEGORIES = ['bug', 'feature_request', 'suggest_resource'] as const

// Donation constants
export const DONATION_TYPES = ['institutional', 'platform_hub', 'community_campaign', 'in_kind_support', 'volunteer'] as const
export const DONATION_BADGES = [
  'Established Organization', 'Platform Verified', 'Local Organization',
  'Newly Added', 'Limited Verification', 'Needs Review',
  '501(c)(3) Verified', 'Charity Navigator 4-Star', 'Matching Fund',
] as const
export const DONATION_FLAGS = [
  'low_confidence', 'source_conflict', 'stale', 'broken_link', 'suspicious',
  'social_source', 'unresolved_shortlink',
] as const

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
  source_name: string | null
  source_type: string | null
  source_url: string | null
  source_registry_id: string | null
  confidence: string
  last_verified_at: string | null
  visibility_status: string
  verification_count: number
  stale_flag_count: number
  active_confirm_count: number
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
  source_name: string | null
  source_type: string | null
  source_url: string | null
  source_registry_id: string | null
  confidence: string
  last_verified_at: string | null
  visibility_status: string
  coordinator_notes: string | null
}

export type ReviewQueueItem = {
  id: string
  created_at: string
  origin: string
  submitted_name: string | null
  submitted_island: string | null
  submitted_area: string | null
  submitted_info: string | null
  submitted_category: string | null
  submitted_contact: string | null
  feedback_category: string | null
  feedback_message: string | null
  feedback_contact: string | null
  feedback_page_url: string | null
  source_signal_id: string | null
  source_registry_id: string | null
  status: string
  reviewer_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  promoted_hub_id: string | null
  promoted_summary_id: string | null
  github_issue_url: string | null
  github_issue_number: number | null
}

export type SourceRegistry = {
  id: string
  created_at: string
  updated_at: string
  name: string
  source_type: string
  platform: string | null
  base_url: string | null
  organization: string | null
  trust_level: string
  update_frequency: string
  strategy: string
  is_active: boolean
  notes: string | null
  last_checked_at: string | null
}

export type SourceSignal = {
  id: string
  created_at: string
  updated_at: string
  source_registry_id: string | null
  title: string | null
  signal_type: string
  raw_url: string | null
  raw_text: string | null
  raw_payload: Record<string, unknown> | null
  island: string | null
  area: string | null
  neighborhood: string | null
  derived_resource_name: string | null
  derived_resource_type: string | null
  derived_status: string | null
  confidence: string
  freshness_score: number | null
  last_observed_at: string | null
  needs_review: boolean
  review_reason: string | null
  review_status: string
  reviewed_by: string | null
  reviewed_at: string | null
  linked_help_hub_id: string | null
  linked_need_summary_id: string | null
  coordinator_notes: string | null
}

export type DonationLink = {
  id: string
  created_at: string
  updated_at: string
  external_id: string
  title: string
  organization: string | null
  donation_type: string
  description: string | null
  island: string | null
  area: string | null
  neighborhood: string | null
  address: string | null
  hours: string | null
  destination_url: string
  source_name: string | null
  source_type: string | null
  source_url: string | null
  confidence: string
  trust_score: number | null
  badges: string[]
  flags: string[]
  last_verified_at: string | null
  is_visible: boolean
  needs_review: boolean
  review_reason: string | null
  tags: string[]
}

export type DashboardUser = {
  id: string
  created_at: string
  email: string
  name: string
  role: Role
  is_active: boolean
}
