"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-hot-toast"

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
            isDefault: false,
        }
    )
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!user?.uid) {
            toast.error("User not logged in")
            return
        }
        setSaving(true)
        try {
            if (address.id) {
                // update existing
                const addressRef = doc(db, "users", user.uid, "addresses", address.id)
                await updateDoc(addressRef, address)
            } else {
                // new address
                const addressesRef = collection(db, "users", user.uid, "addresses")
                const docRef = await addDoc(addressesRef, address)
                address.id = docRef.id
            }

            // ✅ if this is default → update user doc
            if (address.isDefault) {
                const userRef = doc(db, "users", user.uid)
                await updateDoc(userRef, { defaultAddressId: address.id })
            }

            onSave?.(address) // notify parent
            toast.success("Address saved successfully ✅")
        } catch (err) {
            console.error("Error saving address:", err)
            toast.error("Failed to save ❌")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-3">
            <Input placeholder="Full Name *" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
            <Input placeholder="Mobile Number *" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
            <Input placeholder="Country *" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
            <Input placeholder="Flat / House / Building *" value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} />
            <Input placeholder="Street / Area" value={address.addressLine2} onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} />
            <Input placeholder="Landmark" value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
            <Input placeholder="Pincode *" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
            <Input placeholder="City *" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            <Input placeholder="State *" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />

            <div className="flex items-center space-x-2">
                <Checkbox
                    checked={address.isDefault}
                    onCheckedChange={(checked) => setAddress({ ...address, isDefault: checked })}
                />
                <label className="text-sm">Make this my default address</label>
            </div>

            <div className="flex space-x-2">
                <Button className="w-full" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : address.id ? "Update Address" : "Save Address"}
                </Button>
                {onCancel && (
                    <Button className="w-full" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
            </div>
        </div>
    )
}
