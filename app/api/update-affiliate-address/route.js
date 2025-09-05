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
      console.error("update-affiliate-address: invalid json", e);
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const { uid, addressId, addressData } = body || {};

    if (!uid || !addressId || !addressData) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Update the address in the user's addresses subcollection
    const addressRef = adminDb.collection("users").doc(uid).collection("addresses").doc(addressId);
    
    const updateData = {
      ...addressData,
      updatedAt: FieldValue.serverTimestamp()
    };

    await addressRef.update(updateData);

    // If this is the default address and email changed, update affiliate record
    if (addressData.contactEmail) {
      const userRef = adminDb.collection("users").doc(uid);
      const userSnap = await userRef.get();
      
      if (userSnap.exists) {
        const userData = userSnap.data();
        if (userData.defaultAddressId === addressId) {
          // Update affiliate record with new email
          const affiliateRef = adminDb.collection("affiliates").doc(uid);
          await affiliateRef.update({
            email: addressData.contactEmail,
            updatedAt: FieldValue.serverTimestamp()
          });
        }
      }
    }

    return NextResponse.json({ ok: true, message: "Address updated successfully" });
  } catch (err) {
    console.error("update-affiliate-address error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
