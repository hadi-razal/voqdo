import { Linking, Platform } from 'react-native';

const DEFAULT_BASE = __DEV__ ? 'http://127.0.0.1:8787' : '';

function apiBase() {
  return (process.env.EXPO_PUBLIC_ANALYSIS_URL || DEFAULT_BASE).replace(/\/$/, '');
}

export function paymentsConfiguredHint() {
  return Boolean(apiBase());
}

export function proReturnUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/pro/success`;
  }
  return 'voqdo://pro/success';
}

export async function startProCheckout({
  name,
  email,
  signal,
}: {
  name?: string;
  email?: string;
  signal?: AbortSignal;
}): Promise<{ sessionId: string; checkoutUrl: string }> {
  const base = apiBase();
  if (!base) {
    throw new Error('Payments are not configured for this build. Start the local VOQDO server.');
  }

  const response = await fetch(`${base}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      returnUrl: proReturnUrl(),
    }),
    signal,
  }).catch(() => {
    throw new Error(
      'Could not reach the VOQDO server. Run `npm run dev` (or `npm run ai:server`) so payments are available on port 8787.'
    );
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not start checkout.');
  }
  if (typeof data.checkoutUrl !== 'string' || typeof data.sessionId !== 'string') {
    throw new Error('Checkout session was incomplete.');
  }
  return { sessionId: data.sessionId, checkoutUrl: data.checkoutUrl };
}

export async function openCheckoutUrl(checkoutUrl: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.assign(checkoutUrl);
    return;
  }
  const supported = await Linking.canOpenURL(checkoutUrl);
  if (!supported) throw new Error('Cannot open the payment page on this device.');
  await Linking.openURL(checkoutUrl);
}

export type ProConfirmResult = {
  active: boolean;
  reason?: string;
  subscriptionId?: string;
  paymentId?: string;
  customerId?: string;
  status?: string;
};

export async function confirmProCheckout({
  subscriptionId,
  paymentId,
  status,
  signal,
}: {
  subscriptionId?: string;
  paymentId?: string;
  status?: string;
  signal?: AbortSignal;
}): Promise<ProConfirmResult> {
  const base = apiBase();
  if (!base) throw new Error('Payments are not configured for this build.');

  const response = await fetch(`${base}/checkout/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscriptionId, paymentId, status }),
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not verify payment.');
  }
  return {
    active: Boolean(data.active),
    reason: typeof data.reason === 'string' ? data.reason : undefined,
    subscriptionId: typeof data.subscriptionId === 'string' ? data.subscriptionId : undefined,
    paymentId: typeof data.paymentId === 'string' ? data.paymentId : undefined,
    customerId: typeof data.customerId === 'string' ? data.customerId : undefined,
    status: typeof data.status === 'string' ? data.status : undefined,
  };
}

/** Read Dodo return query params from a web URL or deep-link. */
export function parseCheckoutReturn(params: Record<string, string | string[] | undefined>) {
  const pick = (key: string) => {
    const value = params[key];
    return typeof value === 'string' ? value : Array.isArray(value) ? value[0] : undefined;
  };
  return {
    status: pick('status'),
    paymentId: pick('payment_id') || pick('paymentId'),
    subscriptionId: pick('subscription_id') || pick('subscriptionId'),
    email: pick('email'),
  };
}
