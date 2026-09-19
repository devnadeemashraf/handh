import { Money } from '../money';

import type { CurrencyCode } from '../money';
import type {
  AdminOrderAlertEmailData,
  EmailRenderOutput,
  OrderConfirmationEmailData,
  OrderConfirmationWhatsAppData,
  OrderDeliveredEmailData,
  OrderDeliveredWhatsAppData,
  OrderDispatchedEmailData,
  OrderDispatchedWhatsAppData,
  WhatsAppRenderOutput
} from './types';

function formatCurrency(amountMinor: number, currency = 'INR'): string {
  try {
    return Money.fromMinor(amountMinor, currency as CurrencyCode).format('en-IN');
  } catch {
    return `₹${(amountMinor / 100).toFixed(2)}`;
  }
}

function renderBaseEmailLayout(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f7f6f2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #171a19;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 32px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }
    .header {
      background-color: #0A2E24;
      padding: 32px 24px;
      text-align: center;
    }
    .brand-title {
      color: #C5A880;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 26px;
      letter-spacing: 0.15em;
      margin: 0;
      font-weight: 600;
    }
    .brand-subtitle {
      color: #E2D9CC;
      font-size: 11px;
      letter-spacing: 0.25em;
      margin-top: 6px;
      text-transform: uppercase;
    }
    .accent-bar {
      height: 2px;
      background: linear-gradient(90deg, #0A2E24 0%, #C5A880 50%, #0A2E24 100%);
    }
    .content {
      padding: 32px 28px;
    }
    .footer {
      background-color: #fbfbf9;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #eef0ea;
      font-size: 12px;
      color: #707572;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      background-color: #0A2E24;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: 0.05em;
      margin-top: 20px;
    }
    .table-items {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .table-items th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #707572;
      border-bottom: 1px solid #eef0ea;
      padding-bottom: 8px;
    }
    .table-items td {
      padding: 12px 0;
      border-bottom: 1px solid #f2f3ef;
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background-color: #e6f4ea;
      color: #137333;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">H &amp; H</h1>
      <div class="brand-subtitle">Haute &amp; Heritage</div>
    </div>
    <div class="accent-bar"></div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>H&amp;H Luxury Concierge</strong></p>
      <p style="margin: 0;">Questions about your piece? Reply to this email or reach us at <a href="mailto:concierge@handh.local" style="color: #0A2E24;">concierge@handh.local</a></p>
      <p style="margin: 12px 0 0 0; font-size: 11px; color: #9da19f;">&copy; ${new Date().getFullYear()} H&amp;H Haute &amp; Heritage. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Email Renderers ────────────────────────────────────────────────────────────

export function renderOrderConfirmationEmail(data: OrderConfirmationEmailData): EmailRenderOutput {
  const subject = `Order Confirmed: #${data.orderNumber} — H&H Luxury`;
  const formattedTotal = formatCurrency(data.totalMinor, data.currency);

  const itemsHtml = data.items
    .map(
      (item) => `<tr>
        <td style="padding-right: 12px;">
          <strong>${escapeHtml(item.title)}</strong>
          ${item.variantTitle ? `<br/><span style="font-size: 12px; color: #707572;">${escapeHtml(item.variantTitle)}</span>` : ''}
        </td>
        <td style="text-align: center; color: #707572;">&times; ${item.quantity}</td>
        <td style="text-align: right; font-weight: 500;">${formatCurrency(item.subtotalMinor, data.currency)}</td>
      </tr>`
    )
    .join('');

  const itemsText = data.items
    .map(
      (item) =>
        `- ${item.title}${item.variantTitle ? ` (${item.variantTitle})` : ''} x ${item.quantity} = ${formatCurrency(item.subtotalMinor, data.currency)}`
    )
    .join('\n');

  const contentHtml = `
    <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #0A2E24; margin-top: 0; margin-bottom: 8px;">
      Thank you for your order, ${escapeHtml(data.customerName)}
    </h2>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4e4c; margin-top: 0;">
      We have received and confirmed your order <strong>#${escapeHtml(data.orderNumber)}</strong>. Our artisans are meticulously preparing your package with the highest standard of care.
    </p>

    <div style="background-color: #f7f6f2; border-left: 3px solid #C5A880; padding: 14px 18px; border-radius: 0 4px 4px 0; margin: 24px 0;">
      <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #707572;">Order Number</span>
      <div style="font-size: 18px; font-weight: 600; color: #0A2E24; margin-top: 2px;">#${escapeHtml(data.orderNumber)}</div>
    </div>

    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #0A2E24; margin-bottom: 10px;">Ordered Creations</h3>
    <table class="table-items">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding-top: 14px; font-weight: 600; font-size: 15px; color: #0A2E24;">Total Amount Paid</td>
          <td style="padding-top: 14px; font-weight: 700; font-size: 16px; text-align: right; color: #0A2E24;">${formattedTotal}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #eef0ea;">
      <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #707572; margin-bottom: 8px;">Delivery Address</h3>
      <p style="font-size: 14px; line-height: 1.5; color: #171a19; margin: 0;">
        <strong>${escapeHtml(data.shippingAddress.recipientName)}</strong><br/>
        ${escapeHtml(data.shippingAddress.line1)}<br/>
        ${data.shippingAddress.line2 ? `${escapeHtml(data.shippingAddress.line2)}<br/>` : ''}
        ${escapeHtml(data.shippingAddress.city)}, ${escapeHtml(data.shippingAddress.state)} ${escapeHtml(data.shippingAddress.postalCode)}<br/>
        ${escapeHtml(data.shippingAddress.country)}
      </p>
    </div>

    ${
      data.orderUrl
        ? `<div style="text-align: center; margin-top: 28px;">
            <a href="${escapeHtml(data.orderUrl)}" class="btn">View Order Details</a>
           </div>`
        : ''
    }
  `;

  const text = `H&H Haute & Heritage — Order Confirmed: #${data.orderNumber}

Thank you for your order, ${data.customerName}!

We have confirmed your order #${data.orderNumber}.

Order Summary:
${itemsText}

Total: ${formattedTotal}

Delivery Address:
${data.shippingAddress.recipientName}
${data.shippingAddress.line1}
${data.shippingAddress.line2 ? `${data.shippingAddress.line2}\n` : ''}${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}

${data.orderUrl ? `View order details: ${data.orderUrl}\n` : ''}
Need assistance? Reach us at concierge@handh.local`;

  return {
    subject,
    html: renderBaseEmailLayout(subject, contentHtml),
    text
  };
}

export function renderOrderDispatchedEmail(data: OrderDispatchedEmailData): EmailRenderOutput {
  const subject = `Dispatched: Your H&H Order #${data.orderNumber} is on the way`;

  const contentHtml = `
    <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #0A2E24; margin-top: 0; margin-bottom: 8px;">
      Your order has shipped
    </h2>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4e4c; margin-top: 0;">
      Dear ${escapeHtml(data.customerName)}, your package for order <strong>#${escapeHtml(data.orderNumber)}</strong> has been carefully packed and handed over to our courier partner.
    </p>

    <div style="background-color: #f7f6f2; border: 1px solid #eef0ea; border-radius: 6px; padding: 18px 20px; margin: 24px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 12px; color: #707572; text-transform: uppercase;">Courier</span>
        <strong style="font-size: 14px; color: #0A2E24;">${escapeHtml(data.courierName)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-size: 12px; color: #707572; text-transform: uppercase;">Tracking Number (AWB)</span>
        <strong style="font-size: 14px; font-family: monospace; color: #0A2E24;">${escapeHtml(data.trackingNumber)}</strong>
      </div>
    </div>

    <p style="font-size: 13px; color: #707572; line-height: 1.6;">
      Standard delivery within India typically takes 2–5 business days. You can track your parcel's real-time journey anytime.
    </p>

    ${
      data.trackingUrl
        ? `<div style="text-align: center; margin-top: 24px;">
            <a href="${escapeHtml(data.trackingUrl)}" class="btn">Track Your Package</a>
           </div>`
        : ''
    }
  `;

  const text = `H&H Haute & Heritage — Order Dispatched: #${data.orderNumber}

Dear ${data.customerName},

Your order #${data.orderNumber} has been dispatched!

Courier: ${data.courierName}
Tracking Number (AWB): ${data.trackingNumber}

${data.trackingUrl ? `Track package: ${data.trackingUrl}\n` : ''}
Questions? Contact concierge@handh.local`;

  return {
    subject,
    html: renderBaseEmailLayout(subject, contentHtml),
    text
  };
}

export function renderOrderDeliveredEmail(data: OrderDeliveredEmailData): EmailRenderOutput {
  const subject = `Delivered: Your H&H Order #${data.orderNumber}`;

  const contentHtml = `
    <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #0A2E24; margin-top: 0; margin-bottom: 8px;">
      Delivered with care
    </h2>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4e4c; margin-top: 0;">
      Dear ${escapeHtml(data.customerName)}, your package for order <strong>#${escapeHtml(data.orderNumber)}</strong> has been successfully delivered.
    </p>

    <div style="background-color: #f7f6f2; border-left: 3px solid #137333; padding: 14px 18px; border-radius: 0 4px 4px 0; margin: 24px 0;">
      <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #137333; font-weight: 600;">Delivery Status</span>
      <div style="font-size: 16px; font-weight: 600; color: #0A2E24; margin-top: 2px;">Delivered Successfully</div>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #4a4e4c;">
      We hope your new H&amp;H pieces bring you grace and joy. If you have any questions or need sizing adjustments, our concierge team is always at your service.
    </p>

    ${
      data.orderUrl
        ? `<div style="text-align: center; margin-top: 24px;">
            <a href="${escapeHtml(data.orderUrl)}" class="btn">View Order History</a>
           </div>`
        : ''
    }
  `;

  const text = `H&H Haute & Heritage — Order Delivered: #${data.orderNumber}

Dear ${data.customerName},

Your order #${data.orderNumber} has been delivered.

We hope you enjoy your new pieces!
${data.orderUrl ? `View your order: ${data.orderUrl}\n` : ''}
Need help? Contact concierge@handh.local`;

  return {
    subject,
    html: renderBaseEmailLayout(subject, contentHtml),
    text
  };
}

export function renderAdminOrderAlertEmail(data: AdminOrderAlertEmailData): EmailRenderOutput {
  const formattedTotal = formatCurrency(data.totalMinor, data.currency);
  const subject = `[New Order Alert] #${data.orderNumber} — ${formattedTotal}`;

  const itemsListHtml = data.items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.title)}</strong> ${item.variantTitle ? `(${escapeHtml(item.variantTitle)})` : ''} &times; ${item.quantity} — ${formatCurrency(item.subtotalMinor, data.currency)}</li>`
    )
    .join('');

  const itemsListText = data.items
    .map(
      (item) =>
        `- ${item.title}${item.variantTitle ? ` (${item.variantTitle})` : ''} x ${item.quantity} = ${formatCurrency(item.subtotalMinor, data.currency)}`
    )
    .join('\n');

  const contentHtml = `
    <div style="display: inline-block; padding: 4px 10px; background-color: #0A2E24; color: #C5A880; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; border-radius: 4px; margin-bottom: 12px;">
      Store Operations Alert
    </div>
    <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #0A2E24; margin-top: 0; margin-bottom: 8px;">
      New Confirmed Order: #${escapeHtml(data.orderNumber)}
    </h2>
    <p style="font-size: 14px; color: #4a4e4c; margin-top: 0;">
      A customer has completed payment. Details below:
    </p>

    <div style="background-color: #f7f6f2; border-radius: 6px; padding: 18px 20px; margin: 20px 0; font-size: 14px; line-height: 1.6;">
      <p style="margin: 0 0 8px 0;"><strong>Customer:</strong> ${escapeHtml(data.customerName)} (${escapeHtml(data.customerPhone)}, ${escapeHtml(data.customerEmail)})</p>
      <p style="margin: 0 0 8px 0;"><strong>Total Revenue:</strong> <span style="font-size: 16px; font-weight: 700; color: #0A2E24;">${formattedTotal}</span></p>
      <p style="margin: 0;"><strong>Destination:</strong> ${escapeHtml(data.shippingAddress.city)}, ${escapeHtml(data.shippingAddress.state)} (${escapeHtml(data.shippingAddress.postalCode)})</p>
    </div>

    <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #0A2E24; margin-bottom: 8px;">Items Ordered (${data.items.length})</h3>
    <ul style="font-size: 14px; line-height: 1.6; color: #4a4e4c; padding-left: 20px; margin: 0;">
      ${itemsListHtml}
    </ul>

    ${
      data.adminOrderUrl
        ? `<div style="text-align: center; margin-top: 24px;">
            <a href="${escapeHtml(data.adminOrderUrl)}" class="btn">Fulfill Order in Admin</a>
           </div>`
        : ''
    }
  `;

  const text = `[H&H Operations] New Order Alert: #${data.orderNumber}

Order Number: #${data.orderNumber}
Amount: ${formattedTotal}
Customer: ${data.customerName} (${data.customerPhone}, ${data.customerEmail})
Destination: ${data.shippingAddress.city}, ${data.shippingAddress.state}

Items:
${itemsListText}

${data.adminOrderUrl ? `Admin link: ${data.adminOrderUrl}\n` : ''}`;

  return {
    subject,
    html: renderBaseEmailLayout(subject, contentHtml),
    text
  };
}

// ── WhatsApp Formatters ────────────────────────────────────────────────────────

export function formatOrderConfirmationWhatsApp(
  data: OrderConfirmationWhatsAppData
): WhatsAppRenderOutput {
  const formattedTotal = formatCurrency(data.totalMinor, data.currency);

  const text = `*H&H Luxury Concierge* ✨

Dear ${data.customerName},
Thank you for choosing H&H Haute & Heritage.

Your order *#${data.orderNumber}* for *${formattedTotal}* (${data.itemCount} item${data.itemCount === 1 ? '' : 's'}) has been confirmed! Our atelier is preparing your pieces.

${data.trackingUrl ? `Track order progress: ${data.trackingUrl}\n\n` : ''}Reply to this message anytime to speak with your personal concierge.`;

  return { text };
}

export function formatOrderDispatchedWhatsApp(
  data: OrderDispatchedWhatsAppData
): WhatsAppRenderOutput {
  const text = `*H&H Delivery Update* 📦

Dear ${data.customerName},
Your order *#${data.orderNumber}* has been dispatched via *${data.courierName}*.

Tracking Number (AWB): *${data.trackingNumber}*
${data.trackingUrl ? `Track package: ${data.trackingUrl}\n\n` : ''}Expected delivery is within 2–5 business days.`;

  return { text };
}

export function formatOrderDeliveredWhatsApp(
  data: OrderDeliveredWhatsAppData
): WhatsAppRenderOutput {
  const text = `*H&H Delivery Complete* 🌸

Dear ${data.customerName},
Your order *#${data.orderNumber}* has been delivered!

We hope your new H&H pieces bring grace and beauty to your wardrobe. Reach out here anytime if you need assistance.`;

  return { text };
}
