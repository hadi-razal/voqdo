/**
 * Dodo Payments helpers for VOQDO Pro, shared by the Supabase Edge Functions
 * and the local development server. Configuration is passed in rather than
 * read from a global, so the same code runs on Deno and Node.
 * The API key never leaves the server — clients only receive checkout URLs.
 */

const TEST_BASE = 'https://test.dodopayments.com';
const LIVE_BASE = 'https://live.dodopayments.com';

/** Statuses the database accepts; anything unknown is stored as pending. */
const STATUSES = ['pending', 'active', 'trialing', 'past_due', 'on_hold', 'cancelled', 'expired', 'failed'];

/** @param {(name: string) => string | undefined} env */
export function dodoConfig(env = () => undefined) {
  const apiKey = env('DODO_PAYMENTS_API_KEY') || '';
  const productId = env('DODO_PRODUCT_ID') || '';
  const mode = (env('DODO_PAYMENTS_MODE') || 'test').toLowerCase();
  const base = mode === 'live' ? LIVE_BASE : TEST_BASE;
  return { apiKey, productId, mode, base, configured: Boolean(apiKey && productId) };
}

export function normalizeStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status === 'canceled') return 'cancelled';
  if (status === 'succeeded' || status === 'paid') return 'active';
  return STATUSES.includes(status) ? status : 'pending';
}

async function dodoFetch(config, path, { method = 'GET', body, fetchImpl = fetch } = {}) {
  if (!config.apiKey) throw new Error('Dodo Payments is not configured.');
  const response = await fetchImpl(`${config.base}${path}`, {
    method,
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
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
    const message = (data && (data.message || data.error || data.detail)) || `Dodo Payments request failed (${response.status})`;
    const error = new Error(typeof message === 'string' ? message : 'Dodo Payments request failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function createProCheckout(config, { name, email, returnUrl, customerId, userId, fetchImpl } = {}) {
  if (!config.configured) throw new Error('Dodo Payments is not configured. Set DODO_PAYMENTS_API_KEY and DODO_PRODUCT_ID.');
  if (!returnUrl || typeof returnUrl !== 'string') throw new Error('A return URL is required.');

  const customer = {};
  if (typeof email === 'string' && email.includes('@')) customer.email = email.trim().slice(0, 120);
  if (typeof name === 'string' && name.trim() && name.trim() !== 'You') customer.name = name.trim().slice(0, 80);
  if (typeof customerId === 'string' && customerId.startsWith('cus_')) customer.customer_id = customerId;

  const session = await dodoFetch(config, '/checkouts', {
    method: 'POST',
    fetchImpl,
    body: {
      product_cart: [{ product_id: config.productId, quantity: 1 }],
      ...(Object.keys(customer).length ? { customer } : {}),
      return_url: returnUrl,
      // Carried onto the payment, subscription and webhooks so every event
      // can be tied back to the account that started checkout.
      metadata: { app: 'voqdo', plan: 'pro_monthly', ...(userId ? { user_id: userId } : {}) },
    },
  });

  if (!session?.checkout_url || !session?.session_id) throw new Error('Checkout session was incomplete.');
  return { sessionId: session.session_id, checkoutUrl: session.checkout_url };
}

const toIso = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

/** Confirm Pro access for a subscription or payment id, straight from Dodo. */
export async function verifyProEntitlement(config, { subscriptionId, paymentId, status, fetchImpl } = {}) {
  if (status && !['succeeded', 'active', 'paid'].includes(String(status).toLowerCase())) {
    return { active: false, reason: 'Payment was not completed.' };
  }

  if (typeof subscriptionId === 'string' && subscriptionId.startsWith('sub_')) {
    const subscription = await dodoFetch(config, `/subscriptions/${encodeURIComponent(subscriptionId)}`, { fetchImpl });
    const state = normalizeStatus(subscription?.status);
    const active = ['active', 'trialing', 'past_due'].includes(state);
    return {
      active,
      reason: active ? undefined : `Subscription is ${state}.`,
      status: state,
      subscriptionId,
      customerId: subscription?.customer?.customer_id || subscription?.customer_id || null,
      userId: subscription?.metadata?.user_id || null,
      currentPeriodEnd: toIso(subscription?.next_billing_date),
    };
  }

  if (typeof paymentId === 'string' && paymentId.startsWith('pay_')) {
    const payment = await dodoFetch(config, `/payments/${encodeURIComponent(paymentId)}`, { fetchImpl });
    const state = String(payment?.status || '').toLowerCase();
    const active = ['succeeded', 'paid'].includes(state);
    // A payment tied to a subscription is confirmed through the subscription.
    if (active && typeof payment?.subscription_id === 'string' && payment.subscription_id.startsWith('sub_')) {
      return verifyProEntitlement(config, { subscriptionId: payment.subscription_id, fetchImpl });
    }
    const paidAt = new Date(payment?.created_at || Date.now());
    return {
      active,
      reason: active ? undefined : `Payment is ${state || 'unknown'}.`,
      status: active ? 'active' : 'pending',
      paymentId,
      subscriptionId: null,
      customerId: payment?.customer?.customer_id || payment?.customer_id || null,
      userId: payment?.metadata?.user_id || null,
      currentPeriodEnd: active ? new Date(paidAt.getTime() + 31 * 86_400_000).toISOString() : null,
    };
  }

  return { active: false, reason: 'Missing payment or subscription id.' };
}

/** A short-lived link to Dodo's customer portal, where people cancel or update billing. */
export async function createPortalLink(config, customerId, { fetchImpl } = {}) {
  if (typeof customerId !== 'string' || !customerId.startsWith('cus_')) throw new Error('No billing account yet.');
  const session = await dodoFetch(config, `/customers/${encodeURIComponent(customerId)}/customer-portal/session`, {
    method: 'POST',
    fetchImpl,
  });
  if (typeof session?.link !== 'string') throw new Error('Could not open billing settings.');
  return session.link;
}

/**
 * Reads the subscription state carried by a verified webhook event.
 * Returns null for events that do not affect access.
 */
export function subscriptionFromWebhook(event) {
  const type = String(event?.type || '');
  const data = event?.data || {};
  if (!type.startsWith('subscription.') && type !== 'payment.succeeded') return null;

  const subscriptionId = typeof data.subscription_id === 'string' ? data.subscription_id : null;
  if (type === 'payment.succeeded' && !subscriptionId) return null;

  const byType = {
    'subscription.active': 'active',
    'subscription.renewed': 'active',
    'subscription.on_hold': 'on_hold',
    'subscription.cancelled': 'cancelled',
    'subscription.expired': 'expired',
    'subscription.failed': 'failed',
    'payment.succeeded': 'active',
  };
  const status = byType[type] ?? normalizeStatus(data.status);

  return {
    status,
    subscriptionId,
    customerId: data.customer?.customer_id || data.customer_id || null,
    paymentId: typeof data.payment_id === 'string' ? data.payment_id : null,
    userId: typeof data.metadata?.user_id === 'string' ? data.metadata.user_id : null,
    currentPeriodEnd: toIso(data.next_billing_date),
    eventAt: toIso(event?.timestamp) || new Date().toISOString(),
  };
}
