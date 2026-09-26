const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('dodo config reports missing keys as unconfigured', async () => {
  const prev = {
    DODO_PAYMENTS_API_KEY: process.env.DODO_PAYMENTS_API_KEY,
    DODO_PRODUCT_ID: process.env.DODO_PRODUCT_ID,
    DODO_PAYMENTS_MODE: process.env.DODO_PAYMENTS_MODE,
  };
  delete process.env.DODO_PAYMENTS_API_KEY;
  delete process.env.DODO_PRODUCT_ID;
  process.env.DODO_PAYMENTS_MODE = 'test';

  const mod = await import(pathToFileURL(path.join(__dirname, '../server/dodo.mjs')).href);
  const config = mod.dodoConfig();
  assert.equal(config.configured, false);
  assert.equal(config.base, 'https://test.dodopayments.com');

  Object.assign(process.env, Object.fromEntries(
    Object.entries(prev).map(([k, v]) => [k, v === undefined ? '' : v])
  ));
  for (const [k, v] of Object.entries(prev)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

test('verifyProEntitlement rejects missing ids', async () => {
  process.env.DODO_PAYMENTS_API_KEY = process.env.DODO_PAYMENTS_API_KEY || 'test_key';
  process.env.DODO_PRODUCT_ID = process.env.DODO_PRODUCT_ID || 'pdt_test';
  const mod = await import(pathToFileURL(path.join(__dirname, '../server/dodo.mjs')).href + `?t=${Date.now()}`);
  const result = await mod.verifyProEntitlement({ status: 'cancelled' });
  assert.equal(result.active, false);
});

test('pricing keeps the published monthly amount', () => {
  const code = fs.readFileSync(path.join(__dirname, '../src/lib/pricing.ts'), 'utf8');
  assert.match(code, /MONTHLY_PRICE_USD = 4\.99/);
  assert.match(code, /pdt_0NoQJf8X4upapEuXzNF3b/);
});
