import admin from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(req) {
  try {
    const { uid, code } = await req.json()
    if (!uid || !code) {
      return new Response(JSON.stringify({ error: "uid and code required" }), { status: 400 })
    }

    const verRef = adminDb.collection("emailVerifications").doc(uid)
    let verSnap
    try {
      verSnap = await verRef.get()
    } catch (firestoreError) {
      console.error("Firestore read error:", firestoreError)
      return new Response(JSON.stringify({ 
        error: "Database access error. Please try again.",
        details: firestoreError.message
      }), { status: 500 })
    }

    if (!verSnap.exists) {
      return new Response(JSON.stringify({ error: "No verification request found" }), { status: 404 })
    }

    const data = verSnap.data()
    const now = Date.now()

    if (now > data.expiresAt) {
      await verRef.delete().catch(() => {})
      return new Response(JSON.stringify({ error: "Code expired. Please request a new one." }), { status: 410 })
    }

    // Limit attempts
    if ((data.attempts ?? 0) >= 5) {
      await verRef.delete().catch(() => {})
      return new Response(JSON.stringify({ error: "Too many attempts. Please request a new code." }), { status: 429 })
    }

    if (data.code !== code) {
      // increment attempts
      try {
        await verRef.update({ attempts: (data.attempts ?? 0) + 1 })
      } catch (updateError) {
        console.error("Failed to update attempts:", updateError)
      }
      return new Response(JSON.stringify({ error: "Invalid code." }), { status: 400 })
    }

    // Mark user verified
    const userRef = adminDb.collection("users").doc(uid)
    try {
      await userRef.update({ isVerified: true })
    } catch (updateError) {
      console.error("Failed to update user verification:", updateError)
      
      // if user doc doesn't exist for some reason, create it
      try {
        await userRef.set({ 
          email: data.email, 
          isVerified: true, 
          createdAt: new Date().toISOString(),
          uid: uid
        })
      } catch (createError) {
        console.error("Error creating user doc on verify:", createError)
        return new Response(JSON.stringify({ 
          error: "Failed to create user account. Please try again.",
          details: createError.message
        }), { status: 500 })
      }
    }

    // delete verification doc
    await verRef.delete().catch(() => {})

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error("verify-code error:", err)
    return new Response(JSON.stringify({ error: "Verification failed", details: err.message }), { status: 500 })
  }
}
