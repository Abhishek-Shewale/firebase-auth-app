"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function EmailVerification({ email, onComplete, onBack }) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const router = useRouter()
  const { verifyEmailCode, sendCustomVerification } = useAuth()

  const handleVerify = async (e) => {
    e?.preventDefault()
    if (!email) {
      setError("Missing email. Please sign up again.")
      return
    }
    if (!code || code.length !== 6) {
      setError("Please enter a 6-digit code")
      return
    }

    try {
      setLoading(true)
      setError("")
      setInfo("")

      // Get the user's UID from the usersByEmail collection
      const response = await fetch("/api/get-user-uid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "User not found. Please sign up again.")
      }

      const { uid } = data

      // Verify the code using the auth context
      const result = await verifyEmailCode(uid, code.trim())
      
      if (result.success) {
        if (result.requiresSignIn) {
          // User needs to sign in manually
          setInfo("Email verified successfully! Please sign in to continue.")
          setTimeout(() => {
            onComplete?.()
            // Redirect to login page with success message
            router.push("/?verified=true&email=" + encodeURIComponent(email))
          }, 2000)
        } else {
          // Verification successful and user is already signed in
          setInfo("Email verified successfully! Redirecting...")
          setTimeout(() => {
            onComplete?.()
            router.push("/")
          }, 1500)
        }
      } else {
        throw new Error(result.error || "Verification failed")
      }
    } catch (error) {
      setError(error.message || "Verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      setLoading(true)
      setError("")
      setInfo("")

      if (!email) {
        throw new Error("Missing email. Please sign up again.")
      }

      // Get the user's UID from the usersByEmail collection
      const response = await fetch("/api/get-user-uid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "User not found. Please sign up again.")
      }

      const { uid } = data

      // Resend verification code using the auth context
      const result = await sendCustomVerification(uid, email)
      
      if (result.success) {
        setInfo("New code sent to your email.")
      } else {
        throw new Error(result.error || "Failed to resend code")
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Verify Your Email</h2>
        <p className="text-muted-foreground">
          Enter the 6-digit code sent to <span className="font-medium">{email}</span>
        </p>
      </div>

      {error && (
        <div
          className="text-sm text-destructive p-3 bg-destructive/10 rounded-md"
          role="status"
          aria-live="polite"
        >
          {error}
        </div>
      )}
      {info && (
        <div
          className="text-sm p-3 bg-primary/10 rounded-md"
          role="status"
          aria-live="polite"
        >
          {info}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => {
              setError("")
              setCode(e.target.value.replace(/\D/g, ""))
            }}
            className="text-center text-xl tracking-widest h-14"
            autoFocus
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || code.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Email"
          )}
        </Button>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Didn't receive a code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-primary hover:underline font-medium"
            >
              Resend code
            </button>
          </p>
        </div>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to sign up
        </button>
      </div>
    </div>
  )
}
