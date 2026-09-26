/**
 * Trial and subscription rules, mirrored from the database's
 * `subscription_grants_access` so the app can tell when access lapses even
 * while offline. The server stays the authority: it re-checks every write
 * and every AI request.
 */

export const TRIAL_DAYS = 3;
const DAY = 86_400_000;

export type AccessSnapshot = {
  trialEndsAt: number;
  status: string | null;
  periodEnd: number | null;
  /** Server clock minus device clock, so a wrong phone clock cannot extend a trial. */
  serverOffsetMs: number;
  fetchedAt: number;
};

export function subscriptionGrantsAccess(status: string | null, periodEnd: number | null, now: number): boolean {
  if (status === 'active' || status === 'trialing' || status === 'past_due') {
    return periodEnd === null || periodEnd > now - DAY;
  }
  if (status === 'cancelled') return periodEnd !== null && periodEnd > now;
  return false;
}

export function accessState(snapshot: AccessSnapshot | null, deviceNow = Date.now()) {
  if (!snapshot) return { known: false, hasAccess: true, pro: false, trialActive: false, daysLeft: TRIAL_DAYS, trialEndsAt: null };
  const now = deviceNow + snapshot.serverOffsetMs;
  const pro = subscriptionGrantsAccess(snapshot.status, snapshot.periodEnd, now);
  const msLeft = snapshot.trialEndsAt - now;
  const trialActive = msLeft > 0;
  return {
    known: true,
    hasAccess: pro || trialActive,
    pro,
    trialActive,
    daysLeft: trialActive ? Math.max(1, Math.ceil(msLeft / DAY)) : 0,
    trialEndsAt: snapshot.trialEndsAt,
  };
}

const time = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const ms = new Date(value as string).getTime();
  return Number.isFinite(ms) ? ms : null;
};

/** Reads one row of `get_access()`. */
export function parseAccessRow(row: unknown, deviceNow = Date.now()): AccessSnapshot | null {
  if (!row || typeof row !== 'object') return null;
  const value = row as Record<string, unknown>;
  const trialEndsAt = time(value.trial_ends_at);
  if (trialEndsAt === null) return null;
  const serverTime = time(value.server_time);
  return {
    trialEndsAt,
    status: typeof value.status === 'string' ? value.status : null,
    periodEnd: time(value.current_period_end),
    serverOffsetMs: serverTime === null ? 0 : serverTime - deviceNow,
    fetchedAt: deviceNow,
  };
}

export function parseCachedAccess(raw: string | null): AccessSnapshot | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<AccessSnapshot>;
    if (!Number.isFinite(value.trialEndsAt) || !Number.isFinite(value.fetchedAt)) return null;
    return {
      trialEndsAt: value.trialEndsAt!,
      status: typeof value.status === 'string' ? value.status : null,
      periodEnd: Number.isFinite(value.periodEnd) ? value.periodEnd! : null,
      serverOffsetMs: Number.isFinite(value.serverOffsetMs) ? value.serverOffsetMs! : 0,
      fetchedAt: value.fetchedAt!,
    };
  } catch {
    return null;
  }
}
