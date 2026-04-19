import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '服务条款 | Terms of Service - Scoring System',
  description: '了解使用评分系统的条款和条件 | Learn about the terms and conditions for using the Scoring System',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              服务条款 / Terms of Service
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
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. 接受条款
                </h3>
                <p>
                  通过访问和使用评分系统，您同意遵守这些服务条款。如果您不同意这些条款，请不要使用本服务。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. 服务描述
                </h3>
                <p>
                  评分系统是一个用于管理比赛、选手和评分的在线平台。我们提供比赛组织、实时评分、数据管理和结果展示等功能。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. 用户责任
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>提供准确、完整的注册信息</li>
                  <li>保护您的账户安全和密码</li>
                  <li>不得滥用或干扰系统正常运行</li>
                  <li>遵守所有适用的法律法规</li>
                  <li>尊重其他用户的权利</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. 禁止行为
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>上传恶意软件或病毒</li>
                  <li>尝试未经授权访问系统</li>
                  <li>干扰或破坏服务</li>
                  <li>侵犯他人知识产权</li>
                  <li>发布非法、有害或不当内容</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. 知识产权
                </h3>
                <p>
                  本服务及其所有内容、功能和特性均为我们或我们的许可方所有。未经明确书面许可，您不得复制、修改或分发本服务的任何部分。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. 免责声明
                </h3>
                <p>
                  本服务按"现状"提供，不提供任何明示或暗示的保证。我们不保证服务的连续性、准确性或可靠性。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  7. 责任限制
                </h3>
                <p>
                  在法律允许的最大范围内，我们不对任何间接、偶然、特殊或后果性损害承担责任。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  8. 服务修改和终止
                </h3>
                <p>
                  我们保留随时修改或终止服务的权利，恕不另行通知。我们也可能因违反这些条款而终止您的账户。
                </p>
              </section>
            </div>
          </div>

          {/* English Version */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              English Version
            </h2>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. Acceptance of Terms
                </h3>
                <p>
                  By accessing and using the Scoring System, you agree to comply with these Terms of Service. If you do not agree to these terms, please do not use this service.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. Service Description
                </h3>
                <p>
                  The Scoring System is an online platform for managing competitions, athletes, and scoring. We provide competition organization, real-time scoring, data management, and result display features.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. User Responsibilities
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Provide accurate and complete registration information</li>
                  <li>Protect your account security and password</li>
                  <li>Not abuse or interfere with normal system operation</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Respect the rights of other users</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. Prohibited Activities
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Upload malware or viruses</li>
                  <li>Attempt unauthorized access to the system</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Infringe on others' intellectual property</li>
                  <li>Post illegal, harmful, or inappropriate content</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. Intellectual Property
                </h3>
                <p>
                  This service and all its content, features, and functionality are owned by us or our licensors. You may not copy, modify, or distribute any part of this service without explicit written permission.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. Disclaimer
                </h3>
                <p>
                  This service is provided "as is" without any express or implied warranties. We do not guarantee the continuity, accuracy, or reliability of the service.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  7. Limitation of Liability
                </h3>
                <p>
                  To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, or consequential damages.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  8. Service Modification and Termination
                </h3>
                <p>
                  We reserve the right to modify or terminate the service at any time without notice. We may also terminate your account for violating these terms.
                </p>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              如有疑问，请联系我们：privacy@scoring-system.com / For questions, contact us: privacy@scoring-system.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}