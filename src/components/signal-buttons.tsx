'use client'

import { useState } from 'react'
import { signalHubActive, signalHubStale } from '@/lib/actions'

export function HubSignalButtons({ hubId }: { hubId: string }) {
  const [sent, setSent] = useState<string | null>(null)

  if (sent) {
    return <span className="text-[10px] text-ocean-600">Thanks for the update!</span>
  }

  return (
    <span className="inline-flex gap-2">
      <button
        onClick={async () => { await signalHubActive(hubId); setSent('active') }}
        className="text-[10px] text-gray-400 hover:text-green-600 transition-colors"
      >
        ✓ Still active
      </button>
      <button
        onClick={async () => { await signalHubStale(hubId); setSent('stale') }}
        className="text-[10px] text-gray-400 hover:text-amber-600 transition-colors"
      >
        ⚠ Not accurate
      </button>
    </span>
  )
}
