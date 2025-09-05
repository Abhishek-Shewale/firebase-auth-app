import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function POST(req) {
  try {
    const { uid, email } = await req.json()
    
    if (!uid || !email) {
      return NextResponse.json({ error: "UID and email are required" }, { status: 400 })
    }

    // Verify the user exists and is verified
    const userDoc = await adminDb.collection("users").doc(uid).get()
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    
    if (!userData.isVerified) {
      return NextResponse.json({ error: "User not verified" }, { status: 400 })
    }

    // Create a custom token for the user
    const customToken = await adminAuth.createCustomToken(uid)
    
    return NextResponse.json({ 
      success: true, 
      customToken,
      user: {
        uid,
        email: userData.email,
        userType: userData.userType,
        isVerified: userData.isVerified
      }
    })
  } catch (error) {
    console.error("Auto signin error:", error)
    return NextResponse.json({ error: "Failed to create signin token" }, { status: 500 })
  }
}
