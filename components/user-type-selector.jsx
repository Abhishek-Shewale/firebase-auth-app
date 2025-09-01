"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, BookOpen, Briefcase } from "lucide-react"

const userTypes = [
  {
    id: "consultant",
    label: "Consultant",
    icon: Users,
    description: "Edutech consulting services",
    color: "bg-primary/10 hover:bg-primary/20 border-primary/20",
  },
  {
    id: "bookstore",
    label: "Bookstore",
    icon: BookOpen,
    description: "Book retail and distribution",
    color: "bg-secondary/10 hover:bg-secondary/20 border-secondary/20",
  },
  {
    id: "freelance",
    label: "Freelance",
    icon: Briefcase,
    description: "Independent professional services",
    color: "bg-accent/10 hover:bg-accent/20 border-accent/20",
  },
]

export default function UserTypeSelector({ selectedType, onTypeSelect }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Account Type</h2>
        <p className="text-muted-foreground">Select the option that best describes your role</p>
      </div>

      <div className="grid gap-4">
        {userTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id

          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : `${type.color} hover:shadow-md`
              }`}
              onClick={() => onTypeSelect(type.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-3 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-background"}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                    }`}
                  >
                    {isSelected && <div className="w-full h-full rounded-full bg-primary-foreground scale-50"></div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
