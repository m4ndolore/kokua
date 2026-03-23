'use client'

import { useState } from 'react'
import { ISLANDS } from '@/lib/types'
import type { DonationLink } from '@/lib/types'

function confidenceBadge(confidence: string) {
  if (confidence === 'high') return null
  const colors: Record<string, string> = {
    medium: 'bg-amber-50 text-amber-700',
    low: 'bg-lava-500/10 text-lava-600',
  }
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[confidence] ?? ''}`}>
      {confidence === 'low' ? 'Unverified' : 'Needs verification'}
    </span>
  )
}

function BadgeChips({ badges }: { badges: string[] }) {
  const visible = badges.slice(0, 3)
  const remaining = badges.length - visible.length

  if (visible.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map(badge => (
        <span
          key={badge}
          className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-ocean-50 text-ocean-700"
        >
          {badge}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
          +{remaining} more
        </span>
      )}
    </div>
  )
}

function DonationCard({ donation }: { donation: DonationLink }) {
  return (
    <div className="bg-white border border-ocean-100 rounded-lg p-4">
      <h3 className="font-semibold text-sm text-gray-900 mb-0.5">{donation.title}</h3>
      {donation.organization && (
        <p className="text-xs text-gray-500 mb-1.5">{donation.organization}</p>
      )}
      {donation.description && (
        <p className="text-sm text-gray-600 mb-2">{donation.description}</p>
      )}

      <BadgeChips badges={donation.badges} />

      {/* Source provenance */}
      <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-50">
        {donation.source_name && (
          <span className="text-xs text-gray-400">Source: {donation.source_name}</span>
        )}
        {confidenceBadge(donation.confidence)}
        {donation.last_verified_at && (
          <span className="text-[10px] text-gray-400">
            Verified {new Date(donation.last_verified_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Donate button */}
      <div className="flex items-center gap-2 mt-3">
        <a
          href={donation.destination_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-ocean-600 text-white hover:bg-ocean-700 transition-colors"
        >
          Donate &rarr;
        </a>
        <span className="text-[10px] text-gray-400">External site</span>
      </div>
    </div>
  )
}

type SectionConfig = {
  readonly title: string
  readonly filter: (d: DonationLink) => boolean
}

const SECTIONS: readonly SectionConfig[] = [
  {
    title: 'Coordinated Relief Funds',
    filter: (d) => d.donation_type === 'institutional',
  },
  {
    title: 'Verified Campaign Hubs',
    filter: (d) => d.donation_type === 'platform_hub',
  },
  {
    title: 'Community Campaigns & In-Kind Support',
    filter: (d) =>
      d.donation_type === 'community_campaign' ||
      d.donation_type === 'in_kind_support' ||
      d.donation_type === 'volunteer',
  },
] as const

export function DonateContent({ donations }: { donations: DonationLink[] }) {
  const [islandFilter, setIslandFilter] = useState('')

  const filtered = donations.filter(
    (d) => !islandFilter || d.island === null || d.island === islandFilter
  )

  return (
    <div className="py-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ocean-900 mb-1">
        Donate &amp; Support Flood Relief
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        We aggregate active relief efforts for awareness. We do not process
        donations or endorse specific campaigns.
      </p>

      {/* Safety banner */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6">
        <p className="text-sm text-amber-800">
          Scams increase during disasters. Verify organizations before donating.
          When possible, donate through official channels.
        </p>
      </div>

      {/* Island filter */}
      <div className="mb-6">
        <select
          value={islandFilter}
          onChange={(e) => setIslandFilter(e.target.value)}
          className="w-full sm:w-auto rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-ocean-400"
        >
          <option value="">All islands</option>
          {ISLANDS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-ocean-100 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500">
            No donation links available yet. Check back soon.
          </p>
        </div>
      ) : (
        /* Donation sections */
        SECTIONS.map((section) => {
          const items = filtered.filter(section.filter)
          if (items.length === 0) return null
          return (
            <section key={section.title} className="mb-8">
              <h2 className="text-lg font-semibold text-ocean-800 mb-3">
                {section.title}
              </h2>
              <div className="space-y-2">
                {items.map((d) => (
                  <DonationCard key={d.id} donation={d} />
                ))}
              </div>
            </section>
          )
        })
      )}

      {/* Footer links */}
      <div className="mt-8 pt-4 border-t border-ocean-100 text-center text-sm space-y-2">
        <p>
          <a
            href="/need-help/find"
            className="text-ocean-600 hover:text-ocean-800 underline"
          >
            Looking for help instead? Find resources near you &rarr;
          </a>
        </p>
        <p>
          <a
            href="/can-help"
            className="text-gray-400 hover:text-ocean-600 underline"
          >
            Want to help in other ways? See how you can contribute.
          </a>
        </p>
      </div>
    </div>
  )
}
