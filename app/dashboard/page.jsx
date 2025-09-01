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
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <h1 className="text-lg font-bold">Dashboard</h1>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } md:block w-64 bg-muted p-4 flex flex-col fixed md:static inset-y-0 left-0 z-20`}
      >
        <h2 className="text-xl font-bold mb-6 hidden md:block">Menu</h2>
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <Button
              key={item.key}
              variant={section === item.key ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                router.push(`/dashboard?section=${item.key}`)
                setSidebarOpen(false) // auto-close on mobile
              }}
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
      <main className="flex-1 p-6 md:ml-6">
        {section === "home" && <DashboardHome user={user} />}
        {section === "profile" && <Profile user={user} />}
        {section === "orders" && <Orders user={user} />}
        {section === "affiliate" && <Affiliate user={user} />}
        {section === "products" && <Products />}
      </main>
    </div>
  )
}

