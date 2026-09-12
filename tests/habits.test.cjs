const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const path = require('node:path');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/habits.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const output = { exports: {} };
vm.runInThisContext(`(function(exports, module) { ${code} })`)(output.exports, output);
const { habitProgress, rewardMessage } = output.exports;
const date = (day) => new Date(2026, 8, day, 12).getTime();
const entry = (day) => ({ createdAt: date(day) });

test('one reward per local calendar day, regardless of entry count', () => {
  const entries = Array.from({ length: 100 }, () => entry(12));
  assert.equal(habitProgress(entries, date(12)).xp, 20);
  assert.equal(rewardMessage([entry(12)], entries, date(12)), null);
});
test('levels and milestones follow distinct saved days', () => {
  const progress = habitProgress([8, 9, 10, 11, 12].map(entry), date(12));
  assert.equal(progress.xp, 100);
  assert.equal(progress.level, 2);
  assert.equal(progress.levelXp, 0);
  assert.equal(progress.nextLevelXp, 100);
  assert.equal(progress.bestStreak, 5);
  assert.equal(progress.badges.filter((badge) => badge.earned).length, 3);
});
test('a missed day resets the current streak but keeps earned day progress', () => {
  const progress = habitProgress([8, 9, 10].map(entry), date(12));
  assert.equal(progress.streak, 0);
  assert.equal(progress.bestStreak, 3);
  assert.equal(progress.xp, 60);
  assert.equal(habitProgress([8, 9, 10].map(entry), date(11)).streak, 3);
});
test('weekly progress uses a Monday boundary and ignores future records', () => {
  const progress = habitProgress([6, 7, 8, 12, 13].map(entry), date(12), 5);
  assert.equal(progress.weeklyDays, 3);
  assert.equal(progress.weeklyGoal, 5);
  assert.equal(progress.weeklyComplete, false);
  assert.equal(progress.totalDays, 4);
});
test('empty journal starts at level one without earned badges', () => {
  const progress = habitProgress([], date(12));
  assert.equal(progress.level, 1);
  assert.equal(progress.todayDone, false);
  assert.equal(progress.badges.some((badge) => badge.earned), false);
});
test('first saved day celebrates once, while an edit gives no reward', () => {
  assert.match(rewardMessage([], [entry(12)], date(12)), /20 XP.*First page/);
  assert.equal(rewardMessage([entry(12)], [entry(12)], date(12)), null);
});
test('streaks survive the daylight-saving transition', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    const dates = [7, 8, 9].map((day) => ({ createdAt: new Date(2026, 2, day, 12).getTime() }));
    assert.equal(habitProgress(dates, dates[2].createdAt).bestStreak, 3);
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
