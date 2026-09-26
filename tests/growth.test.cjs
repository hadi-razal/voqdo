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
const { stageFor, stageInfo, petEnergy, grewTo } = load('pet.ts');
const { habitProgress } = load('habits.ts');
const { dailyQuests, starsEarned } = load('quests.ts');
const date = (day, hour = 12) => new Date(2026, 8, day, hour).getTime();
const entry = (day, extra = {}) => ({ createdAt: date(day), body: 'a few honest words', source: 'text', categories: [], emotions: [], ...extra });

test('Sprout grows through five stages by journaling days', () => {
  assert.equal(stageFor(0), 'seed');
  assert.equal(stageFor(1), 'sprout');
  assert.equal(stageFor(5), 'bud');
  assert.equal(stageFor(14), 'bloom');
  assert.equal(stageFor(30), 'grove');
  assert.equal(stageFor(400), 'grove');
});

test('stage progress reports days to the next stage', () => {
  const info = stageInfo(3);
  assert.equal(info.stage.id, 'sprout');
  assert.equal(info.next.id, 'bud');
  assert.equal(info.daysToNext, 2);
  assert.ok(info.pct > 0 && info.pct < 1);
  assert.equal(stageInfo(30).next, null);
  assert.equal(stageInfo(30).pct, 1);
});

test('growth is detected only when a stage boundary is crossed', () => {
  assert.equal(grewTo(0, 1), 'sprout');
  assert.equal(grewTo(4, 5), 'bud');
  assert.equal(grewTo(5, 6), null);
  assert.equal(grewTo(3, 3), null);
});

test('Sprout gets sleepy when away but never worse than dozing', () => {
  assert.equal(petEnergy(0, true), 'thriving');
  assert.equal(petEnergy(1, false), 'happy');
  assert.equal(petEnergy(null, false), 'happy');
  assert.equal(petEnergy(3, false), 'sleepy');
  assert.equal(petEnergy(40, false), 'dozing');
});

test('a leaf shield is earned every seven days and bridges one missed day', () => {
  // Seven days in a row (1–7), skip day 8, journal day 9.
  const days = [1, 2, 3, 4, 5, 6, 7, 9].map((day) => ({ createdAt: date(day) }));
  const progress = habitProgress(days, date(9));
  assert.equal(progress.streak, 8);
  assert.equal(progress.bestStreak, 8);
  assert.equal(progress.shields, 0);
});

test('an unspent shield protects the current streak while today is still open', () => {
  const days = [1, 2, 3, 4, 5, 6, 7].map((day) => ({ createdAt: date(day) }));
  const protectedStreak = habitProgress(days, date(9));
  assert.equal(protectedStreak.streak, 7);
  assert.equal(protectedStreak.protectedDays, 1);
  assert.equal(protectedStreak.shields, 0);
  assert.equal(habitProgress(days, date(10)).streak, 0);
});

test('without shields a missed day still resets the streak', () => {
  const progress = habitProgress([1, 2, 4].map((day) => ({ createdAt: date(day) })), date(4));
  assert.equal(progress.streak, 1);
  assert.equal(progress.nextShieldIn, 4);
  assert.equal(progress.daysAway, 0);
  assert.equal(habitProgress([], date(4)).daysAway, null);
});

test('shields cap at two', () => {
  const days = Array.from({ length: 28 }, (_, i) => ({ createdAt: new Date(2026, 7, 1 + i, 12).getTime() }));
  assert.equal(habitProgress(days, days[27].createdAt).shields, 2);
});

test('daily quests always include a check-in plus two distinct rotating quests', () => {
  for (let day = 1; day <= 30; day++) {
    const quests = dailyQuests([], date(day));
    assert.equal(quests.length, 3);
    assert.equal(quests[0].id, 'checkin');
    assert.notEqual(quests[1].id, quests[2].id);
    assert.ok(quests.every((quest) => !quest.done));
  }
});

test('quests complete from saved entries of the same day only', () => {
  const quests = dailyQuests([entry(12), entry(11, { source: 'voice' })], date(12));
  assert.equal(quests[0].done, true);
  const yesterdayOnly = dailyQuests([entry(11)], date(12));
  assert.equal(yesterdayOnly[0].done, false);
});

test('a star is earned for each day with every quest complete', () => {
  const full = (day) => [
    entry(day, { source: 'voice', categories: ['Gratitude'], emotions: ['hopeful'], challengeId: 'gratitude', body: 'word '.repeat(90) }),
    entry(day, { source: 'voice', categories: ['Gratitude'], emotions: ['calm'] }),
  ];
  assert.equal(starsEarned([...full(10), ...full(11)], date(12)), 2);
  assert.equal(starsEarned([entry(10)], date(12)), 0);
});
