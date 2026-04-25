import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/verify', '/api/departments'];
const authPages = ['/login', '/register'];

// Define role-based route access
const roleRoutes: { [key: string]: string[] } = {
  student: ['/student'],
  lab_faculty: ['/faculty'],
  faculty_coordinator: ['/coordinator'],
  hod: ['/hod'],
  principal: ['/principal'],
};

function isRouteMatch(pathname: string, route: string): boolean {
  if (route === '/') {
    return pathname === '/';
  }
  return pathname === route || pathname.startsWith(`${route}/`);
}

function getRoleDashboard(role: string): string {
  const allowedRoutes = roleRoutes[role] || [];
  const baseRoute = allowedRoutes[0] || '/';
  return `${baseRoute}/dashboard`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthApiRoute = pathname.startsWith('/api/auth');
  const isPublicRoute = publicRoutes.some((route) => isRouteMatch(pathname, route));
  const isAuthPage = authPages.some((route) => isRouteMatch(pathname, route));
  const token = request.cookies.get('auth_token')?.value;

  // If an authenticated user tries to open login/register, redirect to dashboard.
  if (isAuthPage && token) {
    const payload = await verifyToken(token);
    if (payload) {
      return NextResponse.redirect(new URL(getRoleDashboard(payload.role), request.url));
    }
  }

  // Allow public pages and auth APIs.
  if (isPublicRoute || isAuthApiRoute) {
    return NextResponse.next();
  }

  // Check for auth token
  if (!token) {
    // Redirect to login if no token
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Verify token
  const payload = await verifyToken(token);

  if (!payload) {
    // Invalid token, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  // Check role-based access
  const userRole = payload.role;
  const allowedRoutes = roleRoutes[userRole] || [];

  // Check if user is accessing a role-specific route
  const isRoleRoute = Object.values(roleRoutes)
    .flat()
    .some((route) => pathname.startsWith(route));

  if (isRoleRoute) {
    const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));

    if (!hasAccess) {
      // Redirect to appropriate dashboard
      return NextResponse.redirect(new URL(getRoleDashboard(userRole), request.url));
    }
  }

  // Add user info to headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-email', payload.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
