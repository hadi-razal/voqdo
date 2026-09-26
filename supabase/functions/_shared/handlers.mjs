import { analyzeWithOpenRouter, MAX_CHARS } from './analysis.mjs';
import { parseReflectionInput, reflectWithOpenRouter } from './reflect.mjs';
import { createPortalLink, createProCheckout, dodoConfig, subscriptionFromWebhook, verifyProEntitlement } from './dodo.mjs';
import { verifyStandardWebhook } from './webhooks.mjs';

/**
 * HTTP handlers for VOQDO's Edge Functions. Everything platform-specific
 * (auth, database, secrets) arrives through `deps`, so the same handlers run
 * on Supabase's Deno runtime and under Node's test runner.
 *
 * @typedef {{ id: string, email: string | null, isAnonymous: boolean }} AuthUser
 * @typedef {{
 *   env: (name: string) => string | undefined,
 *   authenticate: (req: Request) => Promise<AuthUser | null>,
 *   hasAccess: (userId: string) => Promise<boolean>,
 *   consumeQuota: (userId: string, kind: string, perMinute: number, perDay: number) => Promise<boolean>,
 *   upsertSubscription: (row: object) => Promise<boolean>,
 *   subscriptionOwner: (subscriptionId: string) => Promise<string | null>,
 *   customerIdFor: (userId: string) => Promise<string | null>,
 *   webhookSeen: (id: string) => Promise<boolean>,
 *   recordWebhook: (id: string, type: string) => Promise<void>,
 *   deleteUser: (userId: string) => Promise<void>,
 *   fetch?: typeof fetch,
 *   now?: () => number,
 *   analyze?: typeof analyzeWithOpenRouter,
 *   reflect?: typeof reflectWithOpenRouter,
 * }} Deps
 */

export const AI_LIMITS = {
  analyze: { perMinute: 6, perDay: 40 },
  reflect: { perMinute: 3, perDay: 15 },
};

// Bearer tokens, not cookies, carry auth, so a wildcard origin is safe here.
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function readJson(req, maxBytes) {
  const text = await req.text();
  if (text.length > maxBytes) throw new Error('TOO_LARGE');
  const value = JSON.parse(text || '{}');
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_JSON');
  return value;
}

/** Shared preamble: CORS preflight, POST only, and a signed-in caller. */
async function preamble(req, deps) {
  if (req.method === 'OPTIONS') return { response: new Response(null, { status: 204, headers: CORS }) };
  if (req.method !== 'POST') return { response: json(405, { error: 'Method not allowed' }) };
  const user = await deps.authenticate(req);
  if (!user) return { response: json(401, { error: 'Your session expired. Please reopen VOQDO.', code: 'AUTH' }) };
  return { user };
}

/** POST { task: 'analyze' | 'reflect', body, mode? } */
export function createAiHandler(deps) {
  return async (req) => {
    const { response, user } = await preamble(req, deps);
    if (response) return response;

    const apiKey = deps.env('OPENROUTER_API_KEY');
    if (!apiKey) return json(503, { error: 'AI is not available right now. Local suggestions still work.' });

    let input;
    try {
      input = await readJson(req, 32_000);
    } catch {
      return json(400, { error: 'Invalid request.' });
    }
    const task = input.task;
    if (task !== 'analyze' && task !== 'reflect') return json(400, { error: 'Unknown AI task.' });
    if (typeof input.body !== 'string' || !input.body.trim() || input.body.length > MAX_CHARS) {
      return json(400, { error: `AI works with 1–${MAX_CHARS.toLocaleString('en-US')} characters.` });
    }
    if (task === 'reflect') {
      try {
        parseReflectionInput(input.body, input.mode);
      } catch {
        return json(400, { error: 'Choose 1–5 entries for a reflection.' });
      }
    }

    if (!(await deps.hasAccess(user.id))) {
      return json(402, { error: 'Your free trial has ended. Subscribe to VOQDO Pro to keep using AI.', code: 'NO_ACCESS' });
    }
    const limits = AI_LIMITS[task];
    if (!(await deps.consumeQuota(user.id, task, limits.perMinute, limits.perDay))) {
      return json(429, { error: 'That’s a lot of AI for now. Please try again a little later.', code: 'QUOTA' });
    }

    try {
      const result =
        task === 'analyze'
          ? await (deps.analyze ?? analyzeWithOpenRouter)(input.body, { apiKey, fetchImpl: deps.fetch })
          : await (deps.reflect ?? reflectWithOpenRouter)(input.body, { apiKey, mode: input.mode, fetchImpl: deps.fetch });
      return json(200, result);
    } catch {
      // Never log journal text, upstream payloads or credentials.
      return json(502, { error: 'AI is unavailable right now. Your draft is unchanged.' });
    }
  };
}

/** Return URLs Dodo may send people back to after checkout. */
export function isAllowedReturnUrl(value, { webOrigins = '', mode = 'test' } = {}) {
  if (typeof value !== 'string' || value.length > 300) return false;
  if (value.startsWith('voqdo://')) return true;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const origins = webOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (origins.includes(url.origin)) return true;
  // Development builds (Expo Go, local web) are allowed only in test mode.
  if (mode !== 'live' && (url.protocol === 'exp:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1')) return true;
  return false;
}

