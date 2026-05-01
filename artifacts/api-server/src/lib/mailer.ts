import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "NFGN <noreply@nfgn.com>";

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail(opts: MailOptions): Promise<void> {
  if (!resend) {
    console.log(`[MAILER] Email not configured (no RESEND_API_KEY). Would have sent to: ${Array.isArray(opts.to) ? opts.to.join(", ") : opts.to} — Subject: ${opts.subject}`);
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
    });
  } catch (err) {
    console.error("[MAILER] Failed to send email:", err);
  }
}

function wrap(content: string, heading: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><style>
  body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#f9f9f9; margin:0; padding:0; }
  .wrap { max-width:580px; margin:40px auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08); }
  .header { background:#0a0a0a; padding:28px 32px; }
  .header h1 { color:#C9A84C; margin:0; font-size:22px; letter-spacing:.04em; }
  .header p { color:#888; margin:4px 0 0; font-size:13px; }
  .body { padding:32px; color:#333; font-size:15px; line-height:1.7; }
  .body h2 { margin-top:0; color:#0a0a0a; font-size:18px; }
  .detail-box { background:#f5f5f5; border-radius:8px; padding:16px 20px; margin:20px 0; font-size:14px; }
  .detail-box p { margin:4px 0; }
  .detail-box strong { color:#0a0a0a; }
  .cta { display:inline-block; margin-top:20px; background:#C9A84C; color:#0a0a0a !important; text-decoration:none; padding:12px 28px; border-radius:6px; font-weight:700; font-size:14px; }
  .footer { padding:20px 32px; background:#f0f0f0; font-size:12px; color:#888; text-align:center; }
</style></head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>NFGN</h1>
      <p>New Face Global Network</p>
    </div>
    <div class="body">
      <h2>${heading}</h2>
      ${content}
    </div>
    <div class="footer">New Face Global Network &nbsp;·&nbsp; This is an automated notification.</div>
  </div>
</body>
</html>`;
}

export function codReminderMemberHtml(opts: {
  memberName: string;
  orderNumber: string;
  orderId: number;
  total: string;
  items: string;
  dashboardUrl: string;
}): string {
  return wrap(`
    <p>Hi ${opts.memberName},</p>
    <p>This is a reminder that your Cash on Delivery order is awaiting payment collection.</p>
    <div class="detail-box">
      <p><strong>Order #:</strong> ${opts.orderNumber}</p>
      <p><strong>Items:</strong> ${opts.items}</p>
      <p><strong>Amount Due:</strong> $${opts.total}</p>
    </div>
    <p>Please have the full payment of <strong>$${opts.total}</strong> ready for the delivery representative when your order arrives.</p>
    <p>If you have any questions, contact NFGN directly.</p>
    <a class="cta" href="${opts.dashboardUrl}">View My Order</a>
  `, "COD Payment Reminder — Action Required");
}

export function codReminderCorporateHtml(opts: {
  memberName: string;
  memberEmail: string;
  orderNumber: string;
  orderId: number;
  total: string;
  items: string;
  placedAt: string;
  adminUrl: string;
}): string {
  return wrap(`
    <p>A Cash on Delivery order has been pending for <strong>24 hours</strong> without payment confirmation.</p>
    <div class="detail-box">
      <p><strong>Order #:</strong> ${opts.orderNumber}</p>
      <p><strong>Member:</strong> ${opts.memberName} (${opts.memberEmail})</p>
      <p><strong>Items:</strong> ${opts.items}</p>
      <p><strong>Amount Due:</strong> $${opts.total}</p>
      <p><strong>Order Placed:</strong> ${opts.placedAt}</p>
    </div>
    <p>Please follow up to confirm whether payment was collected and update the order status accordingly.</p>
    <a class="cta" href="${opts.adminUrl}">View in Admin</a>
  `, "COD Order — 24-Hour Payment Reminder");
}

export function bookingConfirmationHtml(opts: {
  recipientName: string;
  memberName: string;
  providerName: string;
  serviceType: string;
  scheduledAt: string;
  duration: number;
  amount: number;
  bookingId: number;
  dashboardUrl: string;
  role: "member" | "provider" | "admin" | "sponsor";
}): string {
  const roleLabel =
    opts.role === "member"   ? "Your Booking Confirmation" :
    opts.role === "provider" ? "New Appointment Request"   :
    opts.role === "sponsor"  ? "Downline Booking Activity" :
                               "Booking Alert";

  const detail = `
    <div class="detail-box">
      <p><strong>Service:</strong> ${opts.serviceType}</p>
      <p><strong>Professional:</strong> ${opts.providerName}</p>
      <p><strong>Member:</strong> ${opts.memberName}</p>
      <p><strong>Date & Time:</strong> ${opts.scheduledAt}</p>
      <p><strong>Duration:</strong> ${opts.duration} minutes</p>
      <p><strong>Amount:</strong> $${opts.amount.toFixed(2)}</p>
      <p><strong>Booking #:</strong> ${opts.bookingId}</p>
    </div>
    <p>You can view details and manage this booking in your back office.</p>
    <a class="cta" href="${opts.dashboardUrl}">View in Back Office</a>`;

  const intro =
    opts.role === "member"
      ? `<p>Hi ${opts.recipientName}, your appointment has been confirmed! Here are the details:</p>`
      : opts.role === "provider"
      ? `<p>Hi ${opts.recipientName}, you have a new booking request from <strong>${opts.memberName}</strong>. Here are the details:</p>`
      : opts.role === "sponsor"
      ? `<p>Hi ${opts.recipientName}, your downline member <strong>${opts.memberName}</strong> has just booked a professional session. Here are the details:</p>`
      : `<p>A new booking has been placed on the platform. Here is a summary:</p>`;

  return wrap(intro + detail, roleLabel);
}
