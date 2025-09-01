"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function Products() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Products will be listed here.</p>
      </CardContent>
    </Card>
  )
}
