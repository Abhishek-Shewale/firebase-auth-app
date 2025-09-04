import nodemailer from "nodemailer";

/**
 * Supports:
 * - Gmail via EMAIL_USER/EMAIL_PASS (service transport)
 * - Or custom SMTP if you also set EMAIL_HOST and EMAIL_PORT (optional)
 *
 * Required env:
 *   EMAIL_USER, EMAIL_PASS, EMAIL_FROM_NAME, EMAIL_FROM_ADDRESS
 * Optional:
 *   EMAIL_HOST, EMAIL_PORT (for custom SMTP)
 */
let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const {
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_HOST,
    EMAIL_PORT,
  } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Missing EMAIL_USER/EMAIL_PASS in env");
  }

  if (EMAIL_HOST && EMAIL_PORT) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: Number(EMAIL_PORT) === 465,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });
  } else {
    // default to Gmail service
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || "Student AI";
  const fromAddr = process.env.EMAIL_FROM_ADDRESS || EMAIL_USER;

  await t.sendMail({
    from: `${fromName} <${fromAddr}>`,
    to,
    subject,
    html,
  });
}
