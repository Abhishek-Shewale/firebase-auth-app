"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Mail, Phone } from "lucide-react"

export default function Dashboard() {
  const { user, userType, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const getUserTypeColor = (type) => {
    switch (type) {
      case "consultant":
        return "bg-primary text-primary-foreground"
      case "bookstore":
        return "bg-secondary text-secondary-foreground"
      case "freelance":
        return "bg-accent text-accent-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Account Type:</span>
              <Badge className={getUserTypeColor(userType)}>
                {userType?.charAt(0).toUpperCase() + userType?.slice(1)}
              </Badge>
            </div>

            {user?.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
                {user.emailVerified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
            )}

            {user?.phoneNumber && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.phoneNumber}</span>
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Account created: {new Date(user?.metadata?.creationTime).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">
              Welcome, {userType?.charAt(0).toUpperCase() + userType?.slice(1)}!
            </h2>
            <p className="text-muted-foreground">
              Your account has been successfully verified. You can now access all features available for your account
              type.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
