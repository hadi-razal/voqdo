import { reflectWithOpenRouter, parseReflectionInput } from './reflect.mjs';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { analyzeWithOpenRouter, MODEL, MAX_CHARS } from './analysis.mjs';
import { createProCheckout, dodoConfig, verifyProEntitlement, parseDodoWebhook } from './dodo.mjs';

// Development service: intentionally loopback-only. Do not expose this API publicly
// without application authentication and per-device quotas.
export function createAnalysisServer({
  apiKey = process.env.OPENROUTER_API_KEY,
  analyze = analyzeWithOpenRouter,
  reflect = reflectWithOpenRouter,
  checkout = createProCheckout,
  verify = verifyProEntitlement,
} = {}) {
  let calls = [];
  let active = false;
  let checkoutCalls = [];
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    const reply = (status, data) => {
      res.writeHead(status);
      res.end(JSON.stringify(data));
    };
    const host = req.headers.host ?? '';
    const origin = req.headers.origin;
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return reply(403, { error: 'Forbidden host' });
    if (origin && !/^http:\/\/(localhost|127\.0\.0\.1):8081$/.test(origin)) {
      return reply(403, { error: 'Forbidden origin' });
    }
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return reply(204, {});
    }

    const url = new URL(req.url || '/', `http://${host}`);

    if (url.pathname === '/health' && req.method === 'GET') {
      const dodo = dodoConfig();
      return reply(200, {
        configured: !!apiKey,
        model: MODEL,
        payments: { configured: dodo.configured, mode: dodo.mode },
      });
    }

    if (url.pathname === '/checkout' && req.method === 'POST') {
      const dodo = dodoConfig();
      if (!dodo.configured) {
        return reply(503, {
          error: 'Payments are not configured. Set DODO_PAYMENTS_API_KEY and DODO_PRODUCT_ID.',
        });
      }
      try {
        const input = await readJson(req, 8_000);
        const now = Date.now();
        checkoutCalls = checkoutCalls.filter((time) => now - time < 60_000);
        if (checkoutCalls.length >= 20) {
          return reply(429, { error: 'Please wait before starting another checkout.' });
        }
        checkoutCalls.push(now);
        const session = await checkout({
          name: typeof input.name === 'string' ? input.name : undefined,
          email: typeof input.email === 'string' ? input.email : undefined,
          returnUrl: typeof input.returnUrl === 'string' ? input.returnUrl : undefined,
          customerId: typeof input.customerId === 'string' ? input.customerId : undefined,
        });
        return reply(200, session);
      } catch (error) {
        const status = Number(error?.status) >= 400 && Number(error?.status) < 600 ? error.status : 502;
        return reply(status, {
          error: error instanceof Error ? error.message : 'Could not start checkout.',
        });
      }
    }

    if (url.pathname === '/checkout/confirm' && req.method === 'POST') {
      const dodo = dodoConfig();
      if (!dodo.configured) {
        return reply(503, { error: 'Payments are not configured.' });
      }
      try {
        const input = await readJson(req, 4_000);
        const result = await verify({
          subscriptionId: typeof input.subscriptionId === 'string' ? input.subscriptionId : undefined,
          paymentId: typeof input.paymentId === 'string' ? input.paymentId : undefined,
          status: typeof input.status === 'string' ? input.status : undefined,
        });
        return reply(200, result);
      } catch (error) {
        const status = Number(error?.status) >= 400 && Number(error?.status) < 600 ? error.status : 502;
        return reply(status, {
          error: error instanceof Error ? error.message : 'Could not verify payment.',
        });
      }
    }

    if (url.pathname === '/webhooks/dodo' && req.method === 'POST') {
      try {
        const raw = await readRaw(req, 64_000);
        const parsed = await parseDodoWebhook(raw, req.headers);
        if (!parsed.ok) return reply(400, { error: parsed.error });
        const event = parsed.payload;
        const type = String(event?.type || '');
        // Local development only acknowledges; production applies events in the dodo-webhook Edge Function.
        if (
          type === 'subscription.active' ||
          type === 'subscription.renewed' ||
          type === 'payment.succeeded'
        ) {
          return reply(200, { received: true, type });
        }
        return reply(200, { received: true, type: type || 'ignored' });
      } catch {
        return reply(400, { error: 'Invalid webhook' });
      }
    }

    if (!['/analyze', '/reflect'].includes(url.pathname) || req.method !== 'POST') {
      return reply(404, { error: 'Not found' });
    }
    if (!apiKey) return reply(503, { error: 'AI is not configured. Local suggestions are still available.' });
    if (!req.headers['content-type']?.startsWith('application/json')) {
      return reply(415, { error: 'JSON required' });
    }
    try {
      const input = await readJson(req, 30_000);
      if (typeof input.body !== 'string' || !input.body.trim() || input.body.length > MAX_CHARS) {
        return reply(400, { error: `Use 1–${MAX_CHARS} characters for AI suggestions.` });
      }
      if (url.pathname === '/reflect') parseReflectionInput(input.body, input.mode);
      const now = Date.now();
      calls = calls.filter((time) => now - time < 60_000);
      if (active || calls.length >= 10) {
        return reply(429, { error: 'Please wait before requesting more suggestions.' });
      }
      calls.push(now);
      active = true;
      try {
        return reply(
          200,
          url.pathname === '/reflect'
            ? await reflect(input.body, { apiKey, mode: input.mode })
            : await analyze(input.body, { apiKey })
        );
      } catch {
        // Never log upstream payloads, journal text, or credentials.
        return reply(502, {
          error: 'AI is unavailable right now. Your current suggestions are unchanged.',
        });
      } finally {
        active = false;
      }
    } catch {
      return reply(400, { error: 'Invalid request' });
    }
  });
}

async function readRaw(req, maxBytes) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > maxBytes) {
      const error = new Error('Payload too large');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readJson(req, maxBytes) {
  const raw = await readRaw(req, maxBytes);
  return JSON.parse(raw || '{}');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createAnalysisServer().listen(8787, '127.0.0.1', () => {
    const dodo = dodoConfig();
    console.log(`VOQDO AI ready on http://127.0.0.1:8787 (${MODEL})`);
    console.log(
      dodo.configured
        ? `Dodo Payments ready (${dodo.mode} · product ${dodo.productId})`
        : 'Dodo Payments not configured'
    );
  });
}
