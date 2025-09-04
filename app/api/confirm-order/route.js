import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendEmail } from "@/lib/mailer";

export async function POST(req) {
  try {
    // auth guard
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!process.env.TEST_CONFIRM_KEY || token !== process.env.TEST_CONFIRM_KEY) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Missing orderId" }, { status: 400 });
    }

    // load order
    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }
    const order = orderSnap.data();
    if (order.status === "paid") {
      return NextResponse.json({ ok: true, message: "Order already paid" });
    }

    const total = Number(order.total || 0);
    const codeRaw = order.affiliateCode || order.firstRefCode || null;
    const code = typeof codeRaw === "string" ? codeRaw.trim().toUpperCase() : null;

    // mark paid
    await orderRef.set(
      {
        status: "paid",
        paidAt: FieldValue.serverTimestamp(),
        paymentMethod: "TEST",
      },
      { merge: true }
    );

    // credit affiliate
    let credited = false;
    let commission = 0;

    if (code && total > 0) {
      // mapping first
      const mapSnap = await adminDb.collection("affiliatesByCode").doc(code).get();
      let affRef = null;
      if (mapSnap.exists) {
        const { uid } = mapSnap.data() || {};
        if (uid) affRef = adminDb.collection("affiliates").doc(uid);
      }
      if (!affRef) {
        const q = await adminDb.collection("affiliates").where("code", "==", code).limit(1).get();
        if (!q.empty) affRef = q.docs[0].ref;
      }
      if (affRef) {
        const affSnap = await affRef.get();
        const rate =
          affSnap.exists && typeof affSnap.data().commissionRate === "number"
            ? affSnap.data().commissionRate
            : 0.10; // default 10%
        commission = Math.round(total * rate);
        await affRef.set(
          {
            totalOrders: FieldValue.increment(1),
            totalCommissions: FieldValue.increment(commission),
            revenueAttributed: FieldValue.increment(total),
            lastSaleAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
          
        );
        
        credited = true;
      }
    }

    // send email to customer (track your order)
    try {
      const email = order?.customer?.email;
      if (email) {
        const subject = `Your Student AI order is confirmed — #${orderId}`;
        const html = `
          <div style="font-family:Inter,system-ui,Arial,sans-serif;max-width:560px;margin:auto;padding:20px">
            <h2>Thanks for your purchase! 🎉</h2>
            <p>Your order <b>#${orderId}</b> has been confirmed.</p>
            <p><b>Product:</b> ${order.productName || ""}</p>
            <p><b>Total:</b> ₹${total}</p>
            <hr/>
            <p>You can track your order anytime using this ID: <b>${orderId}</b>.</p>
            <p>Keep this for your records. If you have questions, just reply to this email.</p>
            <p style="margin-top:24px">— Student AI Team</p>
          </div>
        `;
        await sendEmail({ to: email, subject, html });
      }
    } catch (e) {
      console.error("Email send error:", e);
      // do not fail the request if email fails
    }

    return NextResponse.json({ ok: true, credited, commission });
  } catch (err) {
    console.error("confirm-order error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
