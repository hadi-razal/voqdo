const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Runs the Supabase migrations against PGlite (real Postgres in WASM) with a
 * minimal stand-in for Supabase's roles, auth schema and default grants, then
 * checks row-level security and the trial/subscription rules as each role.
 */

const MIGRATIONS = path.join(__dirname, '../supabase/migrations');

const SUPABASE_SHIM = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    is_anonymous boolean not null default false,
    created_at timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

let db;
let alice;
let bob;

async function as(role, userId, fn) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? '']);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}

const asUser = (userId, fn) => as('authenticated', userId, fn);
const superuser = async (sql, params) => {
  await db.exec('reset role');
  return db.query(sql, params);
};

function entryRow(id, overrides = {}) {
  return {
    id,
    created_at: new Date().toISOString(),
    client_updated_at: Date.now(),
    source: 'text',
    title: 'A quiet evening',
    body: 'Some honest words.',
    mood: 'Calm',
    ...overrides,
  };
}

async function insertEntry(row) {
  const keys = Object.keys(row);
  return db.query(
    `insert into public.entries (${keys.join(', ')}) values (${keys.map((_, i) => `$${i + 1}`).join(', ')})
     on conflict (user_id, id) do update set ${keys.map((key) => `${key} = excluded.${key}`).join(', ')}`,
    keys.map((key) => row[key])
  );
}

before(async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  db = new PGlite();
  await db.exec(SUPABASE_SHIM);
  for (const file of fs.readdirSync(MIGRATIONS).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(fs.readFileSync(path.join(MIGRATIONS, file), 'utf8'));
  }
  alice = (await superuser(`insert into auth.users (email, is_anonymous) values (null, true) returning id`)).rows[0].id;
  bob = (await superuser(`insert into auth.users (email) values ('bob@example.com') returning id`)).rows[0].id;
});

after(async () => {
  await db?.close();
});

test('a new account gets a profile with a three-day trial', async () => {
  const { rows } = await superuser(
    `select extract(epoch from (trial_ends_at - now())) / 3600 as hours from public.profiles where id = $1`,
    [alice]
  );
  assert.ok(rows[0].hours > 71.9 && rows[0].hours <= 72, `trial hours ${rows[0].hours}`);
});

test('trial users can write and read only their own entries', async () => {
  await asUser(alice, () => insertEntry(entryRow('a1')));
  await asUser(bob, () => insertEntry(entryRow('b1')));
  const mine = await asUser(alice, () => db.query('select id from public.entries'));
  assert.deepEqual(mine.rows.map((row) => row.id), ['a1']);
  await assert.rejects(
    asUser(alice, () => insertEntry({ ...entryRow('spoof'), user_id: bob })),
    /row-level security/
  );
});

test('clients cannot extend their own trial or grant themselves Pro', async () => {
  await asUser(alice, () => db.query(`update public.profiles set display_name = 'Hadi' where id = $1`, [alice]));
  await assert.rejects(
    asUser(alice, () => db.query(`update public.profiles set trial_ends_at = now() + interval '1 year'`)),
    /permission denied/
  );
  await assert.rejects(
    asUser(alice, () => db.query(`insert into public.subscriptions (user_id, status) values ($1, 'active')`, [alice])),
    /permission denied/
  );
  await assert.rejects(asUser(alice, () => db.query(`select public.access_for($1)`, [bob])), /permission denied/);
  await assert.rejects(
    asUser(alice, () => db.query(`select public.consume_ai_quota($1, 'analyze', 99, 99)`, [alice])),
    /permission denied/
  );
});

test('anonymous (signed-out) requests see nothing', async () => {
  await assert.rejects(as('anon', null, () => db.query('select * from public.entries')), /permission denied/);
  await assert.rejects(as('anon', null, () => db.query('select * from public.profiles')), /permission denied/);
});

test('get_access reports the trial', async () => {
  const { rows } = await asUser(alice, () => db.query('select * from public.get_access()'));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].pro, false);
  assert.equal(rows[0].has_access, true);
});

