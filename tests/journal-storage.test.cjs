const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

// Run the actual storage migration code without loading a native UI runtime.
const cache = new Map();
function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (name) => {
    if (name === 'react-native') return { Platform: { OS: 'ios', select: (options) => options.ios ?? options.default } };
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
    return require(name);
  };
  vm.runInThisContext(`(function(require, module, exports) {${code}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}
const { parseEntries, parseSettings } = load('src/lib/journalStorage.ts');
const original = {
  id: 'existing-entry', createdAt: 1789189200000, source: 'voice', durationMs: 0,
  title: 'My title', body: 'I enjoyed a peaceful walk today.', categories: [],
  mood: 'Tender', emotions: ['Hopeful'], affirmation: 'My own reflection.',
};

test('removed tags, corrected mood and voice source survive reload', () => {
  const [entry] = parseEntries(JSON.stringify([original]));
  assert.deepEqual(entry, { ...original, audioUri: undefined });
});
test('malformed storage fails closed instead of becoming an empty journal', () => {
  assert.throws(() => parseEntries('{broken'));
  assert.throws(() => parseEntries('{"entries":[]}'));
  assert.deepEqual(parseEntries(null), []);
});
test('legacy transcripts are recovered with safe derived metadata', () => {
  const [entry] = parseEntries(JSON.stringify([{ id: 'legacy', transcript: 'I am grateful for my family.' }]));
  assert.equal(entry.body, 'I am grateful for my family.');
  assert.ok(entry.title.length > 0);
  assert.ok(entry.categories.includes('Gratitude'));
});
test('invalid metadata is repaired without losing journal text', () => {
  const [entry] = parseEntries(JSON.stringify([{ ...original, categories: ['obsolete'], mood: 'unknown', emotions: [42, 'Hopeful'], durationMs: -12 }]));
  assert.equal(entry.body, original.body);
  assert.equal(entry.durationMs, 0);
  assert.deepEqual(entry.emotions, ['Hopeful']);
  assert.ok(!entry.categories.includes('obsolete'));
  assert.notEqual(entry.mood, 'unknown');
});
test('invalid stored settings cannot crash the profile or bypass onboarding', () => {
  const settings = parseSettings('{"name":42,"onboarded":"yes","pro":{},"reminderTime":false}');
  assert.equal(settings.name, 'You');
  assert.equal(settings.onboarded, false);
  assert.equal(settings.pro, false);
  assert.equal(settings.reminderTime, '9:00 PM');
});
test('valid preferences survive migration and names are trimmed', () => {
  assert.equal(parseSettings('{"name":"  Sam  ","onboarded":true}').name, 'Sam');
  assert.equal(parseSettings('{"onboarded":true}').onboarded, true);
});
