// Root page - redirects to default locale
// Requirements: 15.1, 15.5

import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to default locale (en)
  redirect('/en');
}
