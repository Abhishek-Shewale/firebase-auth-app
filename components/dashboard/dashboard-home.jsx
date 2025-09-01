"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardHome({ user }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <IndianRupee className="h-5 w-5" />
          <span>Commissions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">₹0</p>
          <p className="text-sm text-muted-foreground">Total Earned</p>
        </div>
        <div>
          <p className="text-2xl font-bold">₹0</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div>
          <p className="text-2xl font-bold">₹0</p>
          <p className="text-sm text-muted-foreground">Claimed</p>
        </div>
        <div className="col-span-3 pt-4">
          <Button className="w-full">Claim Commission</Button>
        </div>
      </CardContent>
    </Card>
  )
}
