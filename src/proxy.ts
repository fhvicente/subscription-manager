import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
    // Presence check only (handles the __Secure- prefix too); API routes validate the session.
    const token = getSessionCookie(request);
    const { pathname } = request.nextUrl;

    // Define public routes that don't require authentication
    const publicRoutes = [
        "/",
        "/sign-in",
        "/sign-up",
        "/payment",
        "/payment/success",
        "/payment/cancel",
    ];
    const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    // Check if user is trying to access a protected route without being authenticated
    if (!token && !isPublicRoute) {
        // Redirect to sign-in page, preserving the original URL to redirect back after login
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(signInUrl);
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (token && (pathname === "/sign-in" || pathname === "/sign-up")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Specify which paths the proxy should run on
    matcher: [
        // Apply to all routes except for API routes, static files, etc.
        "/((?!api|_next/static|_next/image|.*\\..*).*)",
    ],
};
