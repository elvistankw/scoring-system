import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策 | Privacy Policy - Scoring System',
  description: '了解我们如何收集、使用和保护您的个人信息 | Learn how we collect, use and protect your personal information',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              隐私政策 / Privacy Policy
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              最后更新时间 / Last Updated: {new Date().toLocaleDateString('zh-CN')}
            </p>
          </div>

          {/* Chinese Version */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              中文版本
            </h2>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              {/* Introduction */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. 简介
                </h3>
                <p>
                  欢迎使用评分系统（"我们"、"我们的"或"本服务"）。我们致力于保护您的隐私和个人信息。
                  本隐私政策说明了我们如何收集、使用、存储和保护您的信息。
                </p>
              </section>

              {/* Data Collection */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. 我们收集的信息
                </h3>
                <div className="space-y-3">
                  <h4 className="font-semibold">2.1 账户信息</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>电子邮箱地址（用于账户创建和登录）</li>
                    <li>用户名（用于系统识别）</li>
                    <li>密码（加密存储）</li>
                    <li>用户角色（管理员、评委、观众）</li>
                  </ul>

                  <h4 className="font-semibold">2.2 比赛相关信息</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>选手信息（姓名、年龄、学校、性别）</li>
                    <li>比赛数据（比赛名称、类型、日期）</li>
                    <li>评分记录（技术分、艺术分等）</li>
                  </ul>

                  <h4 className="font-semibold">2.3 Google 集成信息（可选）</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Google 账户邮箱（仅在您选择 Google 登录时）</li>
                    <li>Google OAuth 令牌（用于访问 Google Sheets 和 Drive）</li>
                  </ul>

                  <h4 className="font-semibold">2.4 技术信息</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>IP 地址（用于安全和分析）</li>
                    <li>浏览器类型和版本</li>
                    <li>设备信息</li>
                    <li>访问日志</li>
                  </ul>
                </div>
              </section>

              {/* Data Usage */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. 信息使用目的
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>账户管理：</strong>创建和管理用户账户，提供登录服务</li>
                  <li><strong>比赛运营：</strong>组织和管理比赛，记录和计算评分</li>
                  <li><strong>数据导出：</strong>将比赛结果导出到 Google Sheets（需用户授权）</li>
                  <li><strong>系统安全：</strong>防止欺诈和滥用，保护系统安全</li>
                  <li><strong>服务改进：</strong>分析使用情况，改进产品功能</li>
                  <li><strong>技术支持：</strong>提供客户支持和故障排除</li>
                </ul>
              </section>

              {/* Data Sharing */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. 信息共享
                </h3>
                <div className="space-y-3">
                  <p><strong>我们不会向第三方出售、交易或转让您的个人信息。</strong></p>
                  
                  <h4 className="font-semibold">有限的信息共享情况：</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Google 服务：</strong>仅在您明确授权时，我们会使用 Google API 将数据导出到您的 Google Sheets</li>
                    <li><strong>法律要求：</strong>在法律要求或政府机关要求时</li>
                    <li><strong>安全保护：</strong>为保护我们的权利、财产或安全</li>
                    <li><strong>服务提供商：</strong>与帮助我们运营服务的可信第三方（如云服务提供商），但他们必须保密</li>
                  </ul>
                </div>
              </section>

              {/* Data Security */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. 数据安全
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>使用 HTTPS 加密传输所有数据</li>
                  <li>密码使用强加密算法存储</li>
                  <li>定期备份数据以防丢失</li>
                  <li>限制员工访问个人信息</li>
                  <li>定期进行安全审计</li>
                </ul>
              </section>

              {/* User Rights */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. 您的权利
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>访问权：</strong>您可以查看我们持有的关于您的信息</li>
                  <li><strong>更正权：</strong>您可以更新或更正您的个人信息</li>
                  <li><strong>删除权：</strong>您可以要求删除您的账户和相关数据</li>
                  <li><strong>撤回同意：</strong>您可以随时撤回对 Google 服务的授权</li>
                  <li><strong>数据导出：</strong>您可以要求导出您的数据</li>
                </ul>
              </section>

              {/* Data Deletion */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  7. 如何删除您的数据
                </h3>
                <div className="space-y-3">
                  <h4 className="font-semibold">删除方式：</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>账户设置：</strong>登录后在账户设置中选择"删除账户"</li>
                    <li><strong>邮件申请：</strong>发送邮件至 privacy@scoring-system.com</li>
                    <li><strong>联系管理员：</strong>通过系统内消息联系管理员</li>
                  </ul>
                  
                  <h4 className="font-semibold">删除时间：</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>账户信息：立即删除</li>
                    <li>评分记录：30天内删除（除非法律要求保留）</li>
                    <li>备份数据：90天内从所有备份中删除</li>
                  </ul>
                </div>
              </section>

              {/* Contact */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  8. 联系我们
                </h3>
                <p>
                  如果您对本隐私政策有任何疑问或需要行使您的权利，请通过以下方式联系我们：
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>邮箱：privacy@scoring-system.com</li>
                  <li>系统内消息：联系管理员</li>
                </ul>
              </section>
            </div>
          </div>

          {/* English Version */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              English Version
            </h2>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              {/* Introduction */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. Introduction
                </h3>
                <p>
                  Welcome to Scoring System ("we", "our", or "the service"). We are committed to protecting your privacy and personal information. 
                  This Privacy Policy explains how we collect, use, store, and protect your information.
                </p>
              </section>

              {/* Data Collection */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. Information We Collect
                </h3>
                <div className="space-y-3">
                  <h4 className="font-semibold">2.1 Account Information</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Email address (for account creation and login)</li>
                    <li>Username (for system identification)</li>
                    <li>Password (encrypted storage)</li>
                    <li>User role (admin, judge, viewer)</li>
                  </ul>

                  <h4 className="font-semibold">2.2 Competition-Related Information</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Athlete information (name, age, school, gender)</li>
                    <li>Competition data (competition name, type, date)</li>
                    <li>Scoring records (technical scores, artistic scores, etc.)</li>
                  </ul>

                  <h4 className="font-semibold">2.3 Google Integration Information (Optional)</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Google account email (only when you choose Google login)</li>
                    <li>Google OAuth tokens (for accessing Google Sheets and Drive)</li>
                  </ul>

                  <h4 className="font-semibold">2.4 Technical Information</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>IP address (for security and analytics)</li>
                    <li>Browser type and version</li>
                    <li>Device information</li>
                    <li>Access logs</li>
                  </ul>
                </div>
              </section>

              {/* Data Usage */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. How We Use Your Information
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Account Management:</strong> Create and manage user accounts, provide login services</li>
                  <li><strong>Competition Operations:</strong> Organize and manage competitions, record and calculate scores</li>
                  <li><strong>Data Export:</strong> Export competition results to Google Sheets (requires user authorization)</li>
                  <li><strong>System Security:</strong> Prevent fraud and abuse, protect system security</li>
                  <li><strong>Service Improvement:</strong> Analyze usage patterns, improve product features</li>
                  <li><strong>Technical Support:</strong> Provide customer support and troubleshooting</li>
                </ul>
              </section>

              {/* Data Sharing */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. Information Sharing
                </h3>
                <div className="space-y-3">
                  <p><strong>We do not sell, trade, or transfer your personal information to third parties.</strong></p>
                  
                  <h4 className="font-semibold">Limited Information Sharing:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Google Services:</strong> Only with your explicit authorization, we use Google APIs to export data to your Google Sheets</li>
                    <li><strong>Legal Requirements:</strong> When required by law or government authorities</li>
                    <li><strong>Security Protection:</strong> To protect our rights, property, or safety</li>
                    <li><strong>Service Providers:</strong> With trusted third parties who help us operate our service (such as cloud service providers), but they must maintain confidentiality</li>
                  </ul>
                </div>
              </section>

              {/* Data Security */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. Data Security
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Use HTTPS encryption for all data transmission</li>
                  <li>Store passwords using strong encryption algorithms</li>
                  <li>Regular data backups to prevent loss</li>
                  <li>Limit employee access to personal information</li>
                  <li>Regular security audits</li>
                </ul>
              </section>

              {/* User Rights */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. Your Rights
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Access Right:</strong> You can view the information we hold about you</li>
                  <li><strong>Correction Right:</strong> You can update or correct your personal information</li>
                  <li><strong>Deletion Right:</strong> You can request deletion of your account and related data</li>
                  <li><strong>Withdraw Consent:</strong> You can withdraw authorization for Google services at any time</li>
                  <li><strong>Data Export:</strong> You can request to export your data</li>
                </ul>
              </section>

              {/* Data Deletion */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  7. How to Delete Your Data
                </h3>
                <div className="space-y-3">
                  <h4 className="font-semibold">Deletion Methods:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Account Settings:</strong> Log in and select "Delete Account" in account settings</li>
                    <li><strong>Email Request:</strong> Send an email to privacy@scoring-system.com</li>
                    <li><strong>Contact Administrator:</strong> Contact administrator through system messages</li>
                  </ul>
                  
                  <h4 className="font-semibold">Deletion Timeline:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Account information: Immediate deletion</li>
                    <li>Scoring records: Deleted within 30 days (unless legally required to retain)</li>
                    <li>Backup data: Deleted from all backups within 90 days</li>
                  </ul>
                </div>
              </section>

              {/* Contact */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  8. Contact Us
                </h3>
                <p>
                  If you have any questions about this Privacy Policy or need to exercise your rights, please contact us:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Email: privacy@scoring-system.com</li>
                  <li>System Message: Contact Administrator</li>
                </ul>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              本隐私政策的任何更改都将在此页面上发布 / Any changes to this Privacy Policy will be posted on this page
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}