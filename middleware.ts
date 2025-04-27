// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the pages that require authentication
const protectedRoutes = ['/admin/attendance'];
const loginRoute = '/admin/login';
const authCookieName = 'admin-auth'; // Choose a cookie name

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAuthenticated = request.cookies.has(authCookieName);

    // Check if the requested path is protected
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // If accessing a protected route and not authenticated, redirect to login
    if (isProtectedRoute && !isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = loginRoute;
        // Optionally add a redirect query param: url.searchParams.set('redirectedFrom', pathname);
        return NextResponse.redirect(url);
    }

    // If accessing the login route and already authenticated, redirect to admin home
    if (pathname === loginRoute && isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/attendance'; // Or your main admin page
        return NextResponse.redirect(url);
    }

    // Allow the request to proceed
    return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
    matcher: ['/admin/attendance/:path*', '/admin/login'],
}; 