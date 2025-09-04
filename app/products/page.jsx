"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import CheckoutForm from "@/components/checkout-form";
import Modal from "@/components/ui/modal";
import toast from "react-hot-toast";

// --- helpers ---
function setAffiliateCookie(code) {
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    document.cookie = `affiliateCode=${encodeURIComponent(code)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}
function getCookieAffiliateCode() {
    const m = document.cookie.match(/(?:^|;\s*)affiliateCode=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
}

export default function ProductsCatalogPage() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [open, setOpen] = useState(false);

    // capture affiliate ref + track click once per session
    useEffect(() => {
        const ref = searchParams.get("ref");
        if (!ref) return;
        const code = ref.trim().toUpperCase();

        if (!localStorage.getItem("firstRefCode")) {
            localStorage.setItem("firstRefCode", code);
            localStorage.setItem("firstRefAt", new Date().toISOString());
            localStorage.setItem("landingPath", window.location.pathname + window.location.search);
        }
        localStorage.setItem("affiliateCode", code);
        setAffiliateCookie(code);

        const sessionKey = `tracked_${code}`;
        if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, "1");
            fetch(`/api/track-click?ref=${encodeURIComponent(code)}`).catch(() => { });
        }
    }, [searchParams]);

    // load products
    useEffect(() => {
        (async () => {
            try {
                const qy = query(collection(db, "products"), orderBy("rank", "desc"));
                const snap = await getDocs(qy);
                setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error(e);
                toast.error("Failed to load products");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // effective affiliate code
    const refCode = useMemo(() => {
        const fromUrl = searchParams.get("ref");
        if (fromUrl) return fromUrl.trim().toUpperCase();

        const fromCookie = getCookieAffiliateCode();
        if (fromCookie) return fromCookie.trim().toUpperCase();

        const first = localStorage.getItem("firstRefCode");
        if (first) return first.trim().toUpperCase();

        const legacy = localStorage.getItem("affiliateCode");
        return legacy ? legacy.trim().toUpperCase() : null;
    }, [searchParams]);

    const handleBuyNow = (p) => {
        setSelected(p);
        setOpen(true);
    };

    if (loading) return <p className="p-6 text-center">Loading products…</p>;
    if (!products.length) return <p className="p-6 text-center">No products available</p>;

    return (
        <>
            <div className="max-w-6xl mx-auto min-h-screen flex lg:items-center lg:justify-center px-3">
                <div className="w-full grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((p) => {
                        const features = Array.isArray(p.features) ? p.features : [];
                        const compact = features.slice(0, 6);
                        const truncated = features.length > 6;

                        return (
                            <article
                                key={p.id}
                                className="rounded-lg border bg-white shadow-md hover:shadow-lg transition-shadow text-sm"
                            >
                                <div className="p-5">
                                    {/* Title */}
                                    <h2 className="text-lg font-semibold leading-snug truncate mb-3">
                                        {p.name}
                                    </h2>

                                    {/* Bigger media */}
                                    <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center overflow-hidden mb-3">
                                        <img
                                            src={p.image || "/placeholder.jpg"}
                                            alt={p.name}
                                            className="h-full object-contain"
                                        />
                                    </div>

                                    {/* Price */}
                                    <div className="mb-3">
                                        <span className="text-xl font-bold text-green-600">₹{p.price}</span>{" "}
                                        <span className="text-xs text-gray-500 align-middle">one-time</span>
                                    </div>

                                    {/* Features */}
                                    {compact.length > 0 && (
                                        <ul className="mb-4 text-gray-700 text-sm">
                                            {compact.map((f, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center gap-2 leading-5 truncate"
                                                    title={f}
                                                >
                                                    <span>✅</span>
                                                    <span className="truncate">{f}</span>
                                                </li>
                                            ))}
                                            {truncated && (
                                                <li className="text-gray-500 italic pl-6">…and more</li>
                                            )}
                                        </ul>
                                    )}

                                    <Button className="w-full h-10 text-sm font-medium cursor-pointer" onClick={() => handleBuyNow(p)}>
                                        Buy Now
                                    </Button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>


            {/* Checkout Modal */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={selected ? `Checkout — ${selected.name}` : "Checkout"}
            >
                {selected && (
                    <CheckoutForm
                        product={selected}
                        affiliateCode={refCode}
                        onSuccess={() => setOpen(false)}
                    />
                )}
            </Modal>
        </>
    );
}
