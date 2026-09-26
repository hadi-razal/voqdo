/**
 * Local development wrapper around the shared Dodo helpers used by the
 * Supabase Edge Functions. Reads configuration from `process.env`.
 */
import * as shared from '../supabase/functions/_shared/dodo.mjs';
import { verifyStandardWebhook } from '../supabase/functions/_shared/webhooks.mjs';

const env = (name) => process.env[name];

export function dodoConfig() {
  return shared.dodoConfig(env);
}

export function createProCheckout(options = {}) {
  return shared.createProCheckout(dodoConfig(), options);
}

export function verifyProEntitlement(options = {}) {
  return shared.verifyProEntitlement(dodoConfig(), options);
}

/** Verifies a Standard Webhooks signature, then parses the payload. */
export async function parseDodoWebhook(rawBody, headers) {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!secret) return { ok: false, error: 'Webhook signing secret is not configured.' };
  const verified = await verifyStandardWebhook({
    secret,
    id: headers['webhook-id'],
    timestamp: headers['webhook-timestamp'],
    signature: headers['webhook-signature'],
    body: rawBody,
  });
  if (!verified) return { ok: false, error: 'Invalid webhook signature.' };
  try {
    return { ok: true, payload: JSON.parse(rawBody) };
  } catch {
    return { ok: false, error: 'Invalid webhook JSON.' };
  }
}
