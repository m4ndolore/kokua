export default function About() {
  return (
    <div className="py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ocean-900 mb-4">About Kōkua Hub</h1>

      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-ocean-800 mb-2">What is this?</h2>
          <p>
            Kōkua Hub is a simple community coordination tool built to help connect people
            who need help with people who can offer help during disaster response in Hawaiʻi.
            It is designed to support grassroots relief efforts — not to replace official
            emergency services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ocean-800 mb-2">How it works</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>People who need help submit a request describing what they need.</li>
            <li>People who can help submit an offer describing what they have available.</li>
            <li>Volunteer coordinators review incoming requests and offers.</li>
            <li>Coordinators manually connect people who can help with people who need it.</li>
          </ol>
          <p className="mt-2">
            There is no automated matching. Real people review every request and offer to
            make thoughtful, safe connections.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ocean-800 mb-2">Privacy &amp; data</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>We collect only the minimum information needed to coordinate help.</li>
            <li>Your contact information is shared only with volunteer coordinators.</li>
            <li>We do not require accounts or login for requesting or offering help.</li>
            <li>We do not sell data or use it for any purpose other than relief coordination.</li>
            <li>Data may be deleted after the active relief period ends.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ocean-800 mb-2">Safety</h2>
          <div className="bg-lava-500/10 border border-lava-500/20 rounded-lg p-4">
            <p className="font-semibold text-lava-700 mb-2">
              For life-threatening emergencies, always call 911.
            </p>
            <p>
              Kōkua Hub is not an emergency service. It is a community tool that depends on
              volunteer availability. Response times are not guaranteed.
            </p>
          </div>
          <ul className="mt-3 list-disc list-inside space-y-1">
            <li>Never share sensitive personal information (SSN, bank details, passwords).</li>
            <li>Be cautious when meeting someone you connected with through any online tool.</li>
            <li>Coordinate pickups and meetups in safe, public locations when possible.</li>
            <li>Trust your instincts — if something feels wrong, step away.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ocean-800 mb-2">About the name</h2>
          <p>
            <em>Kōkua</em> is a Hawaiian word meaning to help, assist, or support.
            It reflects the spirit of community care that drives relief efforts across
            the islands.
          </p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-ocean-100 text-center">
        <a href="/" className="text-ocean-600 hover:text-ocean-800 underline text-sm">
          ← Back to home
        </a>
      </div>
    </div>
  )
}
