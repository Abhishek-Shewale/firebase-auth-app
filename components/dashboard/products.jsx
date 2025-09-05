"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import AddressForm from "@/components/address-form"
import { X } from "lucide-react"
import { toast } from "react-hot-toast"
import CheckoutForm from "@/components/checkout-form";


const products = [
  {
    id: "usb-16gb",
    name: "USB 16GB + 1 Year AI Access",
    price: 1099,
    image: "/Usb.jpg",
    features: [
      "16GB USB Bundle",
      "One-Year Validity with Unlimited AI Access",
      "All Premium AI Features Included",
      "Covers All Subjects – No Restrictions",
      "Parent-Friendly Dashboard to Track Progress",
      "Access from Anywhere – Mobile, Laptop, Desktop",
    ],
  },
  {
    id: "usb-8gb",
    name: "USB 8GB + 1 Year AI Access",
    price: 799,
    image: "/Usb.jpg",
    features: [
      "8GB USB Bundle",
      "One-Year Validity with Unlimited AI Access",
      "All Premium AI Features Included",
      "Covers All Subjects – No Restrictions",
      "Parent-Friendly Dashboard to Track Progress",
      "Access from Anywhere – Mobile, Laptop, Desktop",
    ],
  },
  {
    id: "usb-4gb",
    name: "USB 4GB + 1 Year AI Access",
    price: 599,
    image: "/Usb.jpg",
    features: [
      "4GB USB Bundle",
      "One-Year Validity with Unlimited AI Access",
      "All Premium AI Features Included",
      "Covers All Subjects – No Restrictions",
      "Parent-Friendly Dashboard to Track Progress",
      "Access from Anywhere – Mobile, Laptop, Desktop",
    ],
  },
]

export default function Products() {
  const { user } = useAuth()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [address, setAddress] = useState(null)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editing, setEditing] = useState(false)

  // 🛒 Add to cart
  const addToCart = async (product) => {
    if (!user) {
      toast.error("Please login to add items to cart.")
      return
    }

    try {
      const cartRef = doc(db, "users", user.uid, "cart", product.id)
      const cartDoc = await getDoc(cartRef)

      if (cartDoc.exists()) {
        // Update quantity
        const currentQty = cartDoc.data().qty || 1
        await updateDoc(cartRef, { qty: currentQty + 1 })
      } else {
        // Add new item
        await setDoc(cartRef, { ...product, qty: 1, addedAt: new Date().toISOString() })
      }

      toast.success(`${product.name} added to cart ✅`)
      // setCartCount(prev => prev + 1) // This state variable is not defined in the original file
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add to cart")
    }
  }

  // 🔖 Prebook
  const prebookProduct = async (product) => {
    if (!user) {
      toast.error("Please login to prebook.")
      return
    }

    setSelectedProduct(product)

    const userRef = doc(db, "users", user.uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists() && userSnap.data().defaultAddressId) {
      const defaultAddressId = userSnap.data().defaultAddressId
      const addressRef = doc(db, "users", user.uid, "addresses", defaultAddressId)
      const addressSnap = await getDoc(addressRef)

      if (addressSnap.exists()) {
        // ✅ show confirmation view
        setAddress({ id: defaultAddressId, ...addressSnap.data() })
        setEditing(false)
      } else {
        setAddress(null)
        setEditing(true)
      }
    } else {
      setAddress(null)
      setEditing(true)
    }

    setShowAddressModal(true)
  }

  return (
    <>
      {/* Product Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-4">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={200}
                  height={200}
                  className="rounded-md mx-auto"
                />
              </div>
              <p className="text-xl font-bold text-green-600 mb-2">
                ₹{product.price}{" "}
                <span className="text-sm font-normal text-muted-foreground">one-time</span>
              </p>
              <ul className="text-sm space-y-1">
                {product.features.map((feature, idx) => (
                  <li key={idx}>✅ {feature}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button className="flex-1 cursor-pointer" onClick={() => prebookProduct(product)}>
                Prebook
              </Button>
              <Button
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={() => addToCart(product)}
              >
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            {/* Modal Header with Title + Close Icon */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">
                {!editing && address
                  ? "Confirm Delivery Address"
                  : address
                    ? "Edit Delivery Address"
                    : "Enter Delivery Address"}
              </h2>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5 cursor-pointer" />
              </button>
            </div>

            {/* Modal Body */}
            {!editing && address ? (
              <>
                {/* Render the existing CheckoutForm — it will create order and handle dev confirm */}
                <CheckoutForm
                  user={user}
                  product={selectedProduct}
                  affiliateCode={null} // No affiliate code for prebook orders
                  isPrebook={true}
                  onSuccess={() => {
                    // close modal and clear selection after successful confirm/flow
                    setShowAddressModal(false);
                    setSelectedProduct(null);
                    toast.success("Prebook order confirmed — check your email");
                  }}
                />
              </>
            ) : (
              <AddressForm
                user={user}
                initialAddress={address}
                onSave={(newAddr) => {
                  setAddress(newAddr);
                  setEditing(false);
                  // keep modal open so user can continue to payment
                }}
                onCancel={() => {
                  setEditing(false);
                  setShowAddressModal(false);
                }}
              />
            )}

          </div>
        </div>
      )}
    </>
  )
}
