"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function EmailAuthForm({ userType, onVerificationStart, successMessage }) {
  const router = useRouter()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(successMessage || "")
  const [hasRedirected, setHasRedirected] = useState(false)

  const { signIn, signUp } = useAuth()

  const togglePasswordVisibility = () => setShowPassword(!showPassword)
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword)

  // Convert Firebase errors to user-friendly messages
  const getErrorMessage = (error) => {
    const errorCode = error.code || error.message

    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please check your credentials and try again.'
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.'
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait a moment and try again.'
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.'
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled. Please contact support.'
      default:
        // Check if it's a Firebase error format
        if (errorCode.includes('auth/')) {
          return 'An authentication error occurred. Please try again.'
        }
        return error.message || 'Something went wrong. Please try again.'
    }
  }

  // ✅ Signup / Login submit (FIXED to use parent verification)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    setHasRedirected(false)

    try {
      if (isLogin) {
        // LOGIN FLOW
        const result = await signIn(email, password)

        if (result.success && result.requiresVerification) {
          // User exists but not verified → notify parent to show verification
          setSuccess("Please verify your email to continue.")
          if (onVerificationStart) {
            onVerificationStart(email) // This triggers parent's verification UI
          }
        } else if (result.success && !result.requiresVerification) {
          // User is verified → go to profile
          setSuccess("Signed in successfully!")
          // Redirect directly to profile after a short delay
          if (!hasRedirected) {
            setHasRedirected(true)
            setTimeout(() => {
              router.push("/profile")
            }, 1500)
          }
        } else {
          // Login failed
          throw new Error(result.error || "Sign in failed")
        }
      } else {
        // SIGNUP FLOW
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match")
        }

        const result = await signUp(email, password, userType)

        if (result.success && result.requiresVerification) {
          // New user created → notify parent to show verification
          setSuccess("Account created! Please verify your email.")
          if (onVerificationStart) {
            onVerificationStart(email) // This triggers parent's verification UI
          }
        } else if (!result.success) {
          throw new Error(result.error || "Signup failed")
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">{isLogin ? "Sign In" : "Create Account"}</CardTitle>
        <p className="text-muted-foreground">{isLogin ? "Welcome back!" : "Join us today"}</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trimStart())}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4 cursor-pointer" /> : <Eye className="h-4 w-4 cursor-pointer" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 cursor-pointer" /> : <Eye className="h-4 w-4 cursor-pointer" />}
                </button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLogin ? "Signing in..." : "Creating account..."}
              </>
            ) : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Toggle Login / Signup */}
        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError("")
              setSuccess("")
            }}
            className="text-primary hover:underline cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </CardContent>
    </div>
  )
}