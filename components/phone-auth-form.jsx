"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Phone } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function PhoneAuthForm({ userType, onBack, onVerificationStart }) {
  const [step, setStep] = useState("phone") // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [confirmationResult, setConfirmationResult] = useState(null)
  const router = useRouter()

  const { signUpWithPhone, verifyPhoneOTP, setupRecaptcha } = useAuth()

  useEffect(() => {
    // Setup reCAPTCHA when component mounts
    let verifier = null
    let retryCount = 0
    const maxRetries = 3

    const initializeRecaptcha = () => {
      try {
        verifier = setupRecaptcha("recaptcha-container")
        if (!verifier && retryCount < maxRetries) {
          retryCount++
          setTimeout(initializeRecaptcha, 1000) // Retry after 1 second
        }
      } catch (error) {
        console.error('Failed to initialize reCAPTCHA:', error)
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(initializeRecaptcha, 1000) // Retry after 1 second
        }
      }
    }

    initializeRecaptcha()

    return () => {
      // Cleanup reCAPTCHA when component unmounts
      if (window.recaptchaVerifier && typeof window.recaptchaVerifier.clear === 'function') {
        try {
          window.recaptchaVerifier.clear()
        } catch (error) {
          console.log('Error clearing reCAPTCHA on unmount:', error)
        }
      }
    }
  }, [setupRecaptcha])

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber}`
      const result = await signUpWithPhone(formattedPhone, userType)

      if (result.success && result.confirmationResult) {
        setConfirmationResult(result.confirmationResult)
        setStep("otp")
        setSuccess("OTP sent successfully!")
      } else {
        throw new Error(result.error || "Failed to send OTP")
      }
    } catch (error) {
      setError(error.message)

      // If it's a reCAPTCHA error, suggest refreshing
      if (error.message.includes('reCAPTCHA')) {
        setError("reCAPTCHA error. Please refresh the page and try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await verifyPhoneOTP(confirmationResult, otp, userType)

      if (result.success) {
        setSuccess("Phone verified successfully! Redirecting...")
        // Redirect immediately to profile
        try {
          router.replace("/profile")
        } catch (routerError) {
          console.error("Router error:", routerError)
          // Fallback to window.location
          window.location.href = "/profile"
        }
      } else {
        throw new Error(result.error || "Verification failed")
      }
    } catch (error) {
      setError(error.message || "Invalid OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">{step === "phone" ? "Phone Verification" : "Enter OTP"}</CardTitle>
        <p className="text-muted-foreground">
          {step === "phone" ? "We'll send you a verification code" : "Enter the code sent to your phone"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Include country code (e.g., +1 for US)</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Code
            </Button>

            <Button type="button" variant="outline" className="w-full bg-transparent" onClick={() => setStep("phone")}>
              Back to Phone Number
            </Button>
          </form>
        )}

        <div className="text-center">
          <Button variant="link" onClick={onBack} className="text-sm">
            Back to method selection
          </Button>
        </div>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </CardContent>
    </div>
  )
}
