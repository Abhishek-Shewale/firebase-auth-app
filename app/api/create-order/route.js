import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ ok: false, error: "Content-Type must be application/json" }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("create-order: invalid json", e);
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    // Basic validation / extract fields
    const {
      productId,
      productName,
      price,
      quantity = 1,
      total,
      affiliateCode,
      customer,
      customerUid,
      items: incomingItems,
      type,
      isPrebook
    } = body || {};

    if (!customer || !customer.email) {
      return NextResponse.json({ ok: false, error: "Missing customer email" }, { status: 400 });
    }

    // determine finalAffiliateCode with self-referral guard
    let finalAffiliateCode = (affiliateCode && typeof affiliateCode === "string") ? affiliateCode.trim().toUpperCase() : null;

    if (finalAffiliateCode && customerUid) {
      // try mapping collection first
      try {
        const mapSnap = await adminDb.collection("affiliatesByCode").doc(finalAffiliateCode).get();
        let affiliateUid = null;
        if (mapSnap.exists) affiliateUid = mapSnap.data()?.uid || null;

        if (!affiliateUid) {
          const q = await adminDb.collection("affiliates").where("code", "==", finalAffiliateCode).limit(1).get();
          if (!q.empty) affiliateUid = q.docs[0].id;
        }

        if (affiliateUid && affiliateUid === customerUid) {
          // self-referral: drop code
          finalAffiliateCode = null;
        }
      } catch (e) {
        console.error("create-order: affiliate lookup error", e);
        // if affiliate lookup fails, safest is to keep finalAffiliateCode as-is (or drop it). We'll keep as-is only if no match found.
      }
    }

    // compute items & total
    let items = [];
    if (Array.isArray(incomingItems) && incomingItems.length) {
      items = incomingItems.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        total: Number(it.total || (Number(it.price || 0) * Number(it.quantity || 1)))
      }));
    } else if (productId) {
      const parsedPrice = Number(price || 0);
      const parsedQuantity = Number(quantity || 1);
      const parsedTotal = Number(total != null ? total : parsedPrice * parsedQuantity);
      items = [{
        productId,
        productName,
        price: parsedPrice,
        quantity: parsedQuantity,
        total: parsedTotal
      }];
    } else {
      return NextResponse.json({ ok: false, error: "No items provided" }, { status: 400 });
    }

    const computedTotal = items.reduce((s, it) => s + (it.total || 0), 0);

    // create order doc
    const orderRef = adminDb.collection("orders").doc();
    const orderId = orderRef.id;

    const orderPayload = {
      items,
      total: computedTotal,
      affiliateCode: finalAffiliateCode || null,
      customer,
      customerUid: customerUid || null,
      status: "pending",
      type: type || (isPrebook ? "prebook" : "public"),
      isPrebook: Boolean(isPrebook),
      commission: isPrebook ? 0 : (finalAffiliateCode ? 0 : 0), // Commission calculated on payment confirmation
      commissionStatus: isPrebook ? "not_applicable" : "unsettled",
      paymentMethod: null,
      createdAt: FieldValue.serverTimestamp(),
      paidAt: null
    };

    await orderRef.set(orderPayload);

    return NextResponse.json({ ok: true, orderId }, { status: 201 });
  } catch (err) {
    console.error("create-order error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
