import 'server-only';
import { db } from './supabase';
import { env } from './env';
import { Ghl } from './ghl';
import { fileLink } from './token';
import { alertAdmins, sendEmail } from './email';
import { sendWhatsAppTemplate } from './whatsapp';
import { buildQuotePdf } from './pdf';
import { ownerWhatsAppLink, syncToGhl, summaryRows, type QuoteRow, type SyncDeps } from './sync';

export { ownerWhatsAppLink };
import { sendCapi } from './capi';
import { isQualified } from './scoring';
import { waVerifyText } from './options';
import { customerEmail, nudgeEmail, ownerAlertEmail } from './email-templates';

const SEVEN_DAYS = 7 * 24 * 3600;

export async function loadRow(id: string): Promise<QuoteRow | null> {
  const { data } = await db().from('quote_requests').select('*').eq('id', id).maybeSingle();
  return (data as QuoteRow) || null;
}

export async function updateRow(id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await db().from('quote_requests').update(patch).eq('id', id);
  if (error) throw new Error('Supabase update failed: ' + error.message);
}

export function syncDeps(): SyncDeps {
  return {
    ghl: new Ghl(env.ghlToken(), env.ghlLocationId(), env.ghlBase()),
    store: { update: updateRow },
    pipelineName: env.ghlPipelineName(),
    stageName: env.ghlStageName(),
    userIds: env.ghlUserIds(),
    nextRoundRobin: async (size) => {
      const { data, error } = await db().rpc('next_round_robin', { p_size: size });
      if (error) throw new Error('round robin failed: ' + error.message);
      return Number(data) || 0;
    },
    links: { artwork: fileLink, pdf: fileLink },
    alert: alertAdmins,
  };
}

async function download(path: string): Promise<Uint8Array | null> {
  const { data } = await db().storage.from(env.artworkBucket()).download(path);
  return data ? new Uint8Array(await data.arrayBuffer()) : null;
}

export async function signedUrl(path: string, seconds = SEVEN_DAYS): Promise<string | null> {
  const { data } = await db().storage.from(env.artworkBucket()).createSignedUrl(path, seconds);
  return data?.signedUrl || null;
}

// Builds the customer PDF (details plus artwork) and stores it privately.
export async function ensurePdf(row: QuoteRow): Promise<{ path: string; bytes: Uint8Array }> {
  if (row.pdf_path) {
    const bytes = await download(row.pdf_path);
    if (bytes) return { path: row.pdf_path, bytes };
  }
  const artwork = await Promise.all(
    row.files.map(async (f) => ({
      name: f.name,
      ext: f.ext,
      // Only images and PDFs can be placed in the PDF; skip big downloads for other formats.
      bytes: ['png', 'jpg', 'jpeg', 'pdf'].includes(f.ext) ? await download(f.path) : null,
    })),
  );
  const logo = await fetch(`${env.siteUrl()}/assets/logo-240.png`)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .then((b) => (b ? new Uint8Array(b) : null))
    .catch(() => null);
  const bytes = await buildQuotePdf({
    quoteNumber: row.verify_code,
    firstName: row.first_name,
    lastName: row.last_name,
    business: row.business || undefined,
    email: row.email,
    phone: row.phone_e164,
    rows: summaryRows(row),
    notes: row.notes || undefined,
    artwork,
    logo,
    submittedAt: new Date(row.created_at),
  });
  const path = `pdf/${row.id}/Future-PVC-Patch-Quote-${row.verify_code}.pdf`;
  const { error } = await db().storage.from(env.artworkBucket()).upload(path, bytes, { contentType: 'application/pdf', upsert: true });
  if (error) throw new Error('PDF upload failed: ' + error.message);
  await updateRow(row.id, { pdf_path: path });
  row.pdf_path = path;
  return { path, bytes };
}

