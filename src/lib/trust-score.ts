import type { DonationLink } from './types'

export function computeTrustScore(link: Pick<DonationLink, 'source_type' | 'donation_type' | 'confidence' | 'badges' | 'flags' | 'last_verified_at'>): number {
  let score = 50

  // Source type
  if (link.source_type === 'official') score += 20
  else if (link.source_type === 'nonprofit') score += 18
  else if (link.source_type === 'platform') score += 12
  else if (link.source_type === 'social') score -= 20

  // Donation type
  if (link.donation_type === 'institutional') score += 12
  else if (link.donation_type === 'platform_hub') score += 8
  else if (link.donation_type === 'community_campaign') score -= 6

  // Confidence
  if (link.confidence === 'high') score += 12
  else if (link.confidence === 'low') score -= 18

  // Badges
  if (link.badges.includes('Established Organization')) score += 8
  if (link.badges.includes('Platform Verified')) score += 6
  if (link.badges.includes('Local Organization')) score += 4
  if (link.badges.includes('501(c)(3) Verified')) score += 10
  if (link.badges.includes('Charity Navigator 4-Star')) score += 8
  if (link.badges.includes('Matching Fund')) score += 5

  // Flags
  if (link.flags.includes('low_confidence')) score -= 10
  if (link.flags.includes('source_conflict')) score -= 15
  if (link.flags.includes('stale')) score -= 12
  if (link.flags.includes('broken_link')) score -= 30
  if (link.flags.includes('suspicious')) score -= 25
  if (link.flags.includes('social_source')) score -= 20
  if (link.flags.includes('unresolved_shortlink')) score -= 8

  // Freshness
  if (link.last_verified_at) {
    const ageMs = Date.now() - new Date(link.last_verified_at).getTime()
    if (ageMs <= 48 * 60 * 60 * 1000) score += 6
  }

  return Math.max(0, Math.min(100, score))
}
