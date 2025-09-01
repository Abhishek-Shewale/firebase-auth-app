"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy } from "lucide-react"
import { useState } from "react"

export default function Affiliate({ user }) {
  const [copied, setCopied] = useState(false)
  const affiliateLink = `https://yourapp.com/ref/${user?.uid}`

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Affiliate Link</CardTitle>
      </CardHeader>
      <CardContent className="flex space-x-2">
        <Input value={affiliateLink} readOnly />
        <Button onClick={copyLink} size="sm" variant="outline">
          <Copy className="h-4 w-4 mr-1" />
          {copied ? "Copied!" : "Copy"}
        </Button>
      </CardContent>
    </Card>
  )
}
