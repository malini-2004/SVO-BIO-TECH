import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Protected routes list
  const protectedRoutes = ['/checkout', '/admin', '/profile'];
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // ⚠️ The /admin/login route should be accessible without a token
  if (pathname.startsWith('/admin/login')) {
    if (authToken) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // If user is trying to access a protected route without a token, redirect to appropriate login
  if (isProtectedRoute && !authToken) {
    // If it's an admin route, redirect to admin login
    if (pathname.startsWith('/admin')) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Otherwise redirect to standard login (even if it doesn't exist yet, it's the correct path)
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and tries to access standard login/signup, redirect to home
  if ((pathname === '/login' || pathname === '/signup') && authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
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
