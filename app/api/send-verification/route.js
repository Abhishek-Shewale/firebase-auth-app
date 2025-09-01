import nodemailer from "nodemailer"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(req) {
  try {
    const body = await req.json()
    const { uid, email } = body
    if (!uid || !email) {
      return new Response(JSON.stringify({ error: "uid and email required" }), { status: 400 })
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = Date.now() + 15 * 60 * 1000 // 15 min

    // Store OTP in emailVerifications/{uid}
    try {
      await setDoc(doc(db, "emailVerifications", uid), {
        code,
        email,
        createdAt: Date.now(),
        expiresAt,
        attempts: 0,
      })
    } catch (firestoreError) {
      console.error("Firestore write error:", firestoreError)
      
      // If it's a permission error, provide a helpful message
      if (firestoreError.code === 'permission-denied') {
        return new Response(JSON.stringify({ 
          error: "Database access denied. Please check your Firebase configuration and security rules.",
          details: "The application cannot write to the database. This is usually due to missing or incorrect Firebase security rules."
        }), { status: 500 })
      }
      
      throw firestoreError
    }

    // Create transporter (Gmail App Password / SMTP)
    const transporter = nodemailer.createTransport(
      process.env.SMTP_HOST
        ? {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          }
        : {
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          }
    )

    // Optional: verify transporter (helps surface errors)
    try {
      await transporter.verify()
    } catch (vErr) {
      console.error("SMTP verify failed:", vErr)
      return new Response(JSON.stringify({ error: "SMTP verify failed", details: vErr.message }), { status: 500 })
    }

    // Send email
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "My App"}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your verification code",
      text: `Your verification code is ${code}. It expires in 15 minutes.`,
      html: `
        <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto;">
          <h3>Verify your email</h3>
          <p>Your verification code is:</p>
          <p style="font-size:20px; font-weight:700; letter-spacing:4px;">${code}</p>
          <p>This code will expire in 15 minutes.</p>
        </div>
      `,
    })

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error("send-verification error:", err)
    return new Response(JSON.stringify({ error: "Failed to send verification email", details: err.message }), { status: 500 })
  }
}
