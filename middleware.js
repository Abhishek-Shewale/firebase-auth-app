import { NextResponse } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/api/create-order',
  '/api/get-affiliate-data',
  '/api/get-affiliate-orders',
  '/api/generate-affiliate-code',
  '/api/delete-affiliate-code',
  '/api/confirm-order'
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/products',
  '/api/track-click',
  '/api/send-verification',
  '/api/verify-code',
  '/api/get-user-email',
  '/api/get-user-uid'
]

export async function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // If it's a protected route, we need to verify authentication
  if (isProtectedRoute) {
    // For API routes, we'll check for Firebase ID token in headers
    if (pathname.startsWith('/api/')) {
      const authHeader = request.headers.get('authorization')
      const idToken = authHeader?.replace('Bearer ', '')
      
      if (!idToken) {
        return NextResponse.json(
          { error: 'Authentication required' }, 
          { status: 401 }
        )
      }
      
      // For middleware, we'll do basic token validation
      // The actual Firebase Admin SDK verification will happen in the API route handlers
      // This prevents the Node.js compatibility issues in Edge Runtime
      if (idToken.length < 10) {
        return NextResponse.json(
          { error: 'Invalid token format' }, 
          { status: 401 }
        )
      }
      
      return NextResponse.next()
    }
    
    // For page routes, we'll let the client-side auth context handle the actual authentication check
    // The middleware will allow the request to proceed, but the page component will redirect if not authenticated
    return NextResponse.next()
  }
  
  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // For any other routes, allow access (you can modify this as needed)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
