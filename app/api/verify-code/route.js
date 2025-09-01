import { doc, getDoc, deleteDoc, updateDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(req) {
  try {
    const { uid, code } = await req.json()
    if (!uid || !code) {
      return new Response(JSON.stringify({ error: "uid and code required" }), { status: 400 })
    }

    const verRef = doc(db, "emailVerifications", uid)
    let verSnap
    try {
      verSnap = await getDoc(verRef)
    } catch (firestoreError) {
      console.error("Firestore read error:", firestoreError)
      if (firestoreError.code === 'permission-denied') {
        return new Response(JSON.stringify({ 
          error: "Database access denied. Please check your Firebase configuration and security rules.",
          details: "The application cannot read from the database."
        }), { status: 500 })
      }
      throw firestoreError
    }

    if (!verSnap.exists()) {
      return new Response(JSON.stringify({ error: "No verification request found" }), { status: 404 })
    }

    const data = verSnap.data()
    const now = Date.now()

    if (now > data.expiresAt) {
      await deleteDoc(verRef).catch(() => {})
      return new Response(JSON.stringify({ error: "Code expired. Please request a new one." }), { status: 410 })
    }

    // Limit attempts
    if ((data.attempts ?? 0) >= 5) {
      await deleteDoc(verRef).catch(() => {})
      return new Response(JSON.stringify({ error: "Too many attempts. Please request a new code." }), { status: 429 })
    }

    if (data.code !== code) {
      // increment attempts
      try {
        await updateDoc(verRef, { attempts: (data.attempts ?? 0) + 1 })
      } catch (updateError) {
        console.error("Failed to update attempts:", updateError)
      }
      return new Response(JSON.stringify({ error: "Invalid code." }), { status: 400 })
    }

    // Mark user verified
    const userRef = doc(db, "users", uid)
    try {
      await updateDoc(userRef, { isVerified: true })
    } catch (updateError) {
      console.error("Failed to update user verification:", updateError)
      
      // if user doc doesn't exist for some reason, create it
      try {
        await setDoc(userRef, { 
          email: data.email, 
          isVerified: true, 
          createdAt: new Date().toISOString(),
          uid: uid
        })
      } catch (createError) {
        console.error("Error creating user doc on verify:", createError)
        if (createError.code === 'permission-denied') {
          return new Response(JSON.stringify({ 
            error: "Database access denied. Please check your Firebase configuration and security rules.",
            details: "The application cannot write to the database."
          }), { status: 500 })
        }
        throw createError
      }
    }

    // delete verification doc
    await deleteDoc(verRef).catch(() => {})

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error("verify-code error:", err)
    return new Response(JSON.stringify({ error: "Verification failed", details: err.message }), { status: 500 })
  }
}
