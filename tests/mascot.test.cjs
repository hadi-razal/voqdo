const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const path = require('node:path');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/mascot.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const output = { exports: {} };
vm.runInThisContext(`(function(exports, module) { ${code} })`)(output.exports, output);
const { companionMoment, mascotForMood, companionForMood, companionForWrite, companionForProgress, companionForChallenge, companionForRecord } = output.exports;

test('moods map to matching mascot poses', () => {
  assert.equal(mascotForMood('Calm'), 'listen');
  assert.equal(mascotForMood('Bright'), 'cheer');
  assert.equal(mascotForMood('Heavy'), 'weep');
  assert.equal(mascotForMood('Restless'), 'storm');
  assert.equal(mascotForMood('Tender'), 'heart');
});

test('an empty journal gets a peeking companion', () => {
  const moment = companionMoment({ wroteToday: false, streak: 0, weeklyComplete: false, empty: true });
  assert.equal(moment.pose, 'peek');
  assert.ok(moment.taps.length > 0);
});

test('finishing the week celebrates', () => {
  const moment = companionMoment({
    wroteToday: true,
    streak: 4,
    weeklyComplete: true,
    empty: false,
  });
  assert.equal(moment.pose, 'party');
});

test('morning without a page offers cocoa', () => {
  const moment = companionMoment({
    hour: 8,
    wroteToday: false,
    streak: 0,
    weeklyComplete: false,
    empty: false,
  });
  assert.equal(moment.pose, 'cocoa');
});

test('mood companions sit with the chosen feeling', () => {
  assert.equal(companionForMood('Heavy').pose, 'weep');
  assert.equal(companionForMood('Tender').pose, 'shy');
  assert.ok(companionForMood('Calm').taps.length > 0);
});

test('write companion cheers once a page is ready', () => {
  assert.equal(companionForWrite({ words: 0 }).pose, 'journal');
  assert.equal(companionForWrite({ words: 2 }).pose, 'think');
  assert.equal(companionForWrite({ words: 8 }).pose, 'cheer');
  assert.equal(companionForWrite({ words: 0, isJourney: true }).pose, 'grow');
});

test('progress companion grows the garden', () => {
  assert.equal(companionForProgress({ todayDone: false, weeklyComplete: false, streak: 0, totalDays: 0 }).pose, 'grow');
  assert.equal(companionForProgress({ todayDone: true, weeklyComplete: false, streak: 1, totalDays: 2 }).pose, 'bloom');
  assert.equal(companionForProgress({ todayDone: true, weeklyComplete: true, streak: 7, totalDays: 7 }).pose, 'party');
});

test('challenge companion follows the path', () => {
  assert.equal(companionForChallenge({ completedBest: 0, anyDone: false }).pose, 'wonder');
  assert.equal(companionForChallenge({ completedBest: 2, anyDone: false }).pose, 'grow');
  assert.equal(companionForChallenge({ completedBest: 3, anyDone: true }).pose, 'party');
});

test('record companion listens, then thinks', () => {
  assert.equal(companionForRecord({}).pose, 'listen');
  assert.equal(companionForRecord({ processing: true }).pose, 'think');
  assert.equal(companionForRecord({ error: true }).pose, 'rest');
});

test('returning after days away gets a sleepy welcome back, not guilt', () => {
  const away = companionMoment({ hour: 14, wroteToday: false, streak: 0, weeklyComplete: false, empty: false, daysAway: 3 });
  assert.equal(away.pose, 'nap');
  assert.match(away.line, /missed you/);
  assert.equal(companionMoment({ hour: 14, wroteToday: false, streak: 0, weeklyComplete: false, empty: false, daysAway: 9 }).pose, 'sleep');
  assert.equal(companionMoment({ hour: 14, wroteToday: true, streak: 1, weeklyComplete: false, empty: false, daysAway: 0 }).pose, 'heart');
});
