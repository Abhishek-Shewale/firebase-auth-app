import { Geist } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

export const metadata = {
  title: "Firebase Auth App",
  description: "Secure authentication with Firebase",
  generator: "v0.app",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
