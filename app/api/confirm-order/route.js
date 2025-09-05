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
      // return existing commission if present
      return NextResponse.json({ ok: true, message: "Order already paid", commission: order.commission || 0 });
    }

    const total = Number(order.total || 0);
    const codeRaw = order.affiliateCode || order.firstRefCode || null;
    const code = typeof codeRaw === "string" ? codeRaw.trim().toUpperCase() : null;

    // mark paid (status + paidAt)
    await orderRef.set(
      {
        status: "paid",
        paidAt: FieldValue.serverTimestamp(),
        paymentMethod: "TEST",
      },
      { merge: true }
    );

    // credit affiliate (with self-referral guard)
    let credited = false;
    let commission = 0;

    // Skip commission for prebook orders
    if (order.isPrebook) {
      await orderRef.set({ commission: 0, commissionStatus: "not_applicable" }, { merge: true });
    } else if (code && total > 0) {
      // mapping: prefer affiliatesByCode mapping; fallback to query
      const mapSnap = await adminDb.collection("affiliatesByCode").doc(code).get();
      let affiliateUid = null;
      if (mapSnap.exists) {
        affiliateUid = mapSnap.data()?.uid || null;
      }
      if (!affiliateUid) {
        const q = await adminDb.collection("affiliates").where("code", "==", code).limit(1).get();
        if (!q.empty) affiliateUid = q.docs[0].id;
      }

      const orderCustomerUid = order.customerUid || null;

      if (affiliateUid && orderCustomerUid && affiliateUid === orderCustomerUid) {
        // Self-order -- skip crediting
        commission = 0;
        credited = false;
        await orderRef.set({ commission: 0, commissionStatus: "skipped_self" }, { merge: true });
      } else if (affiliateUid) {
        const affRef = adminDb.collection("affiliates").doc(affiliateUid);
        const affSnap = await affRef.get();
        const rate =
          affSnap.exists && typeof affSnap.data().commissionRate === "number"
            ? affSnap.data().commissionRate
            : 0.10; // default 10%
        commission = Math.round(total * rate);

        // update affiliate counters
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
        // persist commissionStatus below
      }
    } else if (!order.isPrebook) {
      // no code or zero total: ensure commission exists as 0 (only for non-prebook orders)
      await orderRef.set({ commission: 0, commissionStatus: "unsettled" }, { merge: true });
    }

    // persist commission into the order document (important!)
    if (commission > 0) {
      await orderRef.set({ commission, commissionStatus: credited ? "credited" : "unsettled" }, { merge: true });
    } else if (!order.isPrebook) {
      // ensure commission field exists (0) and commissionStatus is set (only for non-prebook orders)
      const statusVal = credited ? "credited" : (order.commissionStatus || "unsettled");
      await orderRef.set({ commission: 0, commissionStatus: statusVal }, { merge: true });
    }

    // send email to customer (best-effort)
    try {
      const email = order?.customer?.email;
      if (email) {
        const orderType = order.isPrebook ? "Prebook" : (order.type === "public" ? "Public" : "Affiliate");
        const subject = `Your Student AI ${orderType.toLowerCase()} order is confirmed — #${orderId}`;
        
        let commissionText = '';
        if (!order.isPrebook && commission > 0) {
          commissionText = `<p><b>Referral Commission:</b> ₹${commission}</p>`;
        } else if (!order.isPrebook) {
          commissionText = `<p><b>Referral Commission:</b> ₹0 (No referral code applied)</p>`;
        }
        
        const html = `
          <div style="font-family:Inter,system-ui,Arial,sans-serif;max-width:560px;margin:auto;padding:20px">
            <h2>Thanks for your ${orderType.toLowerCase()} order! 🎉</h2>
            <p>Your ${orderType.toLowerCase()} order <b>#${orderId}</b> has been confirmed and payment received.</p>
            <p><b>Product(s):</b> ${order.items?.map(i => i.productName).join(", ") || order.productName || ""}</p>
            <p><b>Total Amount:</b> ₹${total}</p>
            ${commissionText}
            <hr/>
            <p><b>Delivery Address:</b></p>
            <p>${order.customer?.name}<br/>
            ${order.customer?.address?.addressLine}<br/>
            ${order.customer?.address?.addressLine2 ? order.customer.address.addressLine2 + '<br/>' : ''}
            ${order.customer?.address?.city}, ${order.customer?.address?.state} ${order.customer?.address?.pincode}<br/>
            ${order.customer?.address?.country}</p>
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
