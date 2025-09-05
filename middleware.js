import { NextResponse } from "next/server";

/**
 * Middleware: enforces simple auth guards for protected routes.
 *
 * Notes:
 * - We special-case /api/confirm-order so it can use its own TEST_CONFIRM_KEY
 *   validation inside the route (this allows dev-confirm flow using a test key).
 * - Other protected API routes still require an Authorization header (basic check).
 */

const protectedRoutes = [
  "/dashboard",
  "/api/get-affiliate-data",
  "/api/get-affiliate-orders",
  "/api/generate-affiliate-code",
  "/api/delete-affiliate-code",
  // '/api/confirm-order'  // intentionally NOT listed here; we special-case it below
];

const publicRoutes = [
  "/",
  "/products",
  "/api/track-click",
  "/api/send-verification",
  "/api/verify-code",
  "/api/get-user-email",
  "/api/get-user-uid",
  "/api/create-order",
  // you can add other truly public routes here
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow static assets, images, etc
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // If route is explicitly public -> let it through
  const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // If this is the confirm-order API, allow it to pass to the route handler.
  // The handler itself must validate the TEST_CONFIRM_KEY (server-side).
  if (pathname === "/api/confirm-order") {
    return NextResponse.next();
  }

  // If route is in protectedRoutes, perform basic checks:
  const isProtectedRoute = protectedRoutes.some((r) => pathname.startsWith(r));
  if (isProtectedRoute) {
    // For API protected routes, expect an Authorization header with Bearer token (Firebase ID token)
    if (pathname.startsWith("/api/")) {
      const authHeader = request.headers.get("authorization") || "";
      const idToken = authHeader?.replace("Bearer ", "").trim();

      if (!idToken) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // basic sanity check for token format
      if (idToken.length < 10) {
        return NextResponse.json({ error: "Invalid token format" }, { status: 401 });
      }

      // allow to proceed; real verification happens inside route handlers with Admin SDK
      return NextResponse.next();
    }

    // For page routes we allow middleware to pass and rely on client-side redirect logic
    return NextResponse.next();
  }

  // Default: allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static, _next/image, favicon.ico, images, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
