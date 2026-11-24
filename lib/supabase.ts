import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl(), env.supabaseServiceKey(), { auth: { persistSession: false } });
  }
  return client;
}

let analytics: SupabaseClient | null = null;

// Funnel analytics database: its own project when APP_ANALYTICS_SUPABASE_* are set, otherwise the main one.
export function analyticsDb(): SupabaseClient {
  if (!env.analyticsUrl() || !env.analyticsKey()) return db();
  if (!analytics) analytics = createClient(env.analyticsUrl(), env.analyticsKey(), { auth: { persistSession: false } });
  return analytics;
}

// Id of this funnel's CRM account, looked up once. null when the account does not exist yet.
let accountId: string | null | undefined;
export async function crmAccountId(): Promise<string | null> {
  if (accountId) return accountId;
  const { data } = await db().from('crm_accounts').select('id').eq('slug', env.crmAccountSlug()).maybeSingle();
  accountId = (data as { id: string } | null)?.id || null;
  return accountId;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await db().rpc('hit_rate_limit', { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
    if (error) throw new Error(error.message);
    return data === true;
  } catch (e) {
    console.error('rate limit check failed', e);
    return true; // fail open so a database hiccup never blocks a real lead
  }
}

export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
}
