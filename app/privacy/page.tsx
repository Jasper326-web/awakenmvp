import { useLanguage } from '@/lib/lang-context'

export default function PrivacyPage() {
  const { t } = useLanguage()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              <p className="mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                complete your profile, take addiction tests, or use our daily check-in features.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account information (email, username)</li>
                <li>Profile data (addiction level, goals, progress)</li>
                <li>Test results and check-in records</li>
                <li>Payment information (processed securely through Creem)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <p className="mb-4">
                We use the information we collect to provide, maintain, and improve our services:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide personalized addiction recovery support</li>
                <li>Track your progress and provide insights</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important updates and notifications</li>
                <li>Improve our services and develop new features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Protection</h2>
              <p className="mb-4">
                We implement appropriate security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security assessments and updates</li>
                <li>Compliance with data protection regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
              <p className="mb-4">
                We use trusted third-party services to support our platform:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Supabase (database and authentication)</li>
                <li>Creem (payment processing)</li>
                <li>Vercel (hosting and deployment)</li>
                <li>Google Analytics (usage analytics)</li>
              </ul>
              <p className="mt-4">
                These services have their own privacy policies and data handling practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Deletion</h2>
              <p className="mb-4">
                You can request deletion of your account and associated data at any time. 
                Contact us at support@awakenhub.org to initiate the deletion process.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us:
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
