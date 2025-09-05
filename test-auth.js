/**
 * Authentication Test Script
 * 
 * This script helps verify that your authentication setup is working correctly.
 * Run this with: node test-auth.js
 */

const testRoutes = [
  {
    name: "Public Routes (should be accessible without auth)",
    routes: [
      "http://localhost:3000/",
      "http://localhost:3000/products",
      "http://localhost:3000/api/track-click?ref=TEST123"
    ]
  },
  {
    name: "Protected Routes (should require authentication)",
    routes: [
      "http://localhost:3000/dashboard",
      "http://localhost:3000/api/create-order",
      "http://localhost:3000/api/get-affiliate-data?uid=test123"
    ]
  }
]

async function testRoute(url, shouldRequireAuth = false) {
  try {
    const response = await fetch(url, {
      method: shouldRequireAuth ? 'POST' : 'GET',
      headers: shouldRequireAuth ? {} : { 'Content-Type': 'application/json' },
      body: shouldRequireAuth ? JSON.stringify({ test: true }) : undefined
    })
    
    if (shouldRequireAuth) {
      if (response.status === 401) {
        return "✅ Correctly requires authentication"
      } else {
        return `❌ Should require auth but got status ${response.status}`
      }
    } else {
      if (response.status === 200 || response.status === 404) {
        return "✅ Accessible without authentication"
      } else {
        return `❌ Should be accessible but got status ${response.status}`
      }
    }
  } catch (error) {
    return `❌ Error: ${error.message}`
  }
}

async function runTests() {
  console.log("🔐 Testing Authentication Setup\n")
  
  for (const testGroup of testRoutes) {
    console.log(`\n📋 ${testGroup.name}`)
    console.log("=" .repeat(50))
    
    for (const route of testGroup.routes) {
      const shouldRequireAuth = testGroup.name.includes("Protected")
      const result = await testRoute(route, shouldRequireAuth)
      console.log(`${route}: ${result}`)
    }
  }
  
  console.log("\n" + "=" .repeat(50))
  console.log("✅ Authentication test completed!")
  console.log("\n📝 Manual Tests to Perform:")
  console.log("1. Try accessing /dashboard without logging in - should redirect to /")
  console.log("2. Try accessing /products without logging in - should work")
  console.log("3. Log in and try accessing /dashboard - should work")
  console.log("4. Log out and try accessing /dashboard again - should redirect to /")
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { testRoute, runTests }
