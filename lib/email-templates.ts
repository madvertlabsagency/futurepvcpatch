// The three customer and client emails, as plain functions: service.ts sends them, and the onboarding
// guide renders the same functions for its screenshots, so the guide always shows the real emails.
import { BUSINESS, contactLine } from './options';
import { summaryRows, type QuoteRow } from './sync';

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

const table = (rows: { k: string; v: string }[]) =>
  `<table style="width:100%;border-collapse:collapse;font-size:15px">${rows
    .map((r) => `<tr><td style="padding:6px 0;color:#55595F">${escapeHtml(r.k)}</td><td style="padding:6px 0;text-align:right;font-weight:700">${escapeHtml(String(r.v))}</td></tr>`)
    .join('')}</table>`;

const waButton = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="background:#25D366;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;display:inline-block">${label}</a></p>`;

// Sent to the customer right after they submit, with their request as a PDF attachment.
export function customerEmail(row: QuoteRow, waLink: string): { subject: string; html: string } {
  return {
    subject: `Your ${BUSINESS.name} quote request ${row.verify_code}`,
    html: `<div style="font-family:Arial,sans-serif;color:#0F1A3A;max-width:560px">
      <h2 style="margin:0 0 8px">Thanks ${escapeHtml(row.first_name)}, your quote request is in!</h2>
      <p style="color:#55595F">Our patch team will send your quote and free mockup within 24 hours. Your full request and artwork are attached as a PDF.</p>
      ${table(summaryRows(row))}
      ${waLink ? waButton(waLink, 'Chat with us on WhatsApp') : ''}
      <p style="color:#55595F;font-size:13px">${escapeHtml(contactLine('. '))}.</p>
    </div>`,
  };
}

export type OwnerLinks = { whatsapp: string; crm: string; artwork: { name: string; href: string }[]; pdf: string | null };

// The client's instant "new lead" email, with one tap WhatsApp, Call, Email and CRM buttons.
export function ownerAlertEmail(row: QuoteRow, links: OwnerLinks): { subject: string; html: string } {
  const t = row.tracking || {};
  const rows = [
    ...summaryRows(row),
    { k: 'Lead score', v: `${row.lead_score} (${row.lead_grade})` },
    { k: 'Tags', v: row.tags.join(', ') },
    { k: 'Business', v: row.business || 'n/a' },
    { k: 'Email', v: row.email },
    { k: 'WhatsApp', v: row.phone_e164 },
    { k: 'Source', v: [t.utm_source, t.utm_campaign, t.utm_content].filter(Boolean).join(' / ') || 'Direct' },
  ];
  const btn = (href: string, label: string, bg: string) =>
    `<a href="${href}" style="display:inline-block;margin:0 8px 8px 0;background:${bg};color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px">${label}</a>`;
  const art = links.artwork.map((f) => `<a href="${f.href}">${escapeHtml(f.name)}</a>`).join('<br>') || 'No artwork, needs design help';
  return {
    subject: `New quote ${row.verify_code}: ${row.first_name} ${row.last_name}, ${row.quantity} ${row.patch_type} (${row.lead_grade})`,
    html: `<div style="font-family:Arial,sans-serif;color:#0F1A3A;max-width:600px">
      <h2 style="margin:0 0 4px">New quote request ${row.verify_code}</h2>
      <p style="margin:0 0 16px;color:#55595F">Reply fast: leads contacted within 5 minutes are far more likely to buy.</p>
      <p>${btn(links.whatsapp, 'WhatsApp customer', '#25D366')}${btn(`tel:${row.phone_e164}`, 'Call', '#0F1A3A')}${btn(`mailto:${row.email}?subject=${encodeURIComponent(`Your ${BUSINESS.name} quote ` + row.verify_code)}`, 'Email', '#1F3B83')}${btn(links.crm, 'Open in CRM', '#0877AA')}</p>
      ${table(rows)}
      <p><strong>Notes:</strong> ${escapeHtml(row.notes || 'none')}</p>
      <p><strong>Artwork:</strong><br>${art}</p>
      <p>${links.pdf ? `<a href="${links.pdf}">Quote PDF</a>` : ''}</p>
    </div>`,
  };
}

// Reminder for customers who have not messaged on WhatsApp 10 minutes after submitting.
export function nudgeEmail(row: QuoteRow, waLink: string): { subject: string; html: string } {
  return {
    subject: `${row.first_name}, where should we send your free mockup?`,
    html: `<div style="font-family:Arial,sans-serif;color:#0F1A3A;max-width:560px">
        <h2 style="margin:0 0 8px">Your patch mockup is being prepared</h2>
        <p style="color:#55595F">Hi ${escapeHtml(row.first_name)}, we are working on your ${escapeHtml(row.quantity)} ${escapeHtml(row.patch_type)} order (quote ${row.verify_code}). The fastest way to get your price and mockup is WhatsApp. Tap below and press Send.</p>
        ${waButton(waLink, 'Get my mockup on WhatsApp')}
        <p style="color:#55595F;font-size:13px">Prefer email? Just reply to this message. ${escapeHtml(contactLine('. '))}.</p>
      </div>`,
  };
}
