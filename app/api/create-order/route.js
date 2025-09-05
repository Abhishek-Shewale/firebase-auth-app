import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { withAuth } from "@/lib/auth-utils"

async function createOrderHandler(req) {
  try {
    const body = await req.json()

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
      createdAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ ok: true, orderId })
  } catch (err) {
    console.error("Error creating order:", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}

// Export the handler wrapped with authentication
export const POST = withAuth(createOrderHandler)
