"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import CheckoutForm from "@/components/checkout-form";
import Modal from "@/components/ui/modal";
import toast from "react-hot-toast";

export default function ProductsCatalogPage() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null); // product chosen to buy
    const [open, setOpen] = useState(false);

    // capture affiliate ref
    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) localStorage.setItem("affiliateCode", ref);
    }, [searchParams]);

    // load products
    useEffect(() => {
        (async () => {
            try {
                const snap = await getDocs(collection(db, "products"));
                setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error(e);
                toast.error("Failed to load products");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const refCode = useMemo(
        () => searchParams.get("ref") || localStorage.getItem("affiliateCode") || null,
        [searchParams]
    );

    const handleBuyNow = (p) => {
        setSelected(p);
        setOpen(true);
    };

    if (loading) return <p className="p-6 text-center">Loading products…</p>;
    if (!products.length) return <p className="p-6 text-center">No products available</p>;

    return (
        <>
            <div className="max-w-6xl mx-auto p-6 grid gap-6 lg:grid-cols-3 md:grid-cols-2">
                {products.map((p) => (
                    <article key={p.id} className="rounded-xl border bg-white shadow-sm">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-3">{p.name}</h2>

                            <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center overflow-hidden mb-4">
                                <img src={p.image || "/placeholder.jpg"} alt={p.name} className="h-full object-contain" />
                            </div>

                            <div className="text-2xl font-bold text-green-600 mb-1">₹{p.price}</div>
                            <div className="text-sm text-gray-500 mb-4">one-time</div>

                            {Array.isArray(p.features) && p.features.length > 0 && (
                                <ul className="space-y-2 mb-6 text-gray-700">
                                    {p.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="mt-1">✅</span>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <Button className="cursor-pointer w-full" onClick={() => handleBuyNow(p)}>
                                Buy Now
                            </Button>
                        </div>
                    </article>
                ))}
            </div>

            {/* Checkout Modal */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={selected ? `Checkout — ${selected.name}` : "Checkout"}
            >
                {selected && <CheckoutForm product={selected} onSuccess={() => setOpen(false)} />}
            </Modal>
        </>
    );
}
