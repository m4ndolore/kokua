'use client'

import { useState } from 'react'

export function ShareButton({ title, text, url, className }: {
  title: string
  text?: string
  url?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const shareUrl = url ?? window.location.href

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url: shareUrl })
      } catch {
        // User cancelled or error — ignore
      }
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-ocean-600 transition-colors ${className ?? ''}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.5 2.5 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.474l6.733-3.367A2.5 2.5 0 0 1 13 4.5Z" />
      </svg>
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
