import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 })
    }

    // Get user UID from usersByEmail collection
    const userDoc = await getDoc(doc(db, "usersByEmail", email))
    
    if (!userDoc.exists()) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 })
    }

    const userData = userDoc.data()
    return new Response(JSON.stringify({ uid: userData.uid }), { status: 200 })
  } catch (err) {
    console.error("get-user-uid error:", err)
    return new Response(JSON.stringify({ error: "Failed to get user UID", details: err.message }), { status: 500 })
  }
}