/** POST { action: 'checkout' | 'confirm' | 'portal', ... } */
export function createBillingHandler(deps) {
  return async (req) => {
    const { response, user } = await preamble(req, deps);
    if (response) return response;

    const config = dodoConfig(deps.env);
    if (!config.configured) return json(503, { error: 'Payments are not set up yet. Please try again later.' });

    let input;
    try {
      input = await readJson(req, 8_000);
    } catch {
      return json(400, { error: 'Invalid request.' });
    }

    if (input.action === 'checkout') {
      if (!isAllowedReturnUrl(input.returnUrl, { webOrigins: deps.env('APP_WEB_ORIGINS'), mode: config.mode })) {
        return json(400, { error: 'Invalid return address.' });
      }
      try {
        const session = await createProCheckout(config, {
          email: user.email ?? (typeof input.email === 'string' ? input.email : undefined),
          name: typeof input.name === 'string' ? input.name : undefined,
          returnUrl: input.returnUrl,
          customerId: (await deps.customerIdFor(user.id)) ?? undefined,
          userId: user.id,
          fetchImpl: deps.fetch,
        });
        return json(200, session);
      } catch {
        return json(502, { error: 'Could not open checkout. Please try again.' });
      }
    }

    if (input.action === 'confirm') {
      let result;
      try {
        result = await verifyProEntitlement(config, {
          subscriptionId: typeof input.subscriptionId === 'string' ? input.subscriptionId : undefined,
          paymentId: typeof input.paymentId === 'string' ? input.paymentId : undefined,
          status: typeof input.status === 'string' ? input.status : undefined,
          fetchImpl: deps.fetch,
        });
      } catch {
        return json(502, { active: false, error: 'Could not reach the payment provider. Please try again.' });
      }
      if (!result.active) return json(200, { active: false, reason: result.reason });

      // A purchase can only ever unlock the account that made it.
      if (result.userId && result.userId !== user.id) {
        return json(403, { active: false, error: 'This purchase belongs to a different account.' });
      }
      if (result.subscriptionId) {
        const owner = await deps.subscriptionOwner(result.subscriptionId);
        if (owner && owner !== user.id) {
          return json(403, { active: false, error: 'This purchase belongs to a different account.' });
        }
      }

      await deps.upsertSubscription({
        userId: user.id,
        status: result.status,
        subscriptionId: result.subscriptionId ?? null,
        customerId: result.customerId ?? null,
        paymentId: result.paymentId ?? null,
        currentPeriodEnd: result.currentPeriodEnd ?? null,
        eventAt: new Date(deps.now?.() ?? Date.now()).toISOString(),
      });
      return json(200, { active: true, status: result.status, currentPeriodEnd: result.currentPeriodEnd ?? null });
    }

    if (input.action === 'portal') {
      try {
        const customerId = await deps.customerIdFor(user.id);
        const url = await createPortalLink(config, customerId, { fetchImpl: deps.fetch });
        return json(200, { url });
      } catch {
        return json(404, { error: 'No subscription to manage yet.' });
      }
    }

    return json(400, { error: 'Unknown billing action.' });
  };
}

/** Dodo → VOQDO. Unauthenticated by design; trust comes from the signature. */
export function createDodoWebhookHandler(deps) {
  return async (req) => {
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
    const secret = deps.env('DODO_PAYMENTS_WEBHOOK_KEY');
    if (!secret) return json(503, { error: 'Webhook secret is not configured.' });

    const body = await req.text();
    if (body.length > 256_000) return json(413, { error: 'Payload too large' });

    const id = req.headers.get('webhook-id');
    const verified = await verifyStandardWebhook({
      secret,
      id,
      timestamp: req.headers.get('webhook-timestamp'),
      signature: req.headers.get('webhook-signature'),
      body,
      now: deps.now?.() ?? Date.now(),
    });
    if (!verified) return json(401, { error: 'Invalid signature' });

    let event;
    try {
      event = JSON.parse(body);
    } catch {
      return json(400, { error: 'Invalid JSON' });
    }
    if (await deps.webhookSeen(id)) return json(200, { received: true, duplicate: true });

    const update = subscriptionFromWebhook(event);
    if (update) {
      const userId =
        update.userId ?? (update.subscriptionId ? await deps.subscriptionOwner(update.subscriptionId) : null);
      if (userId) {
        // Failures throw, so Dodo retries; the event is recorded only once applied.
        await deps.upsertSubscription({
          userId,
          status: update.status,
          subscriptionId: update.subscriptionId,
          customerId: update.customerId,
          paymentId: update.paymentId,
          currentPeriodEnd: update.currentPeriodEnd,
          eventAt: update.eventAt,
        });
      }
    }
    await deps.recordWebhook(id, String(event?.type || 'unknown'));
    return json(200, { received: true });
  };
}

/** POST — permanently deletes the caller's account and every row it owns. */
export function createDeleteAccountHandler(deps) {
  return async (req) => {
    const { response, user } = await preamble(req, deps);
    if (response) return response;
    try {
      await deps.deleteUser(user.id);
      return json(200, { deleted: true });
    } catch {
      return json(500, { error: 'Could not delete the account. Please try again.' });
    }
  };
}
