import admin from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(req) {
  try {
    const { uid } = await req.json()
    if (!uid) {
      return new Response(JSON.stringify({ error: "UID is required" }), { status: 400 })
    }

    // Get user data from users collection using Admin SDK
    const userDoc = await adminDb.collection("users").doc(uid).get()
    
    if (!userDoc.exists) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 })
    }

    const userData = userDoc.data()
    return new Response(JSON.stringify({ email: userData.email }), { status: 200 })
  } catch (err) {
    console.error("get-user-email error:", err)
    return new Response(JSON.stringify({ error: "Failed to get user email", details: err.message }), { status: 500 })
  }
}
