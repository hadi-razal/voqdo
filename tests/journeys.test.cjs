const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const path = require('node:path');
function load(file) {
  const output = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInThisContext(`(function(exports, module) { ${code} })`)(output.exports, output);
  return output.exports;
}
const { challengeProgress } = load('challenges.ts');
const date = (day) => new Date(2026, 8, day, 12).getTime();
const item = (day, step, id = 'gratitude') => ({ createdAt: date(day), challengeStep: step, challengeId: id });
test('journey completes only in sequence on distinct days', () => {
  const sameDay = challengeProgress([item(10, 0), item(10, 1), item(10, 2)], 'gratitude', date(10));
  assert.equal(sameDay.completed, 1);
  assert.equal(sameDay.todayDone, true);
  const completed = challengeProgress([item(10, 0), item(11, 1), item(12, 2)], 'gratitude', date(12));
  assert.equal(completed.done, true);
});
test('breaks do not erase journey steps and future entries do not count', () => {
  const progress = challengeProgress([item(2, 0), item(10, 1), item(15, 2)], 'gratitude', date(12));
  assert.equal(progress.completed, 2);
  assert.equal(progress.todayDone, false);
});
test('unrelated entries, unknown journeys and out of order steps cannot unlock badges', () => {
  assert.equal(challengeProgress([item(10, 2), item(11, 0, 'care')], 'gratitude', date(12)).completed, 0);
  assert.equal(challengeProgress([], 'unknown', date(12)), null);
});
const { parseSavedReflections } = load('reflections.ts');
test('saved reflections preserve their sources and content across reload', () => {
  const saved = { id: 'r1', createdAt: date(12), mode: 'recap', model: 'google/gemma-3-4b-it', sourceIds: ['e1'], summary: 'Fictional flowers grew.', observations: [{ text: 'Flowers grew.', entryIds: ['e1'] }], question: 'What grew?', action: 'Notice a flower.' };
  assert.deepEqual(parseSavedReflections(JSON.stringify([saved])), [saved]);
  assert.throws(() => parseSavedReflections('{broken'));
});
