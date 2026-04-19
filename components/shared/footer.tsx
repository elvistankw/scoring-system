'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n/use-dictionary';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* Liquid Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-white/5 dark:from-gray-900/20 dark:via-gray-800/10 dark:to-gray-700/5 backdrop-blur-xl"></div>
      
      {/* Animated Liquid Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-br from-purple-400/8 to-pink-500/8 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-br from-cyan-400/12 to-blue-500/12 rounded-full blur-xl animate-ping" style={{ animationDuration: '4s' }}></div>
      </div>

      {/* Flowing Light Effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-white/3 animate-pulse"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"></div>
      </div>

      {/* Glass Border */}
      <div className="absolute inset-0 border-t border-white/10 dark:border-white/5"></div>

      {/* Content Container */}
      <div className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:items-stretch">
          {/* Company Info */}
          <div className="group h-full">
            <div className="relative p-6 rounded-2xl bg-white/5 dark:bg-white/3 backdrop-blur-sm border border-white/10 dark:border-white/5 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/5 h-full flex flex-col">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mr-3 animate-pulse"></span>
                  评分系统 / Scoring System
                </h3>
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {t('legal.companyInfo')}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 leading-relaxed">
                    Professional real-time scoring platform for various competition types.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Links */}
          <div className="group h-full">
            <div className="relative p-6 rounded-2xl bg-white/5 dark:bg-white/3 backdrop-blur-sm border border-white/10 dark:border-white/5 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/5 h-full flex flex-col">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mr-3 animate-pulse"></span>
                  {t('legal.legalInfo')} / Legal
                </h3>
                <div className="flex-1">
                  <ul className="space-y-3">
                    <li>
                      <Link 
                        href="/zh/privacy-policy" 
                        className="group/link inline-flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-all duration-300 hover:translate-x-1"
                      >
                        <span className="w-1 h-1 bg-current rounded-full mr-2 opacity-0 group-hover/link:opacity-100 transition-opacity"></span>
                        {t('legal.privacyPolicy')} / Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/zh/terms-of-service" 
                        className="group/link inline-flex items-center text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm transition-all duration-300 hover:translate-x-1"
                      >
                        <span className="w-1 h-1 bg-current rounded-full mr-2 opacity-0 group-hover/link:opacity-100 transition-opacity"></span>
                        {t('legal.termsOfService')} / Terms of Service
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="group h-full">
            <div className="relative p-6 rounded-2xl bg-white/5 dark:bg-white/3 backdrop-blur-sm border border-white/10 dark:border-white/5 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/5 h-full flex flex-col">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mr-3 animate-pulse"></span>
                  {t('legal.contactInfo')} / Contact
                </h3>
                <div className="flex-1">
                  <ul className="space-y-3">
                    <li className="text-gray-700 dark:text-gray-300 text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{t('legal.email')} / Email:</span>
                      <br />
                      <a 
                        href="mailto:privacy@scoring-system.com" 
                        className="inline-flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:translate-x-1 mt-1"
                      >
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                        privacy@scoring-system.com
                      </a>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300 text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{t('legal.support')} / Support:</span>
                      <br />
                      <a 
                        href="mailto:support@scoring-system.com" 
                        className="inline-flex items-center hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 mt-1"
                      >
                        <span className="w-1 h-1 bg-cyan-500 rounded-full mr-2 animate-pulse"></span>
                        support@scoring-system.com
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Liquid Glass Effect */}
        <div className="relative mt-8 pt-8">
          {/* Liquid Separator */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent"></div>
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-blue-400/30 via-purple-500/30 to-cyan-400/30 blur-sm"></div>
          
          <div className="relative rounded-xl bg-white/3 dark:bg-white/2 backdrop-blur-sm dark:border-white/3">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center">
                <span className="w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mr-2 animate-pulse"></span>
                © {new Date().getFullYear()} Scoring System. {t('legal.allRightsReserved')}.
              </p>
              <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <Link 
                  href="/zh/privacy-policy" 
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-all duration-300 hover:scale-105"
                >
                  {t('legal.privacyPolicy')}
                </Link>
                <span className="w-1 h-4 bg-gradient-to-b from-transparent via-gray-400/50 to-transparent"></span>
                <Link 
                  href="/zh/terms-of-service" 
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm transition-all duration-300 hover:scale-105"
                >
                  {t('legal.termsOfService')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liquid Glass Reflection */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/3 to-transparent dark:from-gray-900/3 pointer-events-none"></div>
    </footer>
  );
}