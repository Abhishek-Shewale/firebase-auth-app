import { adminAuth } from './firebase-admin'

/**
 * Verify Firebase ID token from request headers
 * @param {Request} request - The incoming request
 * @returns {Promise<{user: object, error: string|null}>}
 */
export async function verifyAuthToken(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authorization header found' }
    }
    
    const idToken = authHeader.replace('Bearer ', '')
    
    if (!idToken) {
      return { user: null, error: 'No ID token provided' }
    }
    
    // Verify the token with Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    return { user: decodedToken, error: null }
  } catch (error) {
    console.error('Token verification failed:', error)
    
    if (error.code === 'auth/id-token-expired') {
      return { user: null, error: 'Token expired' }
    } else if (error.code === 'auth/invalid-id-token') {
      return { user: null, error: 'Invalid token' }
    } else {
      return { user: null, error: 'Token verification failed' }
    }
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 * @param {Function} handler - The API route handler
 * @returns {Function} - Wrapped handler with authentication
 */
export function withAuth(handler) {
  return async (request) => {
    const { user, error } = await verifyAuthToken(request)
    
    if (error || !user) {
      return new Response(
        JSON.stringify({ error: error || 'Authentication required' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Add user to request object for the handler to use
    request.user = user
    return handler(request)
  }
}

/**
 * Alternative auth wrapper that doesn't require Firebase Admin SDK
 * Use this for routes that need basic authentication checks
 * @param {Function} handler - The API route handler
 * @returns {Function} - Wrapped handler with basic authentication
 */
export function withBasicAuth(handler) {
  return async (request) => {
    const authHeader = request.headers.get('authorization')
    const idToken = authHeader?.replace('Bearer ', '')
    
    if (!idToken || idToken.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Basic token validation - actual verification happens in the handler if needed
    request.idToken = idToken
    return handler(request)
  }
}

/**
 * Get user data from Firestore using UID
 * @param {string} uid - User ID
 * @returns {Promise<object|null>} - User data or null
 */
export async function getUserData(uid) {
  try {
    const { adminDb } = await import('./firebase-admin')
    const userDoc = await adminDb.collection('users').doc(uid).get()
    
    if (!userDoc.exists) {
      return null
    }
    
    return userDoc.data()
  } catch (error) {
    console.error('Error getting user data:', error)
    return null
  }
}
