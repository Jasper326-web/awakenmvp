export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-16">
      <div className="max-w-4xl mx-auto px-8">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-8">隐私政策</h1>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">信息收集</h2>
              <p>我们收集您提供的个人信息，包括但不限于：</p>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>注册时提供的邮箱地址</li>
                <li>测试结果和打卡记录</li>
                <li>使用平台时的行为数据</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">信息使用</h2>
              <p>我们使用收集的信息用于：</p>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>提供个性化的戒色方案</li>
                <li>改善平台功能和用户体验</li>
                <li>发送重要通知和更新</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">信息保护</h2>
              <p>我们采取适当的安全措施保护您的个人信息，防止未经授权的访问、使用或披露。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">联系我们</h2>
              <p>如果您对本隐私政策有任何疑问，请通过平台内的反馈功能联系我们。</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
