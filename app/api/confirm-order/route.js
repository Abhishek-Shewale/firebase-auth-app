import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { updateAffiliateStats } from "@/lib/affiliate";

export async function POST(req) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ success: false, error: "orderId required" }, { status: 400 });

    const ref = adminDb.collection("orders").doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });

    const order = snap.data();
    if (order.status === "paid") {
      return NextResponse.json({ success: true, message: "Already confirmed" });
    }

    // mark paid
    await ref.update({ status: "paid", updatedAt: new Date() });

    // credit affiliate (only if there was a ref)
    if (order.affiliateCode) {
      await updateAffiliateStats(order.affiliateCode, order.total);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("confirm-order error:", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
