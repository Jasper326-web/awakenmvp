"use client"

import { Mail, MessageCircle, HelpCircle, Clock } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Contact & Support</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-6">Get in Touch</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Email Support</p>
                      <p className="text-gray-300">jdfz13zqy@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Response Time</p>
                      <p className="text-gray-300">Within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">Business Hours</p>
                      <p className="text-gray-300">Monday - Friday, 9 AM - 6 PM UTC</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">What We Can Help With</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Account and login issues</li>
                  <li>• Payment and subscription questions</li>
                  <li>• Technical support and bug reports</li>
                  <li>• Feature requests and feedback</li>
                  <li>• Privacy and data concerns</li>
                  <li>• General questions about our service</li>
                </ul>
              </div>
            </div>
            
            {/* Direct Contact Info */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Contact Us Directly</h2>
              
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-300 mb-4">Send us an email directly:</p>
                  <a 
                    href="mailto:jdfz13zqy@gmail.com"
                    className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-md hover:from-blue-700 hover:to-purple-700 transition duration-200"
                  >
                    jdfz13zqy@gmail.com
                  </a>
                </div>
                
                <div className="text-center text-gray-400 text-sm">
                  <p>Click the button above to open your email client</p>
                  <p>We'll respond within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">How do I log in to my account?</h3>
                <p className="text-gray-300">
                  We use Google and GitHub for secure authentication. Simply click the "Sign in with Google" or "Sign in with GitHub" button on the login page. No password reset is needed as authentication is handled by these trusted providers.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">How do I cancel my subscription?</h3>
                <p className="text-gray-300">
                  Subscriptions are managed through our payment provider, Creem. To cancel your subscription, please contact us at jdfz13zqy@gmail.com and we'll help you with the cancellation process.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">Is my data secure?</h3>
                <p className="text-gray-300">
                  Yes, we use industry-standard encryption and security measures to protect your personal information. Your data is stored securely on Supabase and all communications are encrypted. See our Privacy Policy for more details.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">Can I delete my account?</h3>
                <p className="text-gray-300">
                  Yes, you can request account deletion by contacting us at jdfz13zqy@gmail.com. We'll process your request within 30 days and permanently remove all your data from our systems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 