export default function Home() {
  return (
    <div className="py-6 sm:py-10">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-ocean-900 mb-2">
          Kōkua Hub
        </h1>
        <p className="text-base text-ocean-700 max-w-md mx-auto">
          Connecting Hawaiʻi communities during disaster relief — find resources, share what you have, and coordinate with neighbors.
        </p>
      </div>

      {/* Primary actions */}
      <div className="space-y-3 max-w-sm mx-auto mb-10">
        <a
          href="/need-help"
          className="block bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 text-white text-center rounded-xl px-6 py-5 text-lg font-semibold transition-colors"
        >
          I Need Help
        </a>
        <a
          href="/can-help"
          className="block bg-earth-600 hover:bg-earth-700 active:bg-earth-800 text-white text-center rounded-xl px-6 py-5 text-lg font-semibold transition-colors"
        >
          I Can Help
        </a>
        <a
          href="/donate"
          className="block bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200 text-gray-800 text-center rounded-xl px-6 py-4 text-base font-semibold transition-colors"
        >
          Donate &amp; Support
        </a>
        <a
          href="/map"
          className="block bg-white hover:bg-ocean-50 active:bg-ocean-100 border border-ocean-200 text-ocean-800 text-center rounded-xl px-6 py-4 text-base font-semibold transition-colors"
        >
          Open Resource Map
        </a>
        <a
          href="/can-help/share-info"
          className="block text-center text-sm text-ocean-700 hover:text-ocean-900 underline"
        >
          Contribute: Share a resource →
        </a>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl border border-ocean-100 p-5 sm:p-6 mb-8 max-w-lg mx-auto">
        <h2 className="font-semibold text-ocean-800 mb-3 text-center">How it works</h2>
        <ol className="space-y-2.5 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ocean-100 text-ocean-700 text-xs font-bold flex items-center justify-center">1</span>
            <span>Browse verified resources or reach volunteers to ask for help.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-earth-100 text-earth-700 text-xs font-bold flex items-center justify-center">2</span>
            <span>Share resources, connect to offer supplies and services, or donate to relief efforts.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ocean-100 text-ocean-700 text-xs font-bold flex items-center justify-center">3</span>
            <span>Coordinators review what&apos;s working and connect people with the help they need.</span>
          </li>
        </ol>
      </div>

      {/* Trust + safety */}
      <div className="text-center text-sm text-gray-500 max-w-md mx-auto space-y-2 mb-8">
        <p>
          A community coordination tool — not an official emergency service.
          For life-threatening emergencies, call 911.
        </p>
        <p>
          We only collect the minimum information needed to coordinate help.
          Private requests are never shown publicly.
        </p>
      </div>

      {/* Secondary links */}
      <div className="text-center space-y-1">
        <a
          href="/feedback"
          className="block text-xs text-gray-400 hover:text-ocean-600 transition-colors"
        >
          Questions or feedback?
        </a>
        <a
          href="/dashboard"
          className="block text-xs text-gray-400 hover:text-ocean-600 transition-colors"
        >
          Volunteer coordinator login →
        </a>
      </div>
    </div>
  )
}
