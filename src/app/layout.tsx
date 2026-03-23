import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kōkua Hub — Community Relief Coordination',
  description: 'Find help, offer help, and coordinate disaster relief in Hawaiʻi.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ocean-50 text-gray-900">
        <header className="bg-white border-b border-ocean-100">
          <nav className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-semibold text-ocean-800">
              Kōkua Hub
            </a>
            <div className="flex gap-4 text-sm">
              <a href="/need-help" className="text-ocean-700 hover:text-ocean-900">
                Need Help
              </a>
              <a href="/can-help" className="text-ocean-700 hover:text-ocean-900">
                Can Help
              </a>
              <a href="/about" className="text-ocean-700 hover:text-ocean-900">
                About
              </a>
            </div>
          </nav>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-ocean-100 bg-white mt-12">
          <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
            <p className="mb-2">
              <strong className="text-lava-600">For life-threatening emergencies, call 911.</strong>
            </p>
            <p>
              Kōkua Hub is a community coordination tool, not an official emergency service.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
