import { type NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/admin/:path*']
};

/**
 * Edge Middleware for Stealth Admin Security.
 * Rewrites any unauthorized visitor or crawler to /_not-found (HTTP 404)
 * so the admin portal is completely invisible to the public.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const adminCookie = request.cookies.get('hh_admin_session')?.value;
  const userCookie = request.cookies.get('hh_session')?.value;
  const hasSession = Boolean(adminCookie || userCookie);
  const accessKey = process.env['ADMIN_ACCESS_KEY'] ?? 'hh_dev_access_key';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-admin-pathname', pathname);

  const forwardNext = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });

  // 1. Gateway Entry Gate: /admin/login
  if (pathname === '/admin/login') {
    const keyParam = searchParams.get('key');

    // If already authenticated with a session cookie, redirect to /admin/orders
    if (hasSession) {
      return NextResponse.redirect(new URL('/admin/orders', request.url));
    }

    // Must supply valid secret access key in query param
    if (!keyParam || keyParam !== accessKey) {
      // Return fake 404 Not Found
      return NextResponse.rewrite(new URL('/_not-found', request.url));
    }

    return forwardNext();
  }

  // 2. All Protected Admin Routes (/admin, /admin/orders, etc.)
  if (!hasSession) {
    // Return fake 404 Not Found
    return NextResponse.rewrite(new URL('/_not-found', request.url));
  }

  return forwardNext();
}
