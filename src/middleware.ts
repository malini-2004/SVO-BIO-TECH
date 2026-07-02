import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const isAdminCookie = request.cookies.get('is_admin')?.value;
  const { pathname } = request.nextUrl;

  // Add x-pathname header to forward pathname to server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // ── 1. Admin Login page ────────────────────────────────────────────────────
  // Always accessible, but redirect logged-in admins straight to dashboard
  if (pathname.startsWith('/admin/login')) {
    if (authToken && isAdminCookie === 'true') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // ── 2. Other /admin/* routes ───────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    // Not logged in at all → admin login
    if (!authToken) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Logged in but NOT an admin → admin login with error
    if (isAdminCookie !== 'true') {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }

    // Logged in and is admin — allow
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // ── 3. Other protected routes (/checkout, /profile) ───────────────────────
  const protectedRoutes = ['/checkout', '/profile'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 4. Standard login/signup — redirect logged-in users home ──────────────
  if ((pathname === '/login' || pathname === '/signup') && authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
