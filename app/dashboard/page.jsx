"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, LayoutDashboard, ShoppingCart, Package, Link, User } from "lucide-react"
import { useState } from "react"
import dynamic from "next/dynamic"

const DashboardHome = dynamic(() => import("@/components/dashboard/dashboard-home"), { ssr: false })
const Profile = dynamic(() => import("@/components/dashboard/profile"), { ssr: false })
const Orders = dynamic(() => import("@/components/dashboard/orders"), { ssr: false })
const Affiliate = dynamic(() => import("@/components/dashboard/affiliate"), { ssr: false })
const Products = dynamic(() => import("@/components/dashboard/products"), { ssr: false })

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const section = searchParams.get("section") || "home"

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

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-muted p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-6">Menu</h2>
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <Button
              key={item.key}
              variant={section === item.key ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => router.push(`/dashboard?section=${item.key}`)}
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </Button>
          ))}
        </nav>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        {section === "home" && <DashboardHome user={user} />}
        {section === "profile" && <Profile user={user} />}
        {section === "orders" && <Orders user={user} />}
        {section === "affiliate" && <Affiliate user={user} />}
        {section === "products" && <Products />}
      </main>
    </div>
  )
}
