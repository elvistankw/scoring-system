// Google OAuth success page
// Requirements: Google OAuth integration

import type { Metadata } from 'next';
import { GoogleSuccessClient } from '@/components/auth/google-success-client';
import { useTranslation } from '@/i18n/use-dictionary';

export const metadata: Metadata = {
  title: 'Google授权成功 | Scoring System',
  description: 'Google账户授权成功',
};

export default function GoogleSuccessPage() {
  return <GoogleSuccessClient />;
}
