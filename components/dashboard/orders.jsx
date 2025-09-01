"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function Orders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      </CardContent>
    </Card>
  )
}
