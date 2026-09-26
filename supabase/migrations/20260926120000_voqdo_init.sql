-- VOQDO initial schema.
--
-- Access model: every account gets a 3-day free trial that starts when the
-- account is created. After that, a VOQDO Pro subscription (billed by Dodo
-- Payments and written only by Edge Functions) is required to create or edit
-- journal data or use AI. People can always read, export and delete what
-- they already wrote.
--
-- Sync model: the device is the source of truth and the cloud is a synced
-- copy. Each row carries the device's `client_updated_at` (last writer wins)
-- and a server `updated_at` used as the pull cursor. Deletions are kept as
-- tombstones with their content scrubbed so other devices learn about them.

-------------------------------------------------------------------------------
-- Profiles and the trial clock
-------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 40),
  weekly_goal smallint not null default 3 check (weekly_goal in (3, 5, 7)),
  trial_ends_at timestamptz not null default (now() + interval '3 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.trial_ends_at is
  'Set once when the account is created. Not writable by clients.';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Every new auth user (anonymous or not) gets a profile, which starts the trial.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Clients may only change their name and weekly goal — never the trial end.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, weekly_goal) on public.profiles to authenticated;

-------------------------------------------------------------------------------
-- Subscriptions (written by Edge Functions with the service role only)
-------------------------------------------------------------------------------

create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  provider text not null default 'dodo' check (provider in ('dodo')),
  status text not null check (
    status in ('pending', 'active', 'trialing', 'past_due', 'on_hold', 'cancelled', 'expired', 'failed')
  ),
  dodo_subscription_id text unique,
  dodo_customer_id text,
  dodo_payment_id text,
  current_period_end timestamptz,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

alter table public.subscriptions enable row level security;

create policy "subscriptions: read own"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

