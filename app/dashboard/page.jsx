"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Link,
  User,
  Menu,
  X,
} from "lucide-react"
import { useState, useEffect } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

import dynamic from "next/dynamic"
const DashboardHome = dynamic(() => import("@/components/dashboard/dashboard-home"), { ssr: false })
const Profile = dynamic(() => import("@/components/dashboard/profile"), { ssr: false })
const Orders = dynamic(() => import("@/components/dashboard/orders"), { ssr: false })
const Affiliate = dynamic(() => import("@/components/dashboard/affiliate"), { ssr: false })
const Products = dynamic(() => import("@/components/dashboard/products"), { ssr: false })
const Cart = dynamic(() => import("@/components/dashboard/cart"), { ssr: false })

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const section = searchParams.get("section") || "home"
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(collection(db, "users", user.uid, "cart"), (snap) => {
      setCartCount(snap.size)
    })
    return () => unsub()
  }, [user])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }

    const handleClickOutside = (event) => {
      if (sidebarOpen && window.innerWidth < 768) {
        const sidebar = document.getElementById("mobile-sidebar")
        const menuButton = document.getElementById("menu-button")
        if (sidebar && !sidebar.contains(event.target) && !menuButton.contains(event.target)) {
          setSidebarOpen(false)
        }
      }
    }

    window.addEventListener("resize", handleResize)
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [sidebarOpen])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const menuItems = [
    { key: "home", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: "products", label: "Products", icon: <ShoppingCart className="h-4 w-4" /> },
    { key: "orders", label: "Orders", icon: <Package className="h-4 w-4" /> },
    { key: "affiliate", label: "Affiliate Link", icon: <Link className="h-4 w-4" /> },
    { key: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  ]

  const getCurrentSectionLabel = () => {
    const currentItem = menuItems.find((item) => item.key === section)
    return currentItem ? currentItem.label : "Dashboard"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <Button
              id="menu-button"
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shrink-0"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-semibold truncate">{getCurrentSectionLabel()}</h1>
          </div>

          {/* Cart Icon */}
          <button
            onClick={() => router.push("/dashboard?section=cart")}
            className="relative"
          >
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          id="mobile-sidebar"
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 w-64 bg-muted/50 backdrop-blur-sm md:bg-muted p-4 flex flex-col fixed md:static inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out md:transition-none border-r md:border-r-border`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => (
              <Button
                key={item.key}
                variant={section === item.key ? "default" : "ghost"}
                className="w-full justify-start h-10 px-3 cursor-pointer"
                onClick={() => {
                  router.push(`/dashboard?section=${item.key}`)
                  setSidebarOpen(false) // auto-close on mobile
                }}
              >
                {item.icon}
                <span className="ml-3 text-sm">{item.label}</span>
              </Button>
            ))}
          </nav>

          <div className="border-t pt-4 mt-4">
            {user && (
              <div className="mb-3 px-3">
                <p className="text-xs text-muted-foreground mb-1">Signed in as</p>
                <p className="text-sm font-medium truncate">{user.email || user.name}</p>
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start h-10 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main content with Navbar */}
        <div className="flex-1 flex flex-col min-w-0 md:overflow-hidden">
          {/* Desktop top bar */}
          <div className="hidden md:flex justify-end p-4 border-b bg-background sticky top-0 mr-4 z-30">
            <button
              onClick={() => router.push("/dashboard?section=cart")}
              className="relative"
            >
              <ShoppingCart className="h-8 w-8 cursor-pointer" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <main className="flex-1 p-4 md:p-6">
            <div className="max-w-full">
              {section === "home" && <DashboardHome user={user} />}
              {section === "profile" && <Profile user={user} />}
              {section === "orders" && <Orders user={user} />}
              {section === "affiliate" && <Affiliate user={user} />}
              {section === "products" && <Products />}
              {section === "cart" && <Cart />}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
