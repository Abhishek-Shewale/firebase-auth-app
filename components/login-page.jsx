"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import UserTypeSelector from "@/components/user-type-selector"
import AuthMethodSelector from "@/components/auth-method-selector"
import EmailAuthForm from "@/components/email-auth-form"
import PhoneAuthForm from "@/components/phone-auth-form"
import EmailVerification from "@/components/email-verification"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoginPage({ verified, email }) {
  const [step, setStep] = useState("userType")
  const [selectedUserType, setSelectedUserType] = useState("")
  const [selectedAuthMethod, setSelectedAuthMethod] = useState("")
  const [showVerification, setShowVerification] = useState(false)
  const [pendingEmail, setPendingEmail] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleUserTypeSelect = (type) => {
    setSelectedUserType(type)
    setStep("authMethod")
  }

  const handleAuthMethodSelect = (method) => {
    setSelectedAuthMethod(method)
    setStep(method === "email" ? "emailAuth" : "phoneAuth")
  }

  const handleBack = () => {
    if (showVerification) {
      setShowVerification(false)
      setPendingEmail("")
    } else if (step === "authMethod") {
      setStep("userType")
      setSelectedUserType("")
    } else if (step === "emailAuth" || step === "phoneAuth") {
      setStep("authMethod")
      setSelectedAuthMethod("")
    }
  }

  const handleEmailVerificationStart = (email) => {
    setPendingEmail(email)
    setShowVerification(true)
  }

  const handleVerificationComplete = () => {
    setShowVerification(false)
    setPendingEmail("")
    setStep("emailAuth")
  }

  // Handle verification success message
  useEffect(() => {
    if (verified === "true" && email) {
      setSuccessMessage(`Email verified successfully! You can now sign in with ${email}`)
      setStep("emailAuth")
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [verified, email])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Welcome</h1>
          <p className="text-muted-foreground">Secure authentication for professionals</p>
        </div>

        {/* Back Button - Show when not on first step */}
        {(step !== "userType" || showVerification) && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center space-x-2 text-muted-foreground cursor-pointer hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        )}

        {/* Main Content */}
        <Card className="w-full">
          <CardContent className="p-6">
            {showVerification ? (
              <EmailVerification
                email={pendingEmail}
                onComplete={handleVerificationComplete}
                onBack={handleBack}
              />
            ) : (
              <>
                {step === "userType" && (
                  <UserTypeSelector
                    selectedType={selectedUserType}
                    onTypeSelect={handleUserTypeSelect}
                  />
                )}

                {step === "authMethod" && (
                  <AuthMethodSelector
                    selectedMethod={selectedAuthMethod}
                    onMethodSelect={handleAuthMethodSelect}
                  />
                )}

                {step === "emailAuth" && (
                  <EmailAuthForm
                    userType={selectedUserType}
                    onBack={handleBack}
                    onVerificationStart={handleEmailVerificationStart}
                    successMessage={successMessage}
                  />
                )}

                {step === "phoneAuth" && (
                  <PhoneAuthForm
                    userType={selectedUserType}
                    onBack={handleBack}
                    successMessage={successMessage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}
