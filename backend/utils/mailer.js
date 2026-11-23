const nodemailer = require("nodemailer");

// Sends an email through the SMTP server configured in .env (SMTP_HOST, SMTP_PORT, SMTP_USER,
// SMTP_PASS, MAIL_FROM). Returns false when SMTP is not configured or sending fails.
async function sendMail({ to, subject, text }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  if (!SMTP_HOST) return false;

  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
    });
    await transport.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, text });
    return true;
  } catch (err) {
    console.error("Email could not be sent:", err.message);
    return false;
  }
}

module.exports = { sendMail };
