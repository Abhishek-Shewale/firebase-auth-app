"use client"

import { Button } from "@/components/ui/button"
import { Mail, Phone } from "lucide-react"

export default function AuthMethodSelector({ selectedMethod, onMethodSelect }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Choose Verification Method</h2>
        <p className="text-muted-foreground">How would you like to verify your account?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant={selectedMethod === "email" ? "default" : "outline"}
          className="h-20 flex-col space-y-2 cursor-pointer"
          onClick={() => onMethodSelect("email")}
        >
          <Mail className="h-6 w-6" />
          <span>Email</span>
        </Button>

        <Button
          variant={selectedMethod === "phone" ? "default" : "outline"}
          className="h-20 flex-col space-y-2 cursor-pointer"
          onClick={() => onMethodSelect("phone")}
        >
          <Phone className="h-6 w-6" />
          <span>Phone</span>
        </Button>
      </div>
    </div>
  )
}