test('after the trial, writing is blocked but reading and deleting still work', async () => {
  await superuser(`update public.profiles set trial_ends_at = now() - interval '1 minute' where id = $1`, [alice]);
  await assert.rejects(asUser(alice, () => insertEntry(entryRow('a2'))), /row-level security/);
  await assert.rejects(
    asUser(alice, () => insertEntry(entryRow('a1', { title: 'Edited', client_updated_at: Date.now() + 1000 }))),
    /row-level security/
  );
  const read = await asUser(alice, () => db.query('select id from public.entries'));
  assert.equal(read.rows.length, 1);

  // A deletion is recorded as a scrubbed tombstone even without access.
  await asUser(alice, () =>
    insertEntry(entryRow('a1', { deleted_at: new Date().toISOString(), client_updated_at: Date.now() + 2000 }))
  );
  const tomb = await asUser(alice, () => db.query(`select title, body, deleted_at from public.entries where id = 'a1'`));
  assert.equal(tomb.rows[0].title, '');
  assert.equal(tomb.rows[0].body, '');
  assert.ok(tomb.rows[0].deleted_at);

  const access = await asUser(alice, () => db.query('select * from public.get_access()'));
  assert.equal(access.rows[0].has_access, false);
});

test('an active subscription restores access; a cancelled one lasts until period end', async () => {
  await superuser(
    `insert into public.subscriptions (user_id, status, dodo_subscription_id, current_period_end)
     values ($1, 'active', 'sub_alice', now() + interval '30 days')`,
    [alice]
  );
  await asUser(alice, () => insertEntry(entryRow('a3')));
  let access = (await asUser(alice, () => db.query('select * from public.get_access()'))).rows[0];
  assert.equal(access.pro, true);
  assert.equal(access.has_access, true);

  await superuser(`update public.subscriptions set status = 'cancelled' where user_id = $1`, [alice]);
  access = (await asUser(alice, () => db.query('select * from public.get_access()'))).rows[0];
  assert.equal(access.has_access, true);

  await superuser(
    `update public.subscriptions set current_period_end = now() - interval '1 hour' where user_id = $1`,
    [alice]
  );
  access = (await asUser(alice, () => db.query('select * from public.get_access()'))).rows[0];
  assert.equal(access.has_access, false);

  await superuser(`update public.subscriptions set status = 'on_hold', current_period_end = now() + interval '5 days' where user_id = $1`, [alice]);
  access = (await asUser(alice, () => db.query('select * from public.get_access()'))).rows[0];
  assert.equal(access.pro, false);
});

test('subscription updates apply in event order, and only via the service role', async () => {
  const upsert = (status, eventAt) =>
    as('service_role', null, () =>
      db.query(
        `select public.upsert_subscription($1, $2, 'sub_bob', 'cus_bob', null, now() + interval '30 days', $3) as applied`,
        [bob, status, eventAt]
      )
    );
  assert.equal((await upsert('active', '2026-09-26T10:00:00Z')).rows[0].applied, true);
  assert.equal((await upsert('cancelled', '2026-09-26T12:00:00Z')).rows[0].applied, true);
  // A delayed "renewed" from before the cancellation must not win.
  assert.equal((await upsert('active', '2026-09-26T11:00:00Z')).rows[0].applied, false);
  const { rows } = await superuser('select status from public.subscriptions where user_id = $1', [bob]);
  assert.equal(rows[0].status, 'cancelled');
  await assert.rejects(
    asUser(bob, () =>
      db.query(`select public.upsert_subscription($1, 'active', null, null, null, null, null)`, [bob])
    ),
    /permission denied/
  );
});

test('a stale write from another device never overwrites a newer one', async () => {
  const now = Date.now();
  await asUser(bob, () => insertEntry(entryRow('b2', { title: 'Newer', client_updated_at: now })));
  await asUser(bob, () => insertEntry(entryRow('b2', { title: 'Older', client_updated_at: now - 5000 })));
  const { rows } = await asUser(bob, () => db.query(`select title from public.entries where id = 'b2'`));
  assert.equal(rows[0].title, 'Newer');
});

test('AI quotas cap requests per minute and serve only the service role', async () => {
  const results = [];
  for (let i = 0; i < 3; i++) {
    const { rows } = await as('service_role', null, () =>
      db.query(`select public.consume_ai_quota($1, 'analyze', 2, 50) as ok`, [bob])
    );
    results.push(rows[0].ok);
  }
  assert.deepEqual(results, [true, true, false]);
  const other = await as('service_role', null, () =>
    db.query(`select public.consume_ai_quota($1, 'reflect', 2, 50) as ok`, [bob])
  );
  assert.equal(other.rows[0].ok, true);
});

test('deleting an account removes all of its data', async () => {
  await superuser('delete from auth.users where id = $1', [bob]);
  for (const table of ['profiles', 'entries', 'ai_usage', 'subscriptions']) {
    const column = table === 'profiles' ? 'id' : 'user_id';
    const { rows } = await superuser(`select count(*)::int as n from public.${table} where ${column} = $1`, [bob]);
    assert.equal(rows[0].n, 0, table);
  }
});
