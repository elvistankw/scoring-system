// Root page - redirects to default locale judge landing
// Requirements: 15.1, 15.5

import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to default locale judge landing page (zh is primary language)
  redirect('/zh/judge-landing');
}
