import { auth } from './firebase'

/**
 * Get the current user's ID token for API authentication
 * @returns {Promise<string|null>} - ID token or null if not authenticated
 */
export async function getIdToken() {
  try {
    const user = auth.currentUser
    if (!user) {
      return null
    }
    
    return await user.getIdToken()
  } catch (error) {
    console.error('Error getting ID token:', error)
    return null
  }
}

/**
 * Make an authenticated API request
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export async function authenticatedFetch(url, options = {}) {
  const token = await getIdToken()
  
  if (!token) {
    throw new Error('User not authenticated')
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  }
  
  return fetch(url, {
    ...options,
    headers
  })
}

/**
 * Make an authenticated API request and parse JSON response
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<object>} - Parsed JSON response
 */
export async function authenticatedApiCall(url, options = {}) {
  const response = await authenticatedFetch(url, options)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }
  
  return response.json()
}