-- The only write path for subscriptions. Webhooks can arrive out of order,
-- so an update older than the last one applied is ignored.
create or replace function public.upsert_subscription(
  p_user uuid,
  p_status text,
  p_subscription_id text,
  p_customer_id text,
  p_payment_id text,
  p_period_end timestamptz,
  p_event_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  applied boolean;
begin
  insert into public.subscriptions as s (
    user_id, status, dodo_subscription_id, dodo_customer_id, dodo_payment_id, current_period_end, last_event_at
  )
  values (p_user, p_status, p_subscription_id, p_customer_id, p_payment_id, p_period_end, p_event_at)
  on conflict (user_id) do update set
    status = excluded.status,
    dodo_subscription_id = coalesce(excluded.dodo_subscription_id, s.dodo_subscription_id),
    dodo_customer_id = coalesce(excluded.dodo_customer_id, s.dodo_customer_id),
    dodo_payment_id = coalesce(excluded.dodo_payment_id, s.dodo_payment_id),
    current_period_end = coalesce(excluded.current_period_end, s.current_period_end),
    last_event_at = excluded.last_event_at
  where s.last_event_at is null or excluded.last_event_at is null or excluded.last_event_at >= s.last_event_at
  returning true into applied;
  return coalesce(applied, false);
end;
$$;

revoke execute on function public.upsert_subscription(uuid, text, text, text, text, timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.upsert_subscription(uuid, text, text, text, text, timestamptz, timestamptz)
  to service_role;

-------------------------------------------------------------------------------
-- Access checks
-------------------------------------------------------------------------------

-- Whether a subscription row currently grants Pro. A cancelled plan keeps
-- access until the end of the period that was paid for; one day of grace
-- covers renewals that land a little late.
create or replace function public.subscription_grants_access(
  p_status text,
  p_period_end timestamptz
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when p_status in ('active', 'trialing', 'past_due')
      then p_period_end is null or p_period_end > now() - interval '1 day'
    when p_status = 'cancelled'
      then p_period_end is not null and p_period_end > now()
    else false
  end;
$$;

-- Server-side check for any user. Edge Functions only.
create or replace function public.access_for(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = p_user
      and public.subscription_grants_access(s.status, s.current_period_end)
  ) or exists (
    select 1 from public.profiles p
    where p.id = p_user and p.trial_ends_at > now()
  );
$$;

-- The caller's own access. Used by row-level security policies.
create or replace function public.has_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.access_for((select auth.uid()));
$$;

-- Everything the app needs to decide what to show, in one call.
create or replace function public.get_access()
returns table (
  trial_ends_at timestamptz,
  pro boolean,
  has_access boolean,
  status text,
  current_period_end timestamptz,
  server_time timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.trial_ends_at,
    coalesce(public.subscription_grants_access(s.status, s.current_period_end), false),
    public.access_for(p.id),
    s.status,
    s.current_period_end,
    now()
  from public.profiles p
  left join public.subscriptions s on s.user_id = p.id
  where p.id = (select auth.uid());
$$;

revoke execute on function public.subscription_grants_access(text, timestamptz) from public, anon;
revoke execute on function public.access_for(uuid) from public, anon, authenticated;
revoke execute on function public.has_access() from public, anon;
revoke execute on function public.get_access() from public, anon;
grant execute on function public.subscription_grants_access(text, timestamptz) to authenticated, service_role;
grant execute on function public.access_for(uuid) to service_role;
grant execute on function public.has_access() to authenticated, service_role;
grant execute on function public.get_access() to authenticated;

-------------------------------------------------------------------------------
-- Journal entries
-------------------------------------------------------------------------------

create table public.entries (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 100),
  created_at timestamptz not null,
  client_updated_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  source text not null check (source in ('voice', 'text')),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  title text not null check (char_length(title) <= 200),
  body text not null check (char_length(body) <= 60000),
  categories text[] not null default '{}' check (cardinality(categories) <= 7),
  mood text not null check (mood in ('Calm', 'Bright', 'Heavy', 'Restless', 'Tender')),
  emotions text[] not null default '{}' check (cardinality(emotions) <= 10),
  affirmation text not null default '' check (char_length(affirmation) <= 600),
  analysis_model text check (char_length(analysis_model) <= 100),
  challenge_id text check (char_length(challenge_id) <= 40),
  challenge_step smallint check (challenge_step between 0 and 2),
  primary key (user_id, id)
);

create index entries_user_updated_idx on public.entries (user_id, updated_at);

-- Last writer wins, stamps the sync cursor, and scrubs deleted content.
create or replace function public.entries_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.client_updated_at < old.client_updated_at then
      return old; -- a stale write from another device; keep the newer row
    end if;
    new.user_id := old.user_id;
    new.id := old.id;
    new.created_at := old.created_at;
  end if;
  if new.deleted_at is not null then
    new.title := '';
    new.body := '';
    new.categories := '{}';
    new.emotions := '{}';
    new.affirmation := '';
    new.analysis_model := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger entries_before_write
  before insert or update on public.entries
  for each row execute function public.entries_before_write();

alter table public.entries enable row level security;

create policy "entries: read own"
  on public.entries for select to authenticated
  using ((select auth.uid()) = user_id);

-- Writing needs an active trial or Pro; recording a deletion never does.
create policy "entries: insert own"
  on public.entries for insert to authenticated
  with check ((select auth.uid()) = user_id and ((select public.has_access()) or deleted_at is not null));

create policy "entries: update own"
  on public.entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and ((select public.has_access()) or deleted_at is not null));

create policy "entries: delete own"
  on public.entries for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.entries from anon, authenticated;
grant select, insert, update, delete on public.entries to authenticated;

-------------------------------------------------------------------------------
-- Saved reflections
-------------------------------------------------------------------------------

create table public.reflections (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 100),
  created_at timestamptz not null,
  client_updated_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  mode text not null check (mode in ('recap', 'next-step', 'question')),
  model text not null check (char_length(model) <= 100),
  source_ids text[] not null default '{}' check (cardinality(source_ids) <= 5),
  summary text not null check (char_length(summary) <= 2000),
  observations jsonb not null default '[]' check (jsonb_typeof(observations) = 'array'),
  question text not null default '' check (char_length(question) <= 400),
  action text not null default '' check (char_length(action) <= 400),
  primary key (user_id, id)
);

create index reflections_user_updated_idx on public.reflections (user_id, updated_at);

create or replace function public.reflections_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.client_updated_at < old.client_updated_at then
      return old;
    end if;
    new.user_id := old.user_id;
    new.id := old.id;
    new.created_at := old.created_at;
  end if;
  if new.deleted_at is not null then
    new.summary := '';
    new.observations := '[]';
    new.question := '';
    new.action := '';
    new.source_ids := '{}';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger reflections_before_write
  before insert or update on public.reflections
  for each row execute function public.reflections_before_write();

alter table public.reflections enable row level security;

create policy "reflections: read own"
  on public.reflections for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "reflections: insert own"
  on public.reflections for insert to authenticated
  with check ((select auth.uid()) = user_id and ((select public.has_access()) or deleted_at is not null));

create policy "reflections: update own"
  on public.reflections for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and ((select public.has_access()) or deleted_at is not null));

create policy "reflections: delete own"
  on public.reflections for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.reflections from anon, authenticated;
grant select, insert, update, delete on public.reflections to authenticated;

-------------------------------------------------------------------------------
-- AI usage quotas (service role only)
-------------------------------------------------------------------------------

create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('analyze', 'reflect')),
  created_at timestamptz not null default now()
);

create index ai_usage_user_time_idx on public.ai_usage (user_id, kind, created_at desc);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Atomically checks per-minute and per-day limits and records one use.
create or replace function public.consume_ai_quota(
  p_user uuid,
  p_kind text,
  p_per_minute integer,
  p_per_day integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_minute integer;
  last_day integer;
begin
  -- Serialise per user so parallel requests cannot both pass the check.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));

  delete from public.ai_usage
    where user_id = p_user and created_at < now() - interval '2 days';

  select
    count(*) filter (where created_at > now() - interval '1 minute'),
    count(*)
  into last_minute, last_day
  from public.ai_usage
  where user_id = p_user and kind = p_kind and created_at > now() - interval '1 day';

  if last_minute >= p_per_minute or last_day >= p_per_day then
    return false;
  end if;

  insert into public.ai_usage (user_id, kind) values (p_user, p_kind);
  return true;
end;
$$;

revoke execute on function public.consume_ai_quota(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, text, integer, integer) to service_role;

-------------------------------------------------------------------------------
-- Webhook idempotency (service role only)
-------------------------------------------------------------------------------

create table public.webhook_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

alter table public.webhook_events enable row level security;
revoke all on public.webhook_events from anon, authenticated;

-- Internal trigger functions are never called directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.entries_before_write() from public, anon, authenticated;
revoke execute on function public.reflections_before_write() from public, anon, authenticated;
