"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import AddressForm from "@/components/address-form";
import Modal from "@/components/ui/modal";
import toast from "react-hot-toast";

/**
 * CheckoutForm (auth-only)
 * - Shows default address
 * - Lets user edit via AddressForm
 * - Sends order to /api/create-order
 */
export default function CheckoutForm({ user, product, affiliateCode }) {
    const [defaultAddress, setDefaultAddress] = useState(null);
    const [openAddressModal, setOpenAddressModal] = useState(false);

    useEffect(() => {
        if (!user?.uid) return;
        (async () => {
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                const defaultId = userSnap.exists() ? userSnap.data().defaultAddressId : null;

                const addrCol = collection(db, "users", user.uid, "addresses");
                const addrSnap = await getDocs(addrCol);
                const list = addrSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

                if (defaultId) {
                    const found = list.find((a) => a.id === defaultId) || list[0];
                    setDefaultAddress(found || null);
                } else {
                    setDefaultAddress(list[0] || null);
                }
            } catch (e) {
                console.error(e);
                toast.error("Failed to load addresses");
            }
        })();
    }, [user?.uid]);

    const effectiveAffiliateCode =
        affiliateCode ||
        (typeof window !== "undefined" ? localStorage.getItem("affiliateCode") : null);

    const handlePayNow = async () => {
        if (!defaultAddress) {
            toast.error("Please add a delivery address first");
            setOpenAddressModal(true);
            return;
        }

        try {
            const payload = {
                productId: product.id,
                productName: product.name,
                price: Number(product.price),
                quantity: 1,
                total: Number(product.price),
                affiliateCode: effectiveAffiliateCode,
                customer: {
                    name: defaultAddress.fullName,
                    email: user.email,
                    phone: defaultAddress.phone,
                    address: {
                        addressLine: defaultAddress.addressLine1,
                        city: defaultAddress.city,
                        state: defaultAddress.state,
                        pincode: defaultAddress.pincode,
                        country: defaultAddress.country,
                        landmark: defaultAddress.landmark || "",
                        addressLine2: defaultAddress.addressLine2 || "",
                    },
                },
            };

            const res = await fetch("/api/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Order failed");

            // TODO: Razorpay integration next step
            toast.success("Order created! (payment next)");
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Something went wrong");
        }
    };

    return (
        <>
            <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Delivery Address</h3>
                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpenAddressModal(true)}>
                        {defaultAddress ? "Edit Address" : "Add Address"}
                    </Button>
                </div>

                {defaultAddress ? (
                    <div className="text-sm text-gray-700">
                        <div className="font-medium">
                            {defaultAddress.fullName} — {defaultAddress.phone}
                        </div>
                        <div>
                            {defaultAddress.addressLine1}
                            {defaultAddress.addressLine2 ? `, ${defaultAddress.addressLine2}` : ""}
                        </div>
                        <div>
                            {defaultAddress.city}, {defaultAddress.state} {defaultAddress.pincode}
                        </div>
                        <div>{defaultAddress.country}</div>
                        {defaultAddress.landmark && <div>Landmark: {defaultAddress.landmark}</div>}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No address yet.</p>
                )}

                {effectiveAffiliateCode && (
                    <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 w-fit">
                        Referral applied: <b>{effectiveAffiliateCode}</b>
                    </div>
                )}

                <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-sm">
                        <span>{product.name}</span>
                        <span>₹{product.price}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold mt-2">
                        <span>Total</span>
                        <span>₹{product.price}</span>
                    </div>
                </div>

                <Button className="w-full cursor-pointer" onClick={handlePayNow}>
                    Pay Now
                </Button>
            </div>

            <Modal open={openAddressModal} onClose={() => setOpenAddressModal(false)} title="Delivery Address">
                <AddressForm
                    user={user}
                    initialAddress={defaultAddress || undefined}
                    onSave={(addr) => {
                        setDefaultAddress(addr);
                        setOpenAddressModal(false);
                    }}
                    onCancel={() => setOpenAddressModal(false)}
                />
            </Modal>
        </>
    );
}
