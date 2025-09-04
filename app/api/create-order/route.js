import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { updateAffiliateStats } from "@/lib/affiliate";

// POST /api/create-order
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      productId, productName, price, quantity, total,
      customer, affiliateCode
    } = body || {};

    if (!productId || !productName || !price || !quantity || !total || !customer?.email) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const now = new Date();

    // create pending order
    const docRef = await adminDb.collection("orders").add({
      productId,
      productName,
      price,
      quantity,
      total,
      status: "pending",          // will be 'paid' after Razorpay success
      affiliateCode: affiliateCode || null,
      customer,
      createdAt: now,
      updatedAt: now,
    });

    // NOTE: DO NOT update affiliate stats yet. Only after payment success.
    // You’ll call /api/confirm-order after Razorpay success and run updateAffiliateStats there.

    return NextResponse.json({ success: true, orderId: docRef.id });
  } catch (err) {
    console.error("create-order error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
