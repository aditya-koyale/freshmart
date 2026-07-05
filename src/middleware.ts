import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Protects every /admin and /api/admin route. Per SRS Part 4 §2, the
 * admin area must be inaccessible without authentication and must never
 * grant access to a CUSTOMER-role account.
 *
 * /admin/login is the one admin path that must remain publicly accessible
 * (it IS the login page). We handle it explicitly in the inner function:
 * - Unauthenticated  → let the page render (NextResponse.next())
 * - ADMIN role       → redirect to dashboard (already logged in)
 * - CUSTOMER role    → redirect to dashboard login
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isLoginPage = req.nextUrl.pathname === '/admin/login';

    if (isLoginPage) {
      if (token?.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.next();
    }

    if (req.nextUrl.pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    if (
      req.nextUrl.pathname.startsWith('/api/admin') &&
      token?.role !== 'ADMIN'
    ) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/admin/login',
    },
  },
);

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
