"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
} from "firebase/firestore"

export default function Profile({ user }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null) // track address being edited
  const [saving, setSaving] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [defaultAddressId, setDefaultAddressId] = useState(null)

  const [address, setAddress] = useState({
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
  })
  const [errors, setErrors] = useState({})

  const requiredFields = ["fullName", "phone", "country", "addressLine1", "pincode", "city", "state"]

  // Fetch addresses
  useEffect(() => {
    if (!user?.uid) return
    const fetchAddresses = async () => {
      const snap = await getDocs(collection(db, "users", user.uid, "addresses"))
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setAddresses(data)

      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        setDefaultAddressId(userDoc.data().defaultAddressId || null)
      }
    }
    fetchAddresses()
  }, [user])

  const validate = () => {
    let newErrors = {}
    requiredFields.forEach((field) => {
      if (!address[field]) newErrors[field] = "This field is required"
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    if (!user?.uid) return alert("User not logged in")

    setSaving(true)
    try {
      if (editingId) {
        // update existing address
        const addressRef = doc(db, "users", user.uid, "addresses", editingId)
        await updateDoc(addressRef, address)

        // update state
        setAddresses(addresses.map((a) => (a.id === editingId ? { id: editingId, ...address } : a)))
        if (address.isDefault) {
          const userRef = doc(db, "users", user.uid)
          await updateDoc(userRef, { defaultAddressId: editingId })
          setDefaultAddressId(editingId)
        }
        alert("Address updated ✅")
      } else {
        // add new address
        const addressesRef = collection(db, "users", user.uid, "addresses")
        const docRef = await addDoc(addressesRef, address)

        setAddresses([...addresses, { id: docRef.id, ...address }])
        if (address.isDefault) {
          const userRef = doc(db, "users", user.uid)
          await updateDoc(userRef, { defaultAddressId: docRef.id })
          setDefaultAddressId(docRef.id)
        }
        alert("Address saved ✅")
      }

      // reset
      setShowForm(false)
      setEditingId(null)
      setAddress({
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
      })
    } catch (err) {
      console.error("Error saving address:", err)
      alert("Failed to save ❌")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!user?.uid) return
    const confirmed = window.confirm("Are you sure you want to delete this address?")
    if (!confirmed) return
  
    try {
      await deleteDoc(doc(db, "users", user.uid, "addresses", id))
      setAddresses(addresses.filter((a) => a.id !== id))
  
      if (id === defaultAddressId) {
        const userRef = doc(db, "users", user.uid)
        await updateDoc(userRef, { defaultAddressId: null })
        setDefaultAddressId(null)
      }
  
      alert("Address deleted ✅")
    } catch (err) {
      console.error(err)
      alert("Failed to delete ❌")
    }
  }
  

  const handleEdit = (addr) => {
    setAddress(addr)
    setEditingId(addr.id)
    setShowForm(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic profile info */}
        <div className="text-sm space-y-2">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Account Type:</strong> {user?.userType}</p>
          <p><strong>Created At:</strong> {new Date(user?.metadata?.creationTime).toLocaleDateString()}</p>
        </div>

        <hr />

        {/* Add/Edit Address */}
        {!showForm ? (
          <Button onClick={() => setShowForm(true)}>Add Address</Button>
        ) : (
          <div className="space-y-3">
            <Input placeholder="Full Name *" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
            {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}

            <Input placeholder="Mobile Number *" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}

            <Input placeholder="Country *" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
            {errors.country && <p className="text-red-500 text-xs">{errors.country}</p>}

            <Input placeholder="Flat, House no., Building, Company, Apartment *" value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} />
            {errors.addressLine1 && <p className="text-red-500 text-xs">{errors.addressLine1}</p>}

            <Input placeholder="Area, Street, Sector, Village" value={address.addressLine2} onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} />
            <Input placeholder="Landmark" value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />

            <Input placeholder="Pincode *" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
            {errors.pincode && <p className="text-red-500 text-xs">{errors.pincode}</p>}

            <Input placeholder="Town / City *" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            {errors.city && <p className="text-red-500 text-xs">{errors.city}</p>}

            <Input placeholder="State *" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
            {errors.state && <p className="text-red-500 text-xs">{errors.state}</p>}

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={address.isDefault}
                onCheckedChange={(checked) => setAddress({ ...address, isDefault: checked })}
              />
              <label className="text-sm">Make this my default address</label>
            </div>

            <div className="flex space-x-2">
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
              </Button>
              <Button className="w-full" variant="outline" onClick={() => { setShowForm(false); setEditingId(null) }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Address List */}
        {addresses.length > 0 && (
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold">Your Addresses</h3>
            {addresses.map((addr) => (
              <div key={addr.id} className="border p-3 rounded-lg space-y-1">
                <p><strong>{addr.fullName}</strong> ({addr.phone})</p>
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                {addr.landmark && <p>Landmark: {addr.landmark}</p>}
                <p>{addr.city}, {addr.state}, {addr.pincode}, {addr.country}</p>

                <div className="flex items-center justify-between mt-2">
                  {defaultAddressId === addr.id && <Badge variant="secondary">Default</Badge>}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(addr)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(addr.id)}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
