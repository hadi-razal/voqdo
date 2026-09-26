/**
 * Standard Webhooks signature verification (the scheme Dodo Payments uses),
 * implemented with Web Crypto so it runs on Deno and Node alike.
 *
 * Signed content is `${id}.${timestamp}.${body}`, HMAC-SHA256 with the
 * base64 secret after its `whsec_` prefix. The signature header can carry
 * several space-separated `v1,<base64>` values during key rotation.
 */

const TOLERANCE_SECONDS = 5 * 60;

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signStandardWebhook({ secret, id, timestamp, body }) {
  const raw = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  const key = await crypto.subtle.importKey('raw', base64ToBytes(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
  return bytesToBase64(new Uint8Array(mac));
}

export async function verifyStandardWebhook({ secret, id, timestamp, signature, body, now = Date.now() }) {
  if (!secret || !id || !timestamp || !signature || typeof body !== 'string') return false;
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(now / 1000 - seconds) > TOLERANCE_SECONDS) return false;
  let expected;
  try {
    expected = await signStandardWebhook({ secret, id, timestamp, body });
  } catch {
    return false; // malformed secret
  }
  return signature
    .split(' ')
    .map((part) => part.split(','))
    .some(([version, value]) => version === 'v1' && constantTimeEqual(value, expected));
}
