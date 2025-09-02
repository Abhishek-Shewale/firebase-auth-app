"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
} from "firebase/firestore"
import AddressForm from "@/components/address-form"

export default function Profile({ user }) {
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null) // address being edited
  const [addresses, setAddresses] = useState([])
  const [defaultAddressId, setDefaultAddressId] = useState(null)

  // Fetch addresses + default when component mounts
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
    setEditingAddress(addr)
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
          <Button className="cursor-pointer" onClick={() => setShowForm(true)}>Add Address</Button>
        ) : (
          <AddressForm
            user={user}
            initialAddress={editingAddress}
            onSave={(newAddress) => {
              if (editingAddress) {
                // update existing in state
                setAddresses(addresses.map((a) => (a.id === editingAddress.id ? newAddress : a)))
              } else {
                // add new
                setAddresses([...addresses, newAddress])
              }
              setShowForm(false)
              setEditingAddress(null)
            }}
            onCancel={() => {
              setShowForm(false)
              setEditingAddress(null)
            }}
          />
        )}

        {/* Address List */}
        {addresses.length > 0 && (
          <div className="space-y-4 mt-6">
            <h2 className="font-bold">Your Addresses</h2>
            {addresses.map((addr) => (
              <div key={addr.id} className="border p-3 rounded-lg space-y-1">
                <p><strong>{addr.fullName}</strong> ({addr.phone})</p>
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                {addr.landmark && <p>Landmark: {addr.landmark}</p>}
                <p>{addr.city}, {addr.state}, {addr.pincode}, {addr.country}</p>

                <div className="flex items-center justify-between mt-2">
                  {defaultAddressId === addr.id && (
                    <Badge className="bg-green-500 text-white">Default</Badge>
                  )}

                  <div className="flex space-x-2">
                    <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => handleEdit(addr)}>Edit</Button>
                    <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => handleDelete(addr.id)}>Delete</Button>
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
