const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const path = require('node:path');

function load(file) {
  const output = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInThisContext(`(function(exports, module) { ${code} })`)(output.exports, output);
  return output.exports;
}

const { accessState, parseAccessRow, parseCachedAccess, subscriptionGrantsAccess } = load('access.ts');
const { mergeRemote, pruneTombstones, parseTombstones } = load('syncMerge.ts');

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 26, 12);
const snapshot = (overrides) => ({ trialEndsAt: NOW + DAY, status: null, periodEnd: null, serverOffsetMs: 0, fetchedAt: NOW, ...overrides });

test('before the server answers, nobody is locked out', () => {
  const state = accessState(null, NOW);
  assert.equal(state.known, false);
  assert.equal(state.hasAccess, true);
});

test('the trial counts down in whole days and then ends', () => {
  assert.equal(accessState(snapshot({ trialEndsAt: NOW + 2.2 * DAY }), NOW).daysLeft, 3);
  assert.equal(accessState(snapshot({ trialEndsAt: NOW + 60_000 }), NOW).daysLeft, 1);
  const ended = accessState(snapshot({ trialEndsAt: NOW - 1 }), NOW);
  assert.equal(ended.hasAccess, false);
  assert.equal(ended.daysLeft, 0);
});

test('a wrong phone clock cannot extend the trial', () => {
  // The server said it was NOW when the device clock read NOW - 10 days.
  const row = { trial_ends_at: new Date(NOW - DAY).toISOString(), server_time: new Date(NOW).toISOString() };
  const parsed = parseAccessRow(row, NOW - 10 * DAY);
  assert.equal(accessState(parsed, NOW - 10 * DAY).hasAccess, false);
});

test('subscription rules match the database', () => {
  assert.equal(subscriptionGrantsAccess('active', null, NOW), true);
  assert.equal(subscriptionGrantsAccess('active', NOW - 2 * DAY, NOW), false);
  assert.equal(subscriptionGrantsAccess('past_due', NOW - DAY / 2, NOW), true, 'one day of renewal grace');
  assert.equal(subscriptionGrantsAccess('cancelled', NOW + DAY, NOW), true, 'paid-for period is honoured');
  assert.equal(subscriptionGrantsAccess('cancelled', NOW - 1, NOW), false);
  assert.equal(subscriptionGrantsAccess('on_hold', NOW + DAY, NOW), false);
  const pro = accessState(snapshot({ trialEndsAt: NOW - DAY, status: 'active', periodEnd: NOW + 20 * DAY }), NOW);
  assert.equal(pro.pro, true);
  assert.equal(pro.hasAccess, true);
});

test('cached access survives a restart and rejects garbage', () => {
  const saved = snapshot({ status: 'active' });
  assert.deepEqual(parseCachedAccess(JSON.stringify(saved)), saved);
  assert.equal(parseCachedAccess('{broken'), null);
  assert.equal(parseCachedAccess('{"trialEndsAt":"soon"}'), null);
});

const entry = (id, createdAt, updatedAt, title = id) => ({ id, createdAt, updatedAt, title });

test('remote changes merge by last writer, newest first', () => {
  const local = [entry('a', 1, 10, 'local a'), entry('b', 2, 20, 'local b')];
  const remote = [entry('a', 1, 15, 'remote a'), entry('b', 2, 5, 'stale b'), entry('c', 3, 3, 'new c')];
  const { items, changed } = mergeRemote(local, remote, [], {});
  assert.equal(changed, true);
  assert.deepEqual(items.map((item) => item.title), ['new c', 'local b', 'remote a']);
});

test('local deletions beat older remote copies; remote deletions beat older local copies', () => {
  const local = [entry('a', 1, 10), entry('b', 2, 50)];
  const { items } = mergeRemote(local, [entry('z', 9, 9)], [{ id: 'a', at: 20 }, { id: 'b', at: 30 }], { z: 12 });
  assert.deepEqual(items.map((item) => item.id), ['b'], 'b was edited after the remote delete; z was deleted locally');
});

test('merging keeps device-only fields and is a no-op when nothing is newer', () => {
  const local = [{ ...entry('a', 1, 10), audioUri: 'file://a.m4a' }];
  const combine = (mine, theirs) => ({ ...theirs, audioUri: mine.audioUri });
  const merged = mergeRemote(local, [entry('a', 1, 11, 'edited')], [], {}, combine);
  assert.equal(merged.items[0].audioUri, 'file://a.m4a');
  const same = mergeRemote(local, [entry('a', 1, 10)], [], {});
  assert.equal(same.changed, false);
  assert.equal(same.items, local);
});

test('tombstones are pruned once pushed and parsed defensively', () => {
  const pruned = pruneTombstones({ entries: { a: 5, b: 50 }, reflections: { r: 1 } }, 10);
  assert.deepEqual(pruned, { entries: { b: 50 }, reflections: {} });
  assert.deepEqual(parseTombstones('{"entries":{"a":1,"b":"x"}}'), { entries: { a: 1 }, reflections: {} });
  assert.deepEqual(parseTombstones('nope'), { entries: {}, reflections: {} });
});
