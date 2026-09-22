import { type NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/admin/:path*']
};

/**
 * Edge Middleware for Admin Security.
 * Rewrites any unauthorized visitor or crawler to /_not-found (HTTP 404)
 * to prevent reconnaissance, and strictly isolates admin sessions from customer sessions (E-COM-015).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminCookie = request.cookies.get('hh_admin_session')?.value;
  const hasAdminSession = Boolean(adminCookie);

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
    // If already authenticated with an admin session cookie, redirect to /admin/orders
    if (hasAdminSession) {
      return NextResponse.redirect(new URL('/admin/orders', request.url));
    }

    return forwardNext();
  }

  // 2. All Protected Admin Routes (/admin, /admin/orders, /admin/inventory, etc.)
  // Customer sessions (hh_session) can NEVER access protected admin routes
  if (!hasAdminSession) {
    // Return stealth 404 Not Found
    return NextResponse.rewrite(new URL('/_not-found', request.url));
  }

  return forwardNext();
}
