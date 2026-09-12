const { test } = require('node:test');
const assert = require('node:assert/strict');
const api = import('../server/reflect.mjs');
const input = { entries: [{ id: 'robot-1', title: 'Fictional garden', body: 'A fictional robot planted yellow sunflowers.' }], question: 'What did the fictional robot plant?' };
const reflection = { summary: 'The fictional robot planted sunflowers.', observations: [{ text: 'Sunflowers were planted.', entryIds: ['robot-1'] }], question: 'What might grow next?', action: 'Notice one flower.' };
test('reflection inputs reject unsupported modes, too many entries and empty questions', async () => {
  const { parseReflectionInput } = await api;
  assert.throws(() => parseReflectionInput(JSON.stringify(input), 'anything'));
  assert.throws(() => parseReflectionInput(JSON.stringify({ ...input, question: '' }), 'question'));
  assert.throws(() => parseReflectionInput(JSON.stringify({ entries: Array(6).fill(input.entries[0]) }), 'recap'));
  assert.throws(() => parseReflectionInput(JSON.stringify({ entries: [input.entries[0], input.entries[0]] }), 'recap'));
});
test('invented source IDs are rejected', async () => {
  const { validateReflection } = await api;
  assert.throws(() => validateReflection({ ...reflection, observations: [{ text: 'Unsupported', entryIds: ['not-selected'] }] }, ['robot-1']));
  assert.deepEqual(validateReflection(reflection, ['robot-1']), reflection);
});
test('all three AI modes use only selected entries with bounded low-cost output', async () => {
  const { reflectWithOpenRouter } = await api;
  for (const mode of ['recap', 'next-step', 'question']) {
    let sent;
    const response = await reflectWithOpenRouter(JSON.stringify(input), { mode, apiKey: 'test-key', fetchImpl: async (_url, options) => {
      sent = JSON.parse(options.body);
      return { ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(reflection) } }] }) };
    } });
    assert.equal(sent.model, 'google/gemma-3-4b-it');
    assert.equal(sent.max_tokens, 650);
    assert.equal(sent.provider.max_price.completion, 0.10);
    assert.deepEqual(JSON.parse(sent.messages[1].content), input);
    assert.deepEqual(response.reflection, reflection);
  }
});
