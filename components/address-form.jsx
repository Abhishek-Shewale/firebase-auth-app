"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";

/**
 * AddressForm
 * - Public (no user): just validates & returns the address via onSave(address), no Firestore writes.
 * - Auth (with user): saves/updates under users/{uid}/addresses and includes `contactEmail`.
 *
 * Props:
 * - user?: { uid: string, email?: string }
 * - initialAddress?: Address object (optional)
 * - onSave?: (addr) => void
 * - onCancel?: () => void
 *
 * Address shape (returned/saved):
 * {
 *   id?: string,
 *   fullName, phone, country,
 *   addressLine1, addressLine2?, landmark?,
 *   pincode, city, state,
 *   contactEmail,                // <- NEW
 *   isDefault?: boolean
 * }
 */
export default function AddressForm({ user, initialAddress = null, onSave, onCancel }) {
    const [address, setAddress] = useState(
        initialAddress || {
            fullName: "",
            phone: "",
            country: "",
            addressLine1: "",
            addressLine2: "",
            landmark: "",
            pincode: "",
            city: "",
            state: "",
            contactEmail: "", // NEW
            isDefault: false,
        }
    );
    const [saving, setSaving] = useState(false);

    // Prefill contactEmail for authenticated users if missing
    useEffect(() => {
        if (user?.email && !address.contactEmail) {
            setAddress((prev) => ({ ...prev, contactEmail: user.email }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.email]);

    // If initialAddress changes (e.g., user picks a different address), sync state
    useEffect(() => {
        if (initialAddress) {
            setAddress((prev) => ({
                ...prev,
                ...initialAddress,
                contactEmail:
                    initialAddress.contactEmail ||
                    prev.contactEmail ||
                    user?.email ||
                    "",
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialAddress?.id]);

    const validate = () => {
        if (!address.fullName?.trim()) return "Full name is required";
        if (!address.contactEmail?.trim()) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(address.contactEmail)) return "Enter a valid email";
        if (!address.phone?.trim()) return "Mobile number is required";
        if (!address.country?.trim()) return "Country is required";
        if (!address.addressLine1?.trim()) return "Address line is required";
        if (!address.pincode?.trim()) return "Pincode is required";
        if (!/^\d{5,6}$/.test(address.pincode.trim()))
            return "Enter a valid 5–6 digit pincode";
        if (!address.city?.trim()) return "City is required";
        if (!address.state?.trim()) return "State is required";
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) {
            toast.error(err);
            return;
        }

        // 🔓 PUBLIC MODE: no Firestore writes — just return the address
        if (!user?.uid) {
            onSave?.(address);
            return;
        }

        // 🔐 AUTH MODE: save/update under users/{uid}/addresses
        setSaving(true);
        try {
            let saved = { ...address };

            if (address.id) {
                const addressRef = doc(db, "users", user.uid, "addresses", address.id);
                await updateDoc(addressRef, saved);
            } else {
                const addressesRef = collection(db, "users", user.uid, "addresses");
                const docRef = await addDoc(addressesRef, saved);
                saved.id = docRef.id;
            }

            // If marked default, set on user doc
            if (saved.isDefault) {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, { defaultAddressId: saved.id });
            }

            setAddress(saved);
            onSave?.(saved);
            toast.success("Address saved ✅");
        } catch (e) {
            console.error("Error saving address:", e);
            toast.error("Failed to save ❌");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* Email (always shown; public + auth) */}
            <Input
                placeholder="Email *"
                type="email"
                value={address.contactEmail || ""}
                onChange={(e) =>
                    setAddress({ ...address, contactEmail: e.target.value })
                }
            />

            <Input
                placeholder="Full Name *"
                value={address.fullName}
                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
            />
            <Input
                placeholder="Mobile Number *"
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                inputMode="numeric"
            />
            <Input
                placeholder="Country *"
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
            />
            <Input
                placeholder="Flat / House / Building *"
                value={address.addressLine1}
                onChange={(e) =>
                    setAddress({ ...address, addressLine1: e.target.value })
                }
            />
            <Input
                placeholder="Street / Area"
                value={address.addressLine2}
                onChange={(e) =>
                    setAddress({ ...address, addressLine2: e.target.value })
                }
            />
            <Input
                placeholder="Landmark"
                value={address.landmark}
                onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
            />
            <Input
                placeholder="Pincode *"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                inputMode="numeric"
            />
            <Input
                placeholder="City *"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
            />
            <Input
                placeholder="State *"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
            />

            {/* Only useful for authenticated users */}
            {user?.uid && (
                <div className="flex items-center space-x-2">
                    <Checkbox
                        checked={!!address.isDefault}
                        onCheckedChange={(checked) =>
                            setAddress({ ...address, isDefault: !!checked })
                        }
                    />
                    <label className="text-sm">Make this my default address</label>
                </div>
            )}

            <div className="flex space-x-2">
                <Button className="w-full cursor-pointer" onClick={handleSave} disabled={saving}>
                    {saving
                        ? "Saving..."
                        : address.id
                            ? "Update Address"
                            : user?.uid
                                ? "Save Address"
                                : "Use This Address"}
                </Button>
                {onCancel && (
                    <Button
                        className="w-full cursor-pointer"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </div>
    );
}
