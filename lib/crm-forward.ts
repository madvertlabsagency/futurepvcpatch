import 'server-only';
import { env } from './env';
import { db } from './supabase';
import { ensurePdf, signedUrl, updateRow } from './service';
import type { QuoteRow } from './sync';

const LINK_SECONDS = 24 * 3600; // the CRM copies the files right away; a day covers retries

// Sends one lead to the Madvert Labs Patches CRM (crm.madvertlabs.com), which keeps every client's leads
// under their own account. Artwork and the quote PDF go as short lived signed links the CRM copies.
// Returns true once the CRM has the lead. Never throws: a failure is saved on the row for the cron retry.
export async function forwardToCrm(row: QuoteRow & { event_id?: string; crm_forwarded_at?: string | null }): Promise<boolean> {
  if (row.crm_forwarded_at) return true;
  const secret = env.crmIngestSecret();
  if (!secret) return false;
  try {
    if (!row.pdf_path) await ensurePdf(row).catch((e) => console.error('pdf before CRM forward failed', e));
    const files = [];
    for (const f of row.files) {
      const url = await signedUrl(f.path, LINK_SECONDS);
      if (url) files.push({ name: f.name, ext: f.ext, url });
    }
    const pdfUrl = row.pdf_path ? await signedUrl(row.pdf_path, LINK_SECONDS) : null;
    const res = await fetch(env.crmIngestUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-crm-ingest-secret': secret },
      body: JSON.stringify({
        accountSlug: env.crmAccountSlug(),
        lead: {
          eventId: row.event_id,
          verifyCode: row.verify_code,
          createdAt: row.created_at,
          firstName: row.first_name,
          lastName: row.last_name,
          business: row.business,
          email: row.email,
          phone: row.phone_e164,
          contactMethod: row.contact_method,
          patchType: row.patch_type,
          quantity: row.quantity,
          width: row.width,
          height: row.height,
          sizeUnsure: row.size_unsure,
          backing: row.backing,
          deadline: row.deadline,
          deadlineDate: row.deadline_date,
          notes: row.notes,
          noArtwork: row.no_artwork,
          leadScore: row.lead_score,
          leadGrade: row.lead_grade,
          tags: row.tags,
          tracking: row.tracking || {},
          whatsappVerifiedAt: row.whatsapp_verified_at,
          source: env.siteUrl(),
        },
        files,
        pdf: row.pdf_path && pdfUrl ? { name: row.pdf_path.split('/').pop() || 'quote.pdf', url: pdfUrl } : null,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok || !data.id) throw new Error(`CRM answered ${res.status}: ${data.error || 'no lead id'}`);
    await updateRow(row.id, { crm_forwarded_at: new Date().toISOString(), crm_lead_id: data.id, crm_forward_error: null });
    return true;
  } catch (e) {
    const msg = (e instanceof Error ? e.message : String(e)).slice(0, 500);
    console.error('CRM forward failed', msg);
    await updateRow(row.id, { crm_forward_error: msg }).catch(() => undefined);
    return false;
  }
}

// Leads from the last 7 days the CRM does not have yet (first attempt failed, or the secret was added later).
export async function forwardPending(limit = 25): Promise<number> {
  if (!env.crmIngestSecret()) return 0;
  const since = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
  const { data } = await db().from('quote_requests').select('*').is('crm_forwarded_at', null).gte('created_at', since).order('created_at').limit(limit);
  let sent = 0;
  for (const row of data || []) if (await forwardToCrm(row as QuoteRow)) sent++;
  return sent;
}
