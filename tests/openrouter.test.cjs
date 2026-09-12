const assert = require('node:assert/strict');
const { test } = require('node:test');
const valid = { title: 'A fictional garden', categories: ['Reflection'], mood: 'Bright', emotions: ['Happy'], affirmation: 'A little care helped something grow.' };
const implementation = import('../server/analysis.mjs');

test('only the pinned tiny model and capped tokens/prices are sent upstream', async () => {
  const { analyzeWithOpenRouter, MODEL } = await implementation;
  let sent;
  const result = await analyzeWithOpenRouter('A synthetic journal entry.', {
    apiKey: 'test-key',
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
      assert.equal(options.headers.Authorization, 'Bearer test-key');
      sent = JSON.parse(options.body);
      return { ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(valid) } }] }) };
    },
  });
  assert.equal(sent.model, MODEL);
  assert.equal(sent.max_tokens, 250);
  assert.equal(sent.provider.max_price.prompt, 0.05);
  assert.equal(sent.provider.max_price.completion, 0.10);
  assert.equal(sent.messages.length, 2);
  assert.equal(sent.messages[1].content, 'A synthetic journal entry.');
  assert.deepEqual(result, { analysis: valid, model: MODEL });
  assert.equal(JSON.stringify(result).includes('test-key'), false);
});

test('oversized or blank input never calls OpenRouter', async () => {
  const { analyzeWithOpenRouter } = await implementation;
  let calls = 0;
  const options = { apiKey: 'test-key', fetchImpl: async () => { calls++; } };
  await assert.rejects(analyzeWithOpenRouter('x'.repeat(6001), options), /INVALID_INPUT/);
  await assert.rejects(analyzeWithOpenRouter('   ', options), /INVALID_INPUT/);
  assert.equal(calls, 0);
});

test('upstream errors do not retry or switch to a more expensive model', async () => {
  const { analyzeWithOpenRouter } = await implementation;
  let calls = 0;
  await assert.rejects(analyzeWithOpenRouter('An entry.', { apiKey: 'test-key', fetchImpl: async () => { calls++; return { ok: false, status: 429 }; } }), /UPSTREAM_429/);
  assert.equal(calls, 1);
});

test('invalid and truncated model output is rejected before reaching the draft', async () => {
  const { analyzeWithOpenRouter, validateAnalysis } = await implementation;
  assert.throws(() => validateAnalysis({ ...valid, mood: 'Invented mood' }));
  assert.throws(() => validateAnalysis({ ...valid, categories: ['Unknown'] }));
  assert.throws(() => validateAnalysis({ ...valid, emotions: [null] }));
  await assert.rejects(analyzeWithOpenRouter('An entry.', { apiKey: 'test-key', fetchImpl: async () => ({ ok: true, json: async () => ({ choices: [{ finish_reason: 'length', message: { content: JSON.stringify(valid) } }] }) }) }), /INCOMPLETE_RESPONSE/);
});

async function invoke(server, { host = '127.0.0.1:8787', origin, input = { body: 'Fictional robot test.' } } = {}) {
  return new Promise((resolve) => {
    const req = {
      method: 'POST', url: '/analyze', headers: { host, origin, 'content-type': 'application/json' },
      async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(input)); },
    };
    const res = { status: 200, setHeader() {}, writeHead(status) { this.status = status; }, end(body) { resolve({ status: this.status, data: JSON.parse(body) }); } };
    server.emit('request', req, res);
  });
}

test('local API rejects foreign origins and hosts before making a paid request', async () => {
  const { createAnalysisServer } = await import('../server/index.mjs');
  let calls = 0;
  const server = createAnalysisServer({ apiKey: 'test-key', analyze: async () => { calls++; return { analysis: valid }; } });
  assert.equal((await invoke(server, { origin: 'https://example.com' })).status, 403);
  assert.equal((await invoke(server, { host: 'example.com' })).status, 403);
  assert.equal((await invoke(server, { input: { body: '' } })).status, 400);
  assert.equal(calls, 0);
});

test('local API limits requests and does not disclose upstream errors', async () => {
  const { createAnalysisServer } = await import('../server/index.mjs');
  let calls = 0;
  const server = createAnalysisServer({ apiKey: 'test-key', analyze: async () => { calls++; throw new Error('secret-upstream-response'); } });
  for (let n = 0; n < 10; n++) {
    const response = await invoke(server);
    assert.equal(response.status, 502);
    assert.equal(JSON.stringify(response).includes('secret-upstream-response'), false);
  }
  assert.equal((await invoke(server)).status, 429);
  assert.equal(calls, 10);
});