export async function emailCustomer(row: QuoteRow): Promise<void> {
  if (row.email_sent) return;
  const viaGhl = env.customerEmailVia() === 'ghl';
  if (viaGhl && !row.ghl_contact_id) return; // sent after the GHL contact exists
  const { bytes, path } = await ensurePdf(row);
  const wa = env.whatsappBusinessNumber();
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(waVerifyText(row.verify_code))}` : '';
  const { subject, html } = customerEmail(row, waLink);
  let ok = false;
  if (viaGhl) {
    const url = await signedUrl(path);
    const ghl = new Ghl(env.ghlToken(), env.ghlLocationId(), env.ghlBase());
    await ghl.sendEmail(row.ghl_contact_id!, subject, html, url ? [url] : [], env.ghlEmailFrom());
    ok = true;
  } else {
    ok = await sendEmail({
      to: [row.email],
      subject,
      html,
      attachments: [{ filename: `Future-PVC-Patch-Quote-${row.verify_code}.pdf`, content: bytes }],
    });
  }
  if (ok) await updateRow(row.id, { email_sent: true });
}

export async function sendQualifiedEvent(row: QuoteRow): Promise<void> {
  if (row.qualified_event_sent || !isQualified(row.lead_grade)) return;
  const t = row.tracking || {};
  const sent = await sendCapi({
    eventName: 'QualifiedRFQ',
    eventId: `qualified-${row.id}`,
    sourceUrl: t.landing_page,
    email: row.email,
    phone: row.phone_e164,
    firstName: row.first_name,
    lastName: row.last_name,
    externalId: row.id,
    fbp: t.fbp,
    fbc: t.fbc,
    customData: { lead_score: row.lead_score, lead_grade: row.lead_grade, patch_type: row.patch_type, quantity: row.quantity },
  });
  if (sent) await updateRow(row.id, { qualified_event_sent: true });
}

// Instant "new lead" email to the owner with one tap Call, WhatsApp and artwork links.
export async function alertOwner(row: QuoteRow): Promise<void> {
  if (row.owner_alert_sent) return;
  const to = env.alertEmails();
  if (!to.length) return;
  const { subject, html } = ownerAlertEmail(row, {
    whatsapp: ownerWhatsAppLink(row),
    crm: `${env.crmUrl()}/lead/${row.id}`,
    artwork: row.files.map((f) => ({ name: f.name, href: fileLink(f.path) })),
    pdf: row.pdf_path ? fileLink(row.pdf_path) : null,
  });
  const ok = await sendEmail({ to, subject, html });
  if (ok) await updateRow(row.id, { owner_alert_sent: true });
}

// Email nudge (and WhatsApp template if one is approved) for customers who have not verified yet.
export async function nudgeUnverified(row: QuoteRow): Promise<void> {
  if (row.whatsapp_verified_at || row.nudge_sent_at) return;
  await updateRow(row.id, { nudge_sent_at: new Date().toISOString() });
  const wa = env.whatsappBusinessNumber();
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(waVerifyText(row.verify_code))}` : '';
  if (waLink) {
    await sendEmail({ to: [row.email], ...nudgeEmail(row, waLink) });
  }
  if (env.waNudgeTemplate()) {
    await sendWhatsAppTemplate(row.phone_e164, env.waNudgeTemplate(), [row.first_name, row.verify_code]).catch((e) =>
      console.error('nudge template failed', e),
    );
  }
}

// Runs every post-save step. Each step is independent so one failure never blocks the others.
export async function processRequest(id: string): Promise<string> {
  const row = await loadRow(id);
  if (!row) return 'missing';
  await sendQualifiedEvent(row).catch((e) => console.error('QualifiedRFQ failed', e));

  if (env.crmProvider() === 'ghl') {
    // GHL first, so the customer email goes out from the GHL conversation and the owner is
    // notified by the GHL workflow. The owner email below only sends if Resend is configured.
    const result = row.status === 'synced' ? 'synced' : await syncToGhl(row, syncDeps());
    const fresh = (await loadRow(id)) || row;
    await ensurePdf(fresh).catch((e) => console.error('pdf failed', e));
    await emailCustomer(fresh).catch((e) => console.error('customer email failed', e));
    await alertOwner(fresh).catch((e) => console.error('owner alert failed', e));
    return result;
  }

  await emailCustomer(row).catch((e) => console.error('customer email failed', e));
  await alertOwner(row).catch((e) => console.error('owner alert failed', e));
  if (row.status === 'synced' || row.status === 'done') return row.status;
  if (env.crmProvider() !== 'ghl') {
    // No CRM: the lead lives in Supabase and on /admin. Retry later only if the owner was not told yet.
    const fresh = await loadRow(id);
    if (fresh && !fresh.owner_alert_sent && env.alertEmails().length) {
      await updateRow(id, { status: 'failed', attempts: row.attempts + 1, last_error: 'Owner alert email not sent', next_attempt_at: new Date(Date.now() + 5 * 60000).toISOString() });
      return 'failed';
    }
    await updateRow(id, { status: 'done', last_error: null, next_attempt_at: null });
    return 'done';
  }
  return syncToGhl(row, syncDeps());
}

