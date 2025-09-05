"use client"

import { useAuth } from "@/contexts/auth-context"
import LoginPage from "@/components/login-page"
import { Loader2 } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const verified = searchParams.get("verified")
  const email = searchParams.get("email")
  const router = useRouter()

  useEffect(() => {
    console.log("Main page - user state:", user)
    if (user && user.isVerifiedFinal) {
      console.log("User is verified, redirecting to profile")
      // Use replace to avoid back button issues and ensure clean navigation
      try {
        router.replace("/profile")
      } catch (routerError) {
        console.error("Router error:", routerError)
        // Fallback to window.location
        window.location.href = "/profile"
      }
    }
  }, [user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // show login page if not logged in
  return <LoginPage verified={verified} email={email} />
}
