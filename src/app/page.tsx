export default function Home() {
  return (
    <div className="py-6 sm:py-10">
      {/* Emergency banner */}
      <div className="bg-lava-500/10 border border-lava-500/20 rounded-lg px-4 py-3 mb-8 text-center">
        <p className="text-sm text-lava-700 font-medium">
          For life-threatening emergencies, call 911.
        </p>
      </div>

      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-ocean-900 mb-2">
          Kōkua Hub
        </h1>
        <p className="text-base text-ocean-700">
          Community relief coordination for Hawaiʻi
        </p>
      </div>

      {/* Primary actions — large touch targets for mobile */}
      <div className="space-y-3 max-w-sm mx-auto mb-10">
        <a
          href="/request"
          className="block bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 text-white text-center rounded-xl px-6 py-5 text-lg font-semibold transition-colors"
        >
          I Need Help
        </a>
        <a
          href="/offer"
          className="block bg-earth-600 hover:bg-earth-700 active:bg-earth-800 text-white text-center rounded-xl px-6 py-5 text-lg font-semibold transition-colors"
        >
          I Can Help
        </a>
      </div>

      {/* How it works — brief and reassuring */}
      <div className="bg-white rounded-xl border border-ocean-100 p-5 sm:p-6 mb-8 max-w-lg mx-auto">
        <h2 className="font-semibold text-ocean-800 mb-3 text-center">How it works</h2>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ocean-100 text-ocean-700 text-xs font-bold flex items-center justify-center">1</span>
            <span>Tell us what you need or what you can offer.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ocean-100 text-ocean-700 text-xs font-bold flex items-center justify-center">2</span>
            <span>A volunteer coordinator reviews your submission.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ocean-100 text-ocean-700 text-xs font-bold flex items-center justify-center">3</span>
            <span>They connect people who need help with people who can help.</span>
          </li>
        </ol>
      </div>

      {/* Trust statement */}
      <div className="text-center text-sm text-gray-500 max-w-md mx-auto space-y-2 mb-8">
        <p>
          This is a community tool, not an official emergency service.
          Response depends on volunteer availability.
        </p>
        <p>
          We only collect the minimum information needed to coordinate help.
          Your contact info is shared only with coordinators.
        </p>
      </div>

      {/* Secondary link */}
      <div className="text-center">
        <a
          href="/dashboard"
          className="text-xs text-gray-400 hover:text-ocean-600 transition-colors"
        >
          Volunteer coordinator login →
        </a>
      </div>
    </div>
  )
}
