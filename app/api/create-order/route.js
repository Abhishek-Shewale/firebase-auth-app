import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(req) {
  try {
    // Check if request has body
    const contentType = req.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ ok: false, error: "Content-Type must be application/json" }, { status: 400 })
    }

    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json({ ok: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: "Request body must be a valid object" }, { status: 400 })
    }

    // Extract affiliateCode + other order fields
    const { affiliateCode, ...rest } = body

    // Generate an order ID
    const orderRef = adminDb.collection("orders").doc()
    const orderId = orderRef.id

    // Create the order document
    await orderRef.set({
      ...rest,                        // customer details, items, totals
      affiliateCode: affiliateCode || null,
      status: "pending",              // always start as pending
      type: "public",                 // mark as public order (guest checkout)
      createdAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ ok: true, orderId })
  } catch (err) {
    console.error("Error creating order:", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
