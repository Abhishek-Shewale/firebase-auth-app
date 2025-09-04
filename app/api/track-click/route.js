import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const code = (searchParams.get("ref") || "").trim().toUpperCase()
    if (!code) {
      return NextResponse.json({ ok: false, error: "Missing ref" }, { status: 400 })
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const ua = req.headers.get("user-agent") || ""

    // 1) Log the click
    await adminDb.collection("affiliate_clicks").add({
      code,
      ip,
      ua,
      ts: FieldValue.serverTimestamp(), // better than new Date()
    })

    // 2) Increment clicks on the affiliate doc (if it exists)
    const q = await adminDb.collection("affiliates").where("code", "==", code).limit(1).get()
    if (!q.empty) {
      await q.docs[0].ref.set({ clicks: FieldValue.increment(1) }, { merge: true })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
