export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-16">
      <div className="max-w-4xl mx-auto px-8">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-8">服务条款</h1>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">服务说明</h2>
              <p>Awaken是一个专业的戒色成长平台，致力于帮助用户建立健康的生活方式。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">用户责任</h2>
              <p>使用本平台时，您需要：</p>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>提供真实准确的信息</li>
                <li>遵守平台的使用规范</li>
                <li>尊重其他用户的隐私和权利</li>
                <li>不发布违法或不当内容</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">免责声明</h2>
              <p>本平台提供的内容仅供参考，不构成专业医疗建议。如有需要，请咨询专业医疗人员。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">服务变更</h2>
              <p>我们保留随时修改或终止服务的权利，重要变更将提前通知用户。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">联系我们</h2>
              <p>如果您对本服务条款有任何疑问，请通过平台内的反馈功能联系我们。</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
