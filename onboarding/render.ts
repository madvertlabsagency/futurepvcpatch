// Renders the real customer and client emails and the quote PDF for the sample lead (onboarding/out/lead-row.json),
// using the same template functions and PDF builder the funnel sends.
import fs from 'node:fs';
import path from 'node:path';
import { customerEmail, nudgeEmail, ownerAlertEmail } from '../lib/email-templates';
import { buildQuotePdf } from '../lib/pdf';
import { summaryRows, ownerWhatsAppLink, type QuoteRow } from '../lib/sync';
import { waVerifyText } from '../lib/options';

const dir = path.join(__dirname, 'out');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const row = JSON.parse(fs.readFileSync(path.join(dir, 'lead-row.json'), 'utf8')) as QuoteRow;
const wa = cfg.whatsapp.replace(/\D/g, '');
const waLink = `https://wa.me/${wa}?text=${encodeURIComponent(waVerifyText(row.verify_code))}`;

const emails = {
  customer: { from: `${cfg.clientName} <quotes@futurepvcpatch.com>`, to: row.email, attachment: `Future-PVC-Patch-Quote-${row.verify_code}.pdf`, ...customerEmail(row, waLink) },
  owner: {
    from: `${cfg.clientName} <quotes@futurepvcpatch.com>`,
    to: cfg.clientEmail,
    attachment: '',
    ...ownerAlertEmail(row, { whatsapp: ownerWhatsAppLink(row), crm: `${cfg.crmUrl}/lead/${row.id}`, artwork: row.files.map((f) => ({ name: f.name, href: '#' })), pdf: '#' }),
  },
  nudge: { from: `${cfg.clientName} <quotes@futurepvcpatch.com>`, to: row.email, attachment: '', ...nudgeEmail(row, waLink) },
};
fs.writeFileSync(path.join(dir, 'emails.json'), JSON.stringify(emails, null, 1));

(async () => {
  const art = fs.readFileSync(path.join(__dirname, 'assets', 'sample-artwork.png'));
  const logo = fs.readFileSync(path.join(__dirname, '..', 'public', 'assets', 'logo-240.png'));
  const bytes = await buildQuotePdf({
    quoteNumber: row.verify_code,
    firstName: row.first_name,
    lastName: row.last_name,
    business: row.business || undefined,
    email: row.email,
    phone: row.phone_e164,
    rows: summaryRows(row),
    notes: row.notes || undefined,
    artwork: row.files.map((f) => ({ name: f.name, ext: f.ext, bytes: new Uint8Array(art) })),
    logo: new Uint8Array(logo),
    submittedAt: new Date(row.created_at),
  });
  fs.writeFileSync(path.join(dir, 'quote.pdf'), bytes);
  console.log('rendered emails and quote.pdf');
})();
