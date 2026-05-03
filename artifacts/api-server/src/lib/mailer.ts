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

// ─────────────────────────────────────────────────────────────────────────────
//  Gift / Donation Notification Emails
//  Role: "giver" | "admin" | "sponsor" | "upline"
// ─────────────────────────────────────────────────────────────────────────────

export interface GiftNotificationOpts {
  role: "giver" | "admin" | "sponsor" | "upline";
  recipientName: string;
  giverName: string;
  giverEmail: string;
  productName: string;
  recipientOrgName: string;   // church / non-profit name
  giftAmount: number;         // full gift amount member gave
  charityAmount: number;      // 80% (default) → org
  memberAmount: number;       // 20% (default) → referral chain / NFGN
  charityPercent: number;     // e.g. 80
  memberPercent: number;      // e.g. 20
  orderNumber: string;
  dashboardUrl: string;
  sponsorCommission?: number; // only for sponsor / upline emails
}

export function giftNotificationHtml(opts: GiftNotificationOpts): string {
  const charityBar = Math.round(opts.charityPercent);
  const memberBar  = Math.round(opts.memberPercent);

  const splitVisual = `
    <div style="margin:20px 0;">
      <p style="margin:0 0 6px;font-weight:700;font-size:13px;color:#0a0a0a;">How This Gift Is Distributed</p>
      <div style="background:#f0f0f0;border-radius:99px;height:14px;overflow:hidden;width:100%;">
        <div style="background:#C9A84C;height:100%;width:${charityBar}%;border-radius:99px 0 0 99px;display:inline-block;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:12px;">
        <span style="color:#C9A84C;font-weight:700;">🏛 ${charityBar}% ($${opts.charityAmount.toFixed(2)}) → ${opts.recipientOrgName}</span>
        <span style="color:#888;font-weight:600;">${memberBar}% ($${opts.memberAmount.toFixed(2)}) → Members / NFGN</span>
      </div>
    </div>`;

  const giftBox = `
    <div class="detail-box">
      <p><strong>Gift Item:</strong> ${opts.productName}</p>
      <p><strong>Recipient:</strong> ${opts.recipientOrgName}</p>
      <p><strong>Total Gift Amount:</strong> $${opts.giftAmount.toFixed(2)}</p>
      <p><strong>Direct to Organisation:</strong> $${opts.charityAmount.toFixed(2)} (${charityBar}%)</p>
      <p><strong>Member &amp; NFGN Distribution:</strong> $${opts.memberAmount.toFixed(2)} (${memberBar}%)</p>
      <p><strong>Order #:</strong> ${opts.orderNumber}</p>
    </div>`;

  const giftNotice = `
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;margin:16px 0;font-size:13px;color:#92400e;">
      <strong>Important — Gift Notice:</strong> This transaction is a <strong>personal gift</strong>, not a payment or purchase.
      Gifts of this nature are generally not considered taxable income. Neither the giver nor the recipient
      should treat this as revenue or a business transaction. NFGN facilitates the transfer on behalf of the
      community — all parties should consult their own tax adviser for specific guidance.
    </div>`;

  if (opts.role === "giver") {
    return wrap(`
      <p>Hi ${opts.recipientName},</p>
      <p>Thank you for your generous gift! Your contribution has been received and will be distributed as follows:</p>
      ${giftBox}
      ${splitVisual}
      ${giftNotice}
      <p>Your gift goes a long way toward supporting <strong>${opts.recipientOrgName}</strong> and the NFGN community. Thank you for making a difference!</p>
      <a class="cta" href="${opts.dashboardUrl}">View My Dashboard</a>
    `, `Gift Confirmation — Thank You, ${opts.recipientName}!`);
  }

  if (opts.role === "admin") {
    return wrap(`
      <p>A new gift/donation has been submitted through the NFGN platform.</p>
      <p><strong>Giver:</strong> ${opts.giverName} (${opts.giverEmail})</p>
      ${giftBox}
      ${splitVisual}
      ${giftNotice}
      <p>Please ensure the charity portion ($${opts.charityAmount.toFixed(2)}) is disbursed to <strong>${opts.recipientOrgName}</strong> according to your disbursement schedule.</p>
      <a class="cta" href="${opts.dashboardUrl}">View in Admin</a>
    `, "New Gift Received — Admin Notification");
  }

  if (opts.role === "sponsor") {
    return wrap(`
      <p>Hi ${opts.recipientName},</p>
      <p>Great news! Your referred member <strong>${opts.giverName}</strong> just made a gift through NFGN, and you've earned a referral reward from the member distribution pool.</p>
      ${giftBox}
      ${splitVisual}
      ${opts.sponsorCommission != null ? `<div class="detail-box" style="border-left:4px solid #C9A84C;"><p style="margin:0;"><strong>Your Referral Reward:</strong> <span style="color:#C9A84C;font-size:18px;font-weight:900;">+$${opts.sponsorCommission.toFixed(2)}</span> (pending approval)</p></div>` : ""}
      ${giftNotice}
      <p>This reward is sourced from the ${memberBar}% member distribution portion — not from the charity's funds. The organisation still receives its full ${charityBar}%.</p>
      <a class="cta" href="${opts.dashboardUrl}">View My Earnings</a>
    `, "Gift Reward — Your Team is Giving!");
  }

  // upline
  return wrap(`
    <p>Hi ${opts.recipientName},</p>
    <p>A member in your downline has made a gift through NFGN. Your upline reward has been credited to your pending earnings.</p>
    ${giftBox}
    ${opts.sponsorCommission != null ? `<div class="detail-box" style="border-left:4px solid #C9A84C;"><p style="margin:0;"><strong>Your Upline Reward:</strong> <span style="color:#C9A84C;font-size:18px;font-weight:900;">+$${opts.sponsorCommission.toFixed(2)}</span> (pending approval)</p></div>` : ""}
    ${giftNotice}
    <a class="cta" href="${opts.dashboardUrl}">View My Dashboard</a>
  `, "Upline Gift Reward — Downline Activity");
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

export interface BookingEmailOpts {
  recipientName: string;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  providerName: string;
  providerEmail: string;
  providerPhone?: string;
  serviceType: string;
  scheduledAt: string;
  duration: number;
  amount: number;
  bookingId: number;
  dashboardUrl: string;
  role: "member" | "provider" | "admin" | "sponsor";
}

export function bookingConfirmationHtml(opts: BookingEmailOpts): string {
  const isOldSignature = !opts.memberEmail; // backward compat guard

  const bookingDetail = `
    <div class="detail-box">
      <p><strong>Service:</strong> ${opts.serviceType}</p>
      <p><strong>Professional:</strong> ${opts.providerName}</p>
      <p><strong>Member:</strong> ${opts.memberName}</p>
      <p><strong>Date &amp; Time:</strong> ${opts.scheduledAt}</p>
      <p><strong>Duration:</strong> ${opts.duration} minutes</p>
      <p><strong>Amount:</strong> $${opts.amount.toFixed(2)}</p>
      <p><strong>Booking #:</strong> ${opts.bookingId}</p>
    </div>`;

  const proContact = `
    <div class="detail-box" style="border-left:4px solid #C9A84C;">
      <p style="margin:0 0 6px;font-weight:700;color:#0a0a0a;">Professional Contact Information</p>
      <p><strong>Name:</strong> ${opts.providerName}</p>
      <p><strong>Email:</strong> <a href="mailto:${opts.providerEmail}">${opts.providerEmail}</a></p>
      ${opts.providerPhone ? `<p><strong>Phone:</strong> ${opts.providerPhone}</p>` : ""}
    </div>`;

  const memberContact = `
    <div class="detail-box" style="border-left:4px solid #2D6A4F;">
      <p style="margin:0 0 6px;font-weight:700;color:#0a0a0a;">Client Contact Information</p>
      <p><strong>Name:</strong> ${opts.memberName}</p>
      <p><strong>Email:</strong> <a href="mailto:${opts.memberEmail}">${opts.memberEmail}</a></p>
      ${opts.memberPhone ? `<p><strong>Phone:</strong> ${opts.memberPhone}</p>` : ""}
    </div>`;

  const nonRefundableNotice = `
    <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px 18px;margin:16px 0;font-size:13px;color:#856404;">
      <strong>Cancellation Policy:</strong> This appointment is <strong>non-refundable</strong> once booked.
      If you need to reschedule, please contact your professional directly as soon as possible.
    </div>`;

  const paymentHoldNotice = `
    <div style="background:#d1ecf1;border:1px solid #bee5eb;border-radius:8px;padding:14px 18px;margin:16px 0;font-size:13px;color:#0c5460;">
      <strong>Payment Notice:</strong> Your payout for this booking will be held in <em>Pending</em> status
      until the service has been fully delivered and confirmed. Once the session is complete, your earnings
      will be released to your wallet for admin approval.
    </div>`;

  const cta = `<a class="cta" href="${opts.dashboardUrl}">View in Back Office</a>`;

  if (opts.role === "member") {
    return wrap(`
      <p>Congratulations, ${opts.recipientName}! Your appointment has been successfully booked. Here are your details:</p>
      ${bookingDetail}
      ${proContact}
      ${nonRefundableNotice}
      <p>Please reach out to your professional directly to coordinate any details. We wish you a wonderful session!</p>
      ${cta}
    `, "Booking Confirmed — Congratulations!");
  }

  if (opts.role === "provider") {
    return wrap(`
      <p>Congratulations, ${opts.recipientName}! You have a new appointment booking. Here are the details:</p>
      ${bookingDetail}
      ${memberContact}
      ${paymentHoldNotice}
      <p>Please contact your client to confirm any details and prepare for the session. We look forward to seeing you deliver a great experience!</p>
      ${cta}
    `, "New Appointment Booked — Congratulations!");
  }

  if (opts.role === "sponsor") {
    return wrap(`
      <p>Congratulations, ${opts.recipientName}! Your downline member <strong>${opts.memberName}</strong> has just booked a professional service. This is a great sign of activity in your network!</p>
      ${bookingDetail}
      <p>Keep up the great work growing your team. Log in to your back office to see the full details.</p>
      ${cta}
    `, "Downline Booking — Your Team is Active!");
  }

  return wrap(`
    <p>A new Book-A-Pro appointment has been placed. Here is the full summary:</p>
    ${bookingDetail}
    ${proContact}
    ${memberContact}
    <p>Please monitor this booking and ensure both parties have connected. You can update the status from your admin panel.</p>
    ${cta}
  `, "New Booking Alert — Admin Notification");
}

export function booking8hrReminderHtml(opts: {
  recipientName: string;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  providerName: string;
  providerEmail: string;
  providerPhone?: string;
  serviceType: string;
  scheduledAt: string;
  duration: number;
  bookingId: number;
  dashboardUrl: string;
  role: "member" | "provider" | "admin" | "sponsor";
}): string {
  const bookingDetail = `
    <div class="detail-box">
      <p><strong>Service:</strong> ${opts.serviceType}</p>
      <p><strong>Professional:</strong> ${opts.providerName}</p>
      <p><strong>Member:</strong> ${opts.memberName}</p>
      <p><strong>Date &amp; Time:</strong> ${opts.scheduledAt}</p>
      <p><strong>Duration:</strong> ${opts.duration} minutes</p>
      <p><strong>Booking #:</strong> ${opts.bookingId}</p>
    </div>`;

  const contactBlock =
    opts.role === "member"
      ? `<div class="detail-box" style="border-left:4px solid #C9A84C;">
           <p style="margin:0 0 6px;font-weight:700;">Your Professional's Contact</p>
           <p><strong>${opts.providerName}</strong> — <a href="mailto:${opts.providerEmail}">${opts.providerEmail}</a>${opts.providerPhone ? ` · ${opts.providerPhone}` : ""}</p>
         </div>`
      : opts.role === "provider"
      ? `<div class="detail-box" style="border-left:4px solid #2D6A4F;">
           <p style="margin:0 0 6px;font-weight:700;">Your Client's Contact</p>
           <p><strong>${opts.memberName}</strong> — <a href="mailto:${opts.memberEmail}">${opts.memberEmail}</a>${opts.memberPhone ? ` · ${opts.memberPhone}` : ""}</p>
         </div>`
      : "";

  const introMap: Record<string, string> = {
    member:   `Hi ${opts.recipientName}, this is your <strong>8-hour reminder</strong> for your upcoming appointment!`,
    provider: `Hi ${opts.recipientName}, you have an appointment <strong>in 8 hours</strong>. Make sure you are prepared!`,
    sponsor:  `Hi ${opts.recipientName}, your downline member <strong>${opts.memberName}</strong> has an appointment in 8 hours.`,
    admin:    `This is an automated 8-hour reminder for an upcoming Book-A-Pro appointment.`,
  };

  return wrap(`
    <p>${introMap[opts.role] ?? introMap.admin}</p>
    ${bookingDetail}
    ${contactBlock}
    <p>Please make sure everyone is ready and has confirmed contact with each other. We wish you a successful session!</p>
    <a class="cta" href="${opts.dashboardUrl}">View Booking</a>
  `, "Appointment in 8 Hours — Reminder");
}
