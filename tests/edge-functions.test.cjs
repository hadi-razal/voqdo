const { test } = require('node:test');
const assert = require('node:assert/strict');

const handlers = import('../supabase/functions/_shared/handlers.mjs');
const webhooks = import('../supabase/functions/_shared/webhooks.mjs');

const SECRET = `whsec_${Buffer.from('voqdo-test-secret-0123456789').toString('base64')}`;
const ALICE = { id: '00000000-0000-0000-0000-00000000a11c', email: null, isAnonymous: true };

/** In-memory stand-ins for Supabase, recording every call. */
function fakeDeps(overrides = {}) {
  const calls = { quota: [], upserts: [], recorded: [], deleted: [], analyze: 0 };
  const deps = {
    env: (name) =>
      ({
        OPENROUTER_API_KEY: 'or_test',
        DODO_PAYMENTS_API_KEY: 'dodo_test',
        DODO_PRODUCT_ID: 'pdt_test',
        DODO_PAYMENTS_MODE: 'test',
        DODO_PAYMENTS_WEBHOOK_KEY: SECRET,
      })[name],
    authenticate: async () => ALICE,
    hasAccess: async () => true,
    consumeQuota: async (...args) => {
      calls.quota.push(args);
      return true;
    },
    upsertSubscription: async (row) => {
      calls.upserts.push(row);
      return true;
    },
    subscriptionOwner: async () => null,
    customerIdFor: async () => null,
    webhookSeen: async () => false,
    recordWebhook: async (id, type) => {
      calls.recorded.push([id, type]);
    },
    deleteUser: async (id) => {
      calls.deleted.push(id);
    },
    analyze: async () => {
      calls.analyze++;
      return { analysis: { title: 'T' }, model: 'm' };
    },
    ...overrides,
  };
  return { deps, calls };
}

const post = (body, headers = {}) =>
  new Request('https://example.supabase.co/functions/v1/x', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

async function signed(body, { secret = SECRET, id = 'msg_1', timestamp = Math.floor(Date.now() / 1000) } = {}) {
  const { signStandardWebhook } = await webhooks;
  const signature = await signStandardWebhook({ secret, id, timestamp: String(timestamp), body });
  return post(body, { 'webhook-id': id, 'webhook-timestamp': String(timestamp), 'webhook-signature': `v1,${signature}` });
}

test('webhook signatures reject tampering, stale timestamps and wrong secrets', async () => {
  const { signStandardWebhook, verifyStandardWebhook } = await webhooks;
  const now = Date.now();
  const timestamp = String(Math.floor(now / 1000));
  const body = '{"type":"subscription.active"}';
  const signature = `v1,${await signStandardWebhook({ secret: SECRET, id: 'msg', timestamp, body })}`;
  const check = (overrides) => verifyStandardWebhook({ secret: SECRET, id: 'msg', timestamp, signature, body, now, ...overrides });

  assert.equal(await check({}), true);
  assert.equal(await check({ body: '{"type":"subscription.expired"}' }), false);
  assert.equal(await check({ now: now + 10 * 60_000 }), false);
  assert.equal(await check({ secret: `whsec_${Buffer.from('another').toString('base64')}` }), false);
  assert.equal(await check({ signature: `v1,bogus ${signature}` }), true, 'key rotation: any listed signature may match');
  assert.equal(await check({ signature: undefined }), false);
});

test('AI requires a signed-in caller', async () => {
  const { createAiHandler } = await handlers;
  const { deps, calls } = fakeDeps({ authenticate: async () => null });
  const response = await createAiHandler(deps)(post({ task: 'analyze', body: 'hello there' }));
  assert.equal(response.status, 401);
  assert.equal(calls.analyze, 0);
});

test('AI is refused after the trial, before any quota is spent or model called', async () => {
  const { createAiHandler } = await handlers;
  const { deps, calls } = fakeDeps({ hasAccess: async () => false });
  const response = await createAiHandler(deps)(post({ task: 'analyze', body: 'hello there' }));
  assert.equal(response.status, 402);
  assert.equal((await response.json()).code, 'NO_ACCESS');
  assert.equal(calls.quota.length, 0);
  assert.equal(calls.analyze, 0);
});

test('AI enforces per-user quotas', async () => {
  const { createAiHandler, AI_LIMITS } = await handlers;
  const { deps, calls } = fakeDeps({ consumeQuota: async (...args) => (calls.quota.push(args), false) });
  const response = await createAiHandler(deps)(post({ task: 'analyze', body: 'hello there' }));
  assert.equal(response.status, 429);
  assert.deepEqual(calls.quota[0], [ALICE.id, 'analyze', AI_LIMITS.analyze.perMinute, AI_LIMITS.analyze.perDay]);
  assert.equal(calls.analyze, 0);
});

test('AI validates input and serves valid requests', async () => {
  const { createAiHandler } = await handlers;
  const { deps, calls } = fakeDeps();
  const handle = createAiHandler(deps);
  assert.equal((await handle(post({ task: 'summon', body: 'x' }))).status, 400);
  assert.equal((await handle(post({ task: 'analyze', body: 'x'.repeat(6001) }))).status, 400);
  assert.equal((await handle(post({ task: 'reflect', body: '{}', mode: 'recap' }))).status, 400);
  assert.equal((await handle(post('not json'))).status, 400);
  const ok = await handle(post({ task: 'analyze', body: 'A good day.' }));
  assert.equal(ok.status, 200);
  assert.equal(calls.analyze, 1);
  const preflight = await handle(new Request('https://x.test', { method: 'OPTIONS' }));
  assert.equal(preflight.status, 204);
});

test('checkout tags the session with the caller and only returns to trusted addresses', async () => {
  const { createBillingHandler, isAllowedReturnUrl } = await handlers;
  let sent;
  const { deps } = fakeDeps({
    fetch: async (url, init) => {
      sent = { url, body: JSON.parse(init.body) };
      return new Response(JSON.stringify({ session_id: 'cks_1', checkout_url: 'https://checkout.dodo/abc' }));
    },
  });
  const response = await createBillingHandler(deps)(post({ action: 'checkout', returnUrl: 'voqdo://pro/success' }));
  assert.equal(response.status, 200);
  assert.equal(sent.url, 'https://test.dodopayments.com/checkouts');
  assert.equal(sent.body.metadata.user_id, ALICE.id);

  assert.equal((await createBillingHandler(deps)(post({ action: 'checkout', returnUrl: 'https://evil.example/x' }))).status, 400);
  assert.equal(isAllowedReturnUrl('http://localhost:8081/pro/success', { mode: 'live' }), false);
  assert.equal(isAllowedReturnUrl('https://app.voqdo.com/pro/success', { mode: 'live', webOrigins: 'https://app.voqdo.com' }), true);
});

function dodoSubscription(metadata) {
  return async () =>
    new Response(
      JSON.stringify({
        subscription_id: 'sub_1',
        status: 'active',
        customer: { customer_id: 'cus_1' },
        metadata,
        next_billing_date: '2026-10-26T00:00:00Z',
      })
    );
}

test('a purchase unlocks only the account that made it', async () => {
  const { createBillingHandler } = await handlers;
  const stolen = fakeDeps({ fetch: dodoSubscription({ user_id: 'someone-else' }) });
  const denied = await createBillingHandler(stolen.deps)(post({ action: 'confirm', subscriptionId: 'sub_1' }));
  assert.equal(denied.status, 403);
  assert.equal(stolen.calls.upserts.length, 0);

  const claimed = fakeDeps({ fetch: dodoSubscription({}), subscriptionOwner: async () => 'someone-else' });
  assert.equal((await createBillingHandler(claimed.deps)(post({ action: 'confirm', subscriptionId: 'sub_1' }))).status, 403);
  assert.equal(claimed.calls.upserts.length, 0);

  const mine = fakeDeps({ fetch: dodoSubscription({ user_id: ALICE.id }) });
  const ok = await createBillingHandler(mine.deps)(post({ action: 'confirm', subscriptionId: 'sub_1' }));
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).active, true);
  assert.equal(mine.calls.upserts[0].userId, ALICE.id);
  assert.equal(mine.calls.upserts[0].status, 'active');
  assert.equal(mine.calls.upserts[0].currentPeriodEnd, '2026-10-26T00:00:00.000Z');
});

