/**
 * Dodo Payments helpers for VOQDO Pro checkout.
 * The API key never leaves this process — clients only receive checkout URLs.
 */

const TEST_BASE = 'https://test.dodopayments.com';
const LIVE_BASE = 'https://live.dodopayments.com';

export function dodoConfig() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY || '';
  const productId = process.env.DODO_PRODUCT_ID || '';
  const mode = (process.env.DODO_PAYMENTS_MODE || 'test').toLowerCase();
  const base = mode === 'live' ? LIVE_BASE : TEST_BASE;
  return { apiKey, productId, mode, base, configured: Boolean(apiKey && productId) };
}

async function dodoFetch(path, { method = 'GET', body } = {}) {
  const { apiKey, base } = dodoConfig();
  if (!apiKey) throw new Error('Dodo Payments is not configured.');
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || 'Invalid response from Dodo Payments' };
  }
  if (!response.ok) {
    const message =
      (data && (data.message || data.error || data.detail)) ||
      `Dodo Payments request failed (${response.status})`;
    const error = new Error(typeof message === 'string' ? message : 'Dodo Payments request failed');
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

export async function createProCheckout({
  name,
  email,
  returnUrl,
  customerId,
} = {}) {
  const { productId, configured } = dodoConfig();
  if (!configured) throw new Error('Dodo Payments is not configured. Set DODO_PAYMENTS_API_KEY and DODO_PRODUCT_ID.');
  if (!returnUrl || typeof returnUrl !== 'string') throw new Error('A return URL is required.');

  const customer = {};
  if (typeof email === 'string' && email.includes('@')) customer.email = email.trim().slice(0, 120);
  if (typeof name === 'string' && name.trim() && name.trim() !== 'You') {
    customer.name = name.trim().slice(0, 80);
  }
  if (typeof customerId === 'string' && customerId.startsWith('cus_')) {
    customer.customer_id = customerId;
  }

  const session = await dodoFetch('/checkouts', {
    method: 'POST',
    body: {
      product_cart: [{ product_id: productId, quantity: 1 }],
      ...(Object.keys(customer).length ? { customer } : {}),
      return_url: returnUrl,
      metadata: {
        app: 'voqdo',
        plan: 'pro_monthly',
      },
    },
  });

  if (!session?.checkout_url || !session?.session_id) {
    throw new Error('Checkout session was incomplete.');
  }

  return {
    sessionId: session.session_id,
    checkoutUrl: session.checkout_url,
  };
}

/** Confirm Pro access from a Dodo return URL / webhook payload. */
export async function verifyProEntitlement({
  subscriptionId,
  paymentId,
  status,
} = {}) {
  if (status && !['succeeded', 'active', 'paid'].includes(String(status).toLowerCase())) {
    return { active: false, reason: 'Payment was not completed.' };
  }

  if (typeof subscriptionId === 'string' && subscriptionId.startsWith('sub_')) {
    const subscription = await dodoFetch(`/subscriptions/${subscriptionId}`);
    const state = String(subscription?.status || '').toLowerCase();
    const active = ['active', 'trialing', 'past_due'].includes(state);
    return {
      active,
      reason: active ? undefined : `Subscription is ${state || 'unknown'}.`,
      subscriptionId,
      customerId: subscription?.customer?.customer_id || subscription?.customer_id,
      status: state,
    };
  }

  if (typeof paymentId === 'string' && paymentId.startsWith('pay_')) {
    const payment = await dodoFetch(`/payments/${paymentId}`);
    const state = String(payment?.status || '').toLowerCase();
    const active = ['succeeded', 'paid'].includes(state);
    return {
      active,
      reason: active ? undefined : `Payment is ${state || 'unknown'}.`,
      paymentId,
      subscriptionId: payment?.subscription_id,
      customerId: payment?.customer?.customer_id || payment?.customer_id,
      status: state,
    };
  }

  return { active: false, reason: 'Missing payment or subscription id.' };
}

export function parseDodoWebhook(rawBody, headers) {
  // Signature verification requires DODO_PAYMENTS_WEBHOOK_KEY (Standard Webhooks).
  // Until a public HTTPS endpoint is deployed, local unlock uses /checkout/confirm.
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!secret) {
    return { ok: false, error: 'Webhook signing secret is not configured.' };
  }
  // Defer full Standard Webhooks verify to production deploy; still parse payload shape.
  try {
    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    return { ok: true, payload, headers };
  } catch {
    return { ok: false, error: 'Invalid webhook JSON.' };
  }
}
