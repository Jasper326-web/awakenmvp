export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          
          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using Awaken (awakenhub.org), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="mb-4">
                Awaken is a digital platform that provides addiction recovery support, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Addiction assessment tests and personalized recovery plans</li>
                <li>Daily check-in and progress tracking features</li>
                <li>Community support and premium content</li>
                <li>Educational resources and guidance materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
              <p className="mb-4">
                To access certain features, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Payment and Subscription</h2>
              <p className="mb-4">
                Premium features require payment through our payment processor, Creem:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All payments are processed securely through Creem</li>
                <li>Subscription fees are billed in advance on a recurring basis</li>
                <li>You may cancel your subscription at any time</li>
                <li>Refunds are handled according to our refund policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Acceptable Use</h2>
              <p className="mb-4">
                You agree not to use the service to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Upload or transmit harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the service for any commercial purpose without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Privacy and Data</h2>
              <p className="mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your 
                use of the service, to understand our practices regarding your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property</h2>
              <p className="mb-4">
                The service and its original content, features, and functionality are owned by Awaken and 
                are protected by international copyright, trademark, patent, trade secret, and other 
                intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimers</h2>
              <p className="mb-4">
                The service is provided "as is" without warranties of any kind. We do not guarantee that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The service will be uninterrupted or error-free</li>
                <li>Results from addiction recovery will be achieved</li>
                <li>The service will meet your specific requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
              <p className="mb-4">
                In no event shall Awaken be liable for any indirect, incidental, special, consequential, 
                or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
                or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your account and bar access to the service immediately, 
                without prior notice or liability, under our sole discretion, for any reason whatsoever.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify or replace these terms at any time. If a revision is 
                material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Email: support@awakenhub.org</li>
                <li>Website: https://awakenhub.org</li>
              </ul>
            </section>

            <div className="border-t border-gray-700 pt-6 mt-8">
              <p className="text-sm text-gray-400">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
