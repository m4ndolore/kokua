export default function NeedHelp() {
  return (
    <div className="py-6 sm:py-10 max-w-lg mx-auto">
      {/* Emergency banner */}
      <div className="bg-lava-500/10 border border-lava-500/20 rounded-lg px-4 py-3 mb-8 text-center">
        <p className="text-sm text-lava-700 font-medium">
          For life-threatening emergencies, call 911.
        </p>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-ocean-900 mb-2 text-center">
        I Need Help
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Find resources near you or submit a request for help.
      </p>

      <div className="space-y-3">
        <a
          href="/need-help/find"
          className="block bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 text-white rounded-xl px-6 py-5 transition-colors"
        >
          <span className="text-lg font-semibold block mb-1">Find Help Near You</span>
          <span className="text-sm text-ocean-100">
            Browse shelters, supply sites, and services currently available.
          </span>
        </a>

        <a
          href="/need-help/request"
          className="block bg-white hover:bg-ocean-50 active:bg-ocean-100 border border-ocean-200 text-ocean-900 rounded-xl px-6 py-5 transition-colors"
        >
          <span className="text-lg font-semibold block mb-1">Request Help</span>
          <span className="text-sm text-gray-500">
            Submit a private request. A volunteer coordinator will follow up.
          </span>
        </a>
      </div>

      <p className="text-center mt-6">
        <a href="/can-help/share-info" className="text-sm text-gray-500 hover:text-ocean-700 underline">
          Know a resource that could help others? Contribute it →
        </a>
      </p>

      <p className="text-xs text-gray-400 text-center mt-6">
        Your personal information is never shown publicly.
      </p>
    </div>
  )
}
