import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Supported locales
const locales = ['zh', 'en'] as const;
const defaultLocale = 'zh';

// Get locale from pathname
function getLocale(pathname: string): string | undefined {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  
  if (locales.includes(potentialLocale as any)) {
    return potentialLocale;
  }
  
  return undefined;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }
  
  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // If no locale in pathname, redirect to default locale
  if (!pathnameHasLocale) {
    const locale = defaultLocale;
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - Static files
  // - Next.js internals
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
