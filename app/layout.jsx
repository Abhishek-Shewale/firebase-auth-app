import { Geist } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "react-hot-toast"

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
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
