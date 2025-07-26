import { useLanguage } from '@/lib/lang-context'
import { Mail, MessageCircle, HelpCircle, Clock } from 'lucide-react'

export default function ContactPage() {
  const { t } = useLanguage()
  
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
                      <p className="text-gray-300">support@awakenhub.org</p>
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
            
            {/* Contact Form */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Send us a Message</h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Subject</label>
                  <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Payment Issue</option>
                    <option>Account Problem</option>
                    <option>Feature Request</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Message</label>
                  <textarea 
                    rows={4}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please describe your issue or question..."
                  ></textarea>
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-2 px-4 rounded-md hover:from-blue-700 hover:to-purple-700 transition duration-200"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">How do I reset my password?</h3>
                <p className="text-gray-300">
                  Click on the "Forgot Password" link on the login page. You'll receive a reset link via email.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">How do I cancel my subscription?</h3>
                <p className="text-gray-300">
                  Go to your profile settings and click on "Subscription Management" to cancel your subscription at any time.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">Is my data secure?</h3>
                <p className="text-gray-300">
                  Yes, we use industry-standard encryption and security measures to protect your personal information. 
                  See our Privacy Policy for more details.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">Can I delete my account?</h3>
                <p className="text-gray-300">
                  Yes, you can request account deletion by contacting us at support@awakenhub.org. 
                  We'll process your request within 30 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 