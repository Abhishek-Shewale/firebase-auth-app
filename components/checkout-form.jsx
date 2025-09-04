"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddressForm from "@/components/address-form";
import Modal from "@/components/ui/modal";
import toast from "react-hot-toast";

export default function CheckoutForm({ user, product, affiliateCode, onSuccess }) {
    const [defaultAddress, setDefaultAddress] = useState(null);
    const [openAddressModal, setOpenAddressModal] = useState(false);
    const [lastOrderId, setLastOrderId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [quantity, setQuantity] = useState(1);

    // Load default address for authenticated users
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

    // affiliate fallbacks
    function getUrlRef() {
        try {
            const url = new URL(window.location.href);
            const ref = url.searchParams.get("ref");
            return ref ? ref.trim().toUpperCase() : null;
        } catch {
            return null;
        }
    }
    function getCookieAffiliateCode() {
        const m = document.cookie.match(/(?:^|;\s*)affiliateCode=([^;]+)/);
        return m ? decodeURIComponent(m[1]).trim().toUpperCase() : null;
    }
    const effectiveAffiliateCode =
        affiliateCode ||
        getUrlRef() ||
        getCookieAffiliateCode() ||
        (typeof window !== "undefined"
            ? (localStorage.getItem("firstRefCode") ||
                localStorage.getItem("affiliateCode") ||
                null)
            : null);

    const handlePayNow = async () => {
        if (!defaultAddress) {
            toast.error("Please add a delivery address first");
            setOpenAddressModal(true);
            return;
        }

        setCreating(true);
        try {
            const payload = {
                productId: product.id,
                productName: product.name,
                price: Number(product.price),
                quantity,
                total: Number(product.price) * Number(quantity),
                affiliateCode: effectiveAffiliateCode,
                customer: {
                    name: defaultAddress.fullName,
                    email: user?.email || defaultAddress.contactEmail,
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

            const ok = res.ok && (data?.ok === true || data?.success === true || data?.orderId);
            if (!ok) throw new Error(data?.error || "Order creation failed");

            toast.success("Order created! (payment next)");
            setLastOrderId(data.orderId);

            // 🔁 DEV-ONLY auto confirm (no Razorpay yet)
            if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_TEST_CONFIRM_KEY) {
                try {
                    const r2 = await fetch("/api/confirm-order", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_TEST_CONFIRM_KEY}`,
                        },
                        body: JSON.stringify({ orderId: data.orderId }),
                    });
                    const conf = await r2.json();
                    if (r2.ok && conf.ok) {
                        toast.success(`Order marked paid (commission ₹${conf.commission || 0})`);
                        onSuccess?.(); // now close modal after it’s PAID
                    } else {
                        throw new Error(conf.error || "Confirm failed");
                    }
                } catch (e) {
                    toast.error(e.message || "Server error while confirming");
                }
            }
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Something went wrong");
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Delivery Address</h3>
                    <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => setOpenAddressModal(true)}
                    >
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
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-sm">Quantity</span>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                disabled={creating || quantity <= 1}
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            >
                                −
                            </Button>
                            <Input
                                type="number"
                                min={1}
                                max={99}
                                step={1}
                                value={quantity}
                                onChange={(e) => {
                                    const next = parseInt(e.target.value || "1", 10);
                                    if (Number.isNaN(next)) {
                                        setQuantity(1);
                                    } else {
                                        setQuantity(Math.max(1, Math.min(99, next)));
                                    }
                                }}
                                className="w-16 h-9 text-center"
                                disabled={creating}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                disabled={creating}
                                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                            >
                                +
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between font-semibold mt-2">
                        <span>Total</span>
                        <span>₹{Number(product.price) * Number(quantity)}</span>
                    </div>
                </div>

                <Button className="w-full cursor-pointer" onClick={handlePayNow} disabled={creating}>
                    {creating ? "Creating Order..." : "Pay Now"}
                </Button>

                {/* Optional: keep the dev button too */}
                {process.env.NEXT_PUBLIC_SHOW_TEST_PAY === "true" &&
                    process.env.NEXT_PUBLIC_TEST_CONFIRM_KEY &&
                    lastOrderId && (
                        <Button
                            className="w-full cursor-pointer mt-2"
                            variant="outline"
                            onClick={async () => {
                                try {
                                    const res = await fetch("/api/confirm-order", {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_TEST_CONFIRM_KEY}`,
                                        },
                                        body: JSON.stringify({ orderId: lastOrderId }),
                                    });
                                    const data = await res.json();
                                    if (res.ok && data.ok) {
                                        toast.success(`Order marked paid (commission ₹${data.commission || 0})`);
                                        onSuccess?.();
                                    } else {
                                        throw new Error(data.error || "Confirm failed");
                                    }
                                } catch (e) {
                                    toast.error(e.message || "Server error");
                                }
                            }}
                        >
                            Mark Paid (Dev Only)
                        </Button>
                    )}

            </div>

            <Modal
                open={openAddressModal}
                onClose={() => setOpenAddressModal(false)}
                title="Delivery Address"
            >
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
