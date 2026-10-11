/**
 * keep-alive.ts — Light ping to prevent Supabase free-tier idle pause.
 *
 * Executes a minimal SELECT every run; enough to keep the project active.
 *
 * Usage:
 *   npx tsx scripts/keep-alive.ts
 */

import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  const supabase = getServiceClient();
  console.log('[keep-alive] Pinging Supabase …');
  const { data, error } = await supabase.from('leagues').select('id').limit(1);
  if (error) throw error;
  console.log(`[keep-alive] OK — ${data?.length ?? 0} league(s) found.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
