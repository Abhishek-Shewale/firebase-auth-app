"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  fetchSignInMethodsForEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCustomToken,
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? firebaseUser.uid : "No user")
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
  
          if (userDoc.exists()) {
            const userData = userDoc.data()
            console.log("User data from Firestore:", userData)
  
            if (userData.isVerified === true || userData.isPhoneVerified === true) {
              // ✅ merged user (Auth + Firestore)
              const mergedUser = {
                ...firebaseUser,
                ...userData,
                isVerifiedFinal: userData.isVerified === true || userData.isPhoneVerified === true
              }
              console.log("Setting verified user:", mergedUser.uid)
              setUser(mergedUser)
            } else {
              console.log("User not verified, setting to null")
              setUser(null)
            }
          } else {
            console.log("User doc not found, setting to null")
            setUser(null)
          }
        } catch (error) {
          console.error("Error checking user verification:", error)
          setUser(null)
        }
      } else {
        console.log("No Firebase user, setting to null")
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])
  
  // 🔹 Sign Up Flow (FIXED - prevent duplicates and improve error handling)
  const signUp = async (email, password, userType = null) => {
    try {
      // First, check if user already exists in Firebase Auth
      const signInMethods = await fetchSignInMethodsForEmail(auth, email)
      if (signInMethods.length > 0) {
        return { 
          success: false, 
          error: "Email already registered. Please sign in instead.",
          requiresVerification: false
        }
      }

      // Check if user exists in Firestore (in case of orphaned records)
      try {
        const existingUserDoc = await getDoc(doc(db, "usersByEmail", email))
        if (existingUserDoc.exists()) {
          return { 
            success: false, 
            error: "Email already registered. Please sign in instead.",
            requiresVerification: false
          }
        }
      } catch (firestoreError) {
        console.error("Error checking existing user in Firestore:", firestoreError)
        // Continue with signup if we can't check (permission issues)
      }

      // Create new user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const uid = result.user.uid

      try {
        // Create user doc in Firestore with email as document ID for easier lookup
        await setDoc(doc(db, "users", uid), {
          email,
          userType: userType ?? null,
          createdAt: new Date().toISOString(),
          isVerified: false,
          uid: uid, // Store uid for reference
        })

        // Also create a reference by email for easier lookup
        await setDoc(doc(db, "usersByEmail", email), {
          uid: uid,
          email: email,
          userType: userType ?? null,
          createdAt: new Date().toISOString(),
        })
      } catch (firestoreError) {
        console.error("Firestore write error:", firestoreError)
        // If Firestore fails, delete the Auth user to maintain consistency
        await result.user.delete()
        throw new Error("Failed to create user profile. Please check Firestore permissions and rules.")
      }

      // Trigger verification email
      const res = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, email }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // If email sending fails, clean up
        await result.user.delete()
        await deleteDoc(doc(db, "users", uid)).catch(() => {})
        await deleteDoc(doc(db, "usersByEmail", email)).catch(() => {})
        throw new Error(data.error || "Failed to send verification email")
      }

      // IMPORTANT: Sign out the user immediately after signup
      // This prevents them from being auto-logged in as unverified
      await signOut(auth)

      // Return success but don't set user state (they need to verify first)
      return { 
        success: true, 
        user: result.user,
        requiresVerification: true
      }
    } catch (err) {
      console.error("signUp error:", err)
      
      return { 
        success: false, 
        error: getAuthErrorMessage(err),
        requiresVerification: false
      }
    }
  }

  // 🔹 Setup reCAPTCHA for phone authentication
  const setupRecaptcha = (containerId) => {
    if (typeof window !== 'undefined') {
      try {
        // Clear any existing reCAPTCHA safely
        if (window.recaptchaVerifier && typeof window.recaptchaVerifier.clear === 'function') {
          try {
            window.recaptchaVerifier.clear()
          } catch (clearError) {
            console.log('Error clearing previous reCAPTCHA:', clearError)
          }
        }
        
        // Create new reCAPTCHA verifier
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved')
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired')
          }
        })
        
        return window.recaptchaVerifier
      } catch (error) {
        console.error('Error setting up reCAPTCHA:', error)
        return null
      }
    }
    return null
  }

  // 🔹 Phone Sign Up Flow with Firebase Auth
  const signUpWithPhone = async (phoneNumber, userType = null) => {
    try {
      // Check if phone number already exists in Firestore
      try {
        const existingUserDoc = await getDoc(doc(db, "usersByPhone", phoneNumber))
        if (existingUserDoc.exists()) {
          return { 
            success: false, 
            error: "Phone number already registered. Please sign in instead.",
            requiresVerification: false
          }
        }
      } catch (firestoreError) {
        console.error("Error checking existing user in Firestore:", firestoreError)
        // Continue with signup if we can't check (permission issues)
      }

      // Use Firebase's built-in phone authentication
      if (!window.recaptchaVerifier) {
        // Try to setup reCAPTCHA again
        const verifier = setupRecaptcha("recaptcha-container")
        if (!verifier) {
          throw new Error("reCAPTCHA initialization failed. Please refresh the page and try again.")
        }
      }

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
      
      // Return the confirmation result for OTP verification
      return { 
        success: true, 
        confirmationResult,
        requiresVerification: true
      }
    } catch (err) {
      console.error("signUpWithPhone error:", err)
      
      // Provide more helpful error messages
      if (err.code === 'auth/invalid-phone-number') {
        return { 
          success: false, 
          error: "Invalid phone number format. Please include country code (e.g., +1 for US)",
          requiresVerification: false
        }
      } else if (err.code === 'auth/too-many-requests') {
        return { 
          success: false, 
          error: "Too many attempts. Please wait a while before trying again.",
          requiresVerification: false
        }
      } else if (err.message.includes('reCAPTCHA')) {
        return { 
          success: false, 
          error: "reCAPTCHA error. Please refresh the page and try again.",
          requiresVerification: false
        }
      }
      
      return { 
        success: false, 
        error: err.message || "Phone signup failed",
        requiresVerification: false
      }
    }
  }

  // 🔹 Verify Phone OTP with Firebase Auth
  const verifyPhoneOTP = async (confirmationResult, otp, userType = null) => {
    try {
      const result = await confirmationResult.confirm(otp)
      
      if (result.user) {
        // User is now authenticated with Firebase
        const uid = result.user.uid
        
        try {
          // Create user doc in Firestore
          await setDoc(doc(db, "users", uid), {
            phoneNumber: result.user.phoneNumber,
            userType: userType ?? null,
            createdAt: new Date().toISOString(),
            isPhoneVerified: true,
            uid: uid,
          })

          // Also create a reference by phone for easier lookup
          await setDoc(doc(db, "usersByPhone", result.user.phoneNumber), {
            uid: uid,
            phoneNumber: result.user.phoneNumber,
            userType: userType ?? null,
            createdAt: new Date().toISOString(),
          })
        } catch (firestoreError) {
          console.error("Firestore write error:", firestoreError)
          // Even if Firestore fails, the user is authenticated
          // We can handle this gracefully
        }
        
        return { success: true, user: result.user }
      } else {
        throw new Error("Phone verification failed")
      }
    } catch (err) {
      console.error("verifyPhoneOTP error:", err)
      return { 
        success: false, 
        error: err.message || "Invalid OTP. Please try again."
      }
    }
  }

  // Convert Firebase errors to user-friendly messages
  const getAuthErrorMessage = (error) => {
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

  // 🔹 Sign In Flow (FIXED - handle unverified users)
  const signIn = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const uid = result.user.uid

      const userDoc = await getDoc(doc(db, "users", uid))
      
      if (!userDoc.exists()) {
        await signOut(auth)
        return { success: false, error: "User not found. Please sign up first." }
      }

      const userData = userDoc.data()
      
      // If user is not verified, sign them out and require verification
      if (userData.isVerified !== true) {
        await signOut(auth) // Sign them out immediately
        
        // Send fresh verification code
        try {
          await fetch("/api/send-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, email }),
          })
        } catch (verifyErr) {
          console.error("Failed to send verification on login:", verifyErr)
        }
        
        return { 
          success: true, 
          requiresVerification: true,
          tempUser: result.user // Pass temp user for verification
        }
      }

      // User is verified - they'll be set by onAuthStateChanged
      return { success: true, user: result.user, requiresVerification: false }
    } catch (err) {
      return { success: false, error: getAuthErrorMessage(err) }
    }
  }

  // 🔹 Resend verification code
  const sendCustomVerification = async (uid, email) => {
    try {
      const res = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to send verification email")
      return { success: true }
    } catch (err) {
      console.error("sendCustomVerification error:", err)
      return { success: false, error: err.message || "Failed to send verification email" }
    }
  }

  // 🔹 Verify email code (updates Firestore users/{uid}.isVerified)
  const verifyEmailCode = async (uid, code) => {
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Verification failed")
      
      // After successful verification, try to auto-sign in the user
      try {
        // Get the user's email from the usersByEmail collection
        const userEmailRes = await fetch("/api/get-user-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        })
        
        if (userEmailRes.ok) {
          const { email } = await userEmailRes.json()
          
          // Try to get a custom token for auto sign-in
          const signInRes = await fetch("/api/auto-signin-verified", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, email }),
          })
          
          if (signInRes.ok) {
            const { customToken } = await signInRes.json()
            
            // Sign in the user with the custom token
            await signInWithCustomToken(auth, customToken)
            
            // User is now signed in
            return { success: true, requiresSignIn: false }
          }
        }
      } catch (autoSignInError) {
        console.error("Auto sign-in failed:", autoSignInError)
      }
      
      // If auto sign-in fails, redirect to login page
      try {
        const userEmailRes = await fetch("/api/get-user-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        })
        
        if (userEmailRes.ok) {
          const { email } = await userEmailRes.json()
          return { success: true, requiresSignIn: true, email }
        }
      } catch (signInError) {
        console.error("Error getting user email for sign in:", signInError)
      }
      
      return { success: true, requiresSignIn: true }
    } catch (err) {
      console.error("verifyEmailCode error:", err)
      return { success: false, error: err.message || "Verification failed" }
    }
  }



  // 🔹 Logout
  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signUpWithPhone,
        verifyPhoneOTP,
        setupRecaptcha,
        signIn,
        logout,
        sendCustomVerification,
        verifyEmailCode,
      }}
    >
      {!loading ? children : null}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}