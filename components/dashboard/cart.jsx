"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Modal from "@/components/ui/modal"
import CheckoutForm from "@/components/checkout-form"
import toast from "react-hot-toast"

export default function Cart() {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [openCheckout, setOpenCheckout] = useState(false)

  const fetchCart = async () => {
    if (!user) return
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, "users", user.uid, "cart"))
      setCartItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error("fetchCart error", e)
      toast.error("Failed to load cart")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleRemove = async (id) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "cart", id))
      setCartItems((prev) => prev.filter((item) => item.id !== id))
    } catch (e) {
      console.error("remove error", e)
      toast.error("Failed to remove item")
    }
  }

  const handleQuantityChange = async (id, newQty) => {
    if (!user) return
    if (newQty < 1) return
    try {
      await updateDoc(doc(db, "users", user.uid, "cart", id), { qty: newQty })
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item))
      )
    } catch (e) {
      console.error("qty change error", e)
      toast.error("Failed to update quantity")
    }
  }

  const handleCheckoutOpen = () => {
    setOpenCheckout(true)
  }

  // calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0)
  const totalItems = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0)

  if (loading) return <p>Loading cart...</p>

  if (!cartItems.length) {
    return (
      <div className="text-center text-muted-foreground">
        <p className="mb-4">Your cart is empty.</p>
        <Button className="cursor-pointer" onClick={() => (window.location.href = "/profile?section=products")}>
          Browse Products
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {cartItems.map((item) => (
          <Card key={item.id} className="flex flex-col md:flex-row">
            {/* Product Image */}
            <div className="md:w-1/3 flex justify-center items-center p-4">
              <Image
                src={item.image || "/placeholder.jpg"}
                alt={item.name}
                width={200}
                height={200}
                className="rounded-md object-contain"
              />
            </div>

            {/* Product Details */}
            <div className="flex-1 p-4">
              <CardHeader className="p-0 mb-2">
                <CardTitle className="text-lg">{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                <p className="text-xl font-bold text-green-600">
                  ₹{(item.price || 0) * (item.qty || 1)}
                </p>
                <ul className="text-sm space-y-1">
                  {item.features?.map((feature, idx) => (
                    <li key={idx}>✅ {feature}</li>
                  ))}
                </ul>
              </CardContent>

              {/* Actions: Quantity + Remove */}
              <CardFooter className="flex justify-end gap-3 p-0 mt-4">
                {/* Quantity controls beside Remove */}
                <div className="flex items-center gap-2">
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleQuantityChange(item.id, (item.qty || 1) - 1)
                    }
                  >
                    -
                  </Button>
                  <span className="px-3 font-medium">{item.qty || 1}</span>
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleQuantityChange(item.id, (item.qty || 1) + 1)
                    }
                  >
                    +
                  </Button>
                </div>

                {/* Remove button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(item.id)}
                  className="cursor-pointer"
                >
                  Remove
                </Button>
              </CardFooter>
            </div>
          </Card>
        ))}

        {/* Subtotal + Checkout */}
        <Card>
          <CardFooter className="flex flex-col md:flex-row justify-between items-center gap-4 p-4">
            <p className="text-lg font-semibold">
              Subtotal ({totalItems} items): ₹{subtotal}
            </p>
            <Button size="lg" className="px-8 cursor-pointer" onClick={handleCheckoutOpen}>
              Proceed to Checkout
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Modal open={openCheckout} onClose={() => setOpenCheckout(false)} title="Checkout">
        <CheckoutForm
          user={user}
          cartItems={cartItems}
          affiliateCode={null} // No affiliate code for affiliate's own cart orders
          isPrebook={true} // Cart checkout should be treated as prebook (no commission)
          onSuccess={async () => {
            // close modal, clear local cart list & reload from firestore
            setOpenCheckout(false)
            // Remove all items from user's cart collection
            try {
              for (const it of cartItems) {
                await deleteDoc(doc(db, "users", user.uid, "cart", it.id))
              }
              // refresh cart local state
              setCartItems([])
              toast.success("Order placed and cart cleared")
            } catch (e) {
              console.error("clear cart error", e)
              toast.error("Order created but failed to clear cart locally; please refresh")
            }
          }}
        />
      </Modal>
    </>
  )
}
