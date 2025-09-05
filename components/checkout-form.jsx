"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddressForm from "@/components/address-form";
import Modal from "@/components/ui/modal";
import toast from "react-hot-toast";

export default function CheckoutForm({
    user,
    product,
    cartItems = null,
    affiliateCode,
    onSuccess,
    isPrebook = false,
    isPublicCustomer = false,
}) {
    const [defaultAddress, setDefaultAddress] = useState(null);
    const [openAddressModal, setOpenAddressModal] = useState(false);
    const [lastOrderId, setLastOrderId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [publicCustomerAddress, setPublicCustomerAddress] = useState(null);

    // Get current address based on user type
    const currentAddress = isPublicCustomer ? publicCustomerAddress : defaultAddress;

    // Force reset public customer address when component mounts for public customers
    useEffect(() => {
        if (isPublicCustomer) {
            setPublicCustomerAddress(null);
        }
    }, [isPublicCustomer]);


    // Load default address for authenticated users (not for public customers)
    useEffect(() => {
        if (!user?.uid || isPublicCustomer) return;
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
    }, [user?.uid, isPublicCustomer]);

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

    // build items (cart vs single product)
    const items = (cartItems && cartItems.length)
        ? cartItems.map(i => ({
            productId: i.id || i.productId,
            productName: i.name || i.productName,
            price: Number(i.price || 0),
            quantity: Number(i.qty || i.quantity || 1),
            total: Number(i.price || 0) * Number(i.qty || i.quantity || 1),
        }))
        : product ? [{
            productId: product.id,
            productName: product.name,
            price: Number(product.price || 0),
            quantity: Number(quantity || 1),
            total: Number(product.price || 0) * Number(quantity || 1)
        }] : [];

    const computedTotal = items.reduce((s, it) => s + (it.total || 0), 0);

    const handlePayNow = async () => {
        if (!currentAddress) {
            toast.error("Please add a delivery address first");
            setOpenAddressModal(true);
            return;
        }

        setCreating(true);
        try {
            const payload = {
                items,
                total: computedTotal,
                affiliateCode: effectiveAffiliateCode,
                customerUid: user?.uid || null, // important for self-referral guard
                customer: {
                    name: currentAddress.fullName,
                    email: user?.email || currentAddress.contactEmail,
                    phone: currentAddress.phone,
                    address: {
                        addressLine: currentAddress.addressLine1,
                        addressLine2: currentAddress.addressLine2 || "",
                        city: currentAddress.city,
                        state: currentAddress.state,
                        pincode: currentAddress.pincode,
                        country: currentAddress.country,
                        landmark: currentAddress.landmark || "",
                    },
                },
                type: isPrebook ? "prebook" : (isPublicCustomer ? "public" : "affiliate"),
                isPrebook: Boolean(isPrebook),
            };

            const res = await fetch("/api/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            const ok = res.ok && (data?.ok === true || data?.orderId);
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
                        onSuccess?.();
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
            <div className="rounded-lg border p-4 space-y-4 max-h-[70vh] overflow-auto">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Delivery Address</h3>
                    <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => setOpenAddressModal(true)}
                    >
                        {currentAddress ? "Edit Address" : "Add Address"}
                    </Button>
                </div>

                {currentAddress ? (
                    <div className="text-sm text-gray-700">
                        <div className="font-medium">
                            {currentAddress.fullName} — {currentAddress.phone}
                        </div>
                        <div>
                            {currentAddress.addressLine1}
                            {currentAddress.addressLine2 ? `, ${currentAddress.addressLine2}` : ""}
                        </div>
                        <div>
                            {currentAddress.city}, {currentAddress.state} {currentAddress.pincode}
                        </div>
                        <div>{currentAddress.country}</div>
                        {currentAddress.landmark && <div>Landmark: {currentAddress.landmark}</div>}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No address yet.</p>
                )}

                {/* Affiliate badge (don't show for prebook to avoid confusion) */}
                {effectiveAffiliateCode && !isPrebook && (
                    <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 w-fit">
                        Referral applied: <b>{effectiveAffiliateCode}</b>
                    </div>
                )}

                {/* Items summary */}
                <div className="border-t pt-3 space-y-2">
                    {items.map((it) => (
                        <div key={it.productId} className="flex justify-between text-sm">
                            <div>
                                {it.productName} {it.quantity > 1 ? `x${it.quantity}` : null}
                            </div>
                            <div>₹{it.total}</div>
                        </div>
                    ))}

                    <div className="flex items-center justify-between font-semibold mt-2">
                        <span>Total</span>
                        <span>₹{computedTotal}</span>
                    </div>
                </div>

                <Button className="w-full cursor-pointer" onClick={handlePayNow} disabled={creating}>
                    {creating ? "Creating Order..." : (isPrebook ? "Prebook (Create)" : (isPublicCustomer ? "Buy Now" : "Pay Now"))}
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
                    initialAddress={isPublicCustomer ? null : (defaultAddress || undefined)}
                    onSave={(addr) => {
                        // Store address in appropriate state based on user type
                        if (isPublicCustomer) {
                            setPublicCustomerAddress(addr);
                        } else {
                            setDefaultAddress(addr);
                        }
                        setOpenAddressModal(false);
                    }}
                    onCancel={() => setOpenAddressModal(false)}
                />
            </Modal>
        </>
    );
}