test('webhooks apply only when correctly signed, once per event', async () => {
  const { createDodoWebhookHandler } = await handlers;
  const event = JSON.stringify({
    type: 'subscription.cancelled',
    timestamp: '2026-09-26T12:00:00Z',
    data: { subscription_id: 'sub_1', customer: { customer_id: 'cus_1' }, metadata: { user_id: ALICE.id }, next_billing_date: '2026-10-26T00:00:00Z' },
  });

  const forged = fakeDeps();
  const bad = await createDodoWebhookHandler(forged.deps)(
    post(event, { 'webhook-id': 'm', 'webhook-timestamp': String(Math.floor(Date.now() / 1000)), 'webhook-signature': 'v1,AAAA' })
  );
  assert.equal(bad.status, 401);
  assert.equal(forged.calls.upserts.length, 0);

  const real = fakeDeps();
  const ok = await createDodoWebhookHandler(real.deps)(await signed(event));
  assert.equal(ok.status, 200);
  assert.equal(real.calls.upserts[0].status, 'cancelled');
  assert.equal(real.calls.upserts[0].userId, ALICE.id);
  assert.deepEqual(real.calls.recorded[0], ['msg_1', 'subscription.cancelled']);

  const repeat = fakeDeps({ webhookSeen: async () => true });
  await createDodoWebhookHandler(repeat.deps)(await signed(event));
  assert.equal(repeat.calls.upserts.length, 0);
});

test('a webhook that fails to apply is not marked as handled, so Dodo retries it', async () => {
  const { createDodoWebhookHandler } = await handlers;
  const event = JSON.stringify({ type: 'subscription.renewed', data: { subscription_id: 'sub_1', metadata: { user_id: ALICE.id } } });
  const { deps, calls } = fakeDeps({
    upsertSubscription: async () => {
      throw new Error('database unavailable');
    },
  });
  await assert.rejects(createDodoWebhookHandler(deps)(await signed(event)));
  assert.equal(calls.recorded.length, 0);
});

test('account deletion removes the caller, and only the caller', async () => {
  const { createDeleteAccountHandler } = await handlers;
  const { deps, calls } = fakeDeps();
  const response = await createDeleteAccountHandler(deps)(post({}));
  assert.equal(response.status, 200);
  assert.deepEqual(calls.deleted, [ALICE.id]);
});
