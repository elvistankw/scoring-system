// Google OAuth error page
// Requirements: Google OAuth integration

import type { Metadata } from 'next';
import { GoogleErrorClient } from '@/components/auth/google-error-client';
import { useTranslation } from '@/i18n/use-dictionary';

export const metadata: Metadata = {
  title: 'Google授权失败 | Scoring System',
  description: 'Google账户授权失败',
};

export default function GoogleErrorPage() {
  return <GoogleErrorClient />;
}
