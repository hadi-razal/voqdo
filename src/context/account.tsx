import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useJournal } from '@/context/journal';
import { accessState, parseAccessRow, parseCachedAccess, type AccessSnapshot } from '@/lib/access';
import { cloudEnabled, invokeFunction, supabase } from '@/lib/supabase';

/**
 * Accounts, the free trial and VOQDO Pro.
 *
 * Everyone gets a silent guest account once onboarding finishes, which starts
 * the three-day trial on the server. Adding an email keeps the journal and
 * the subscription safe across devices. Without a configured backend (local
 * development) this provider stays inert and everything is unlocked.
 */

export type AccountUser = { id: string; email: string | null; isAnonymous: boolean };
export type EmailCodeMode = 'link' | 'signin';

type AccountValue = {
  cloud: boolean;
  /** The session has been resolved (always true without a backend). */
  ready: boolean;
  user: AccountUser | null;
  access: ReturnType<typeof accessState>;
  refreshAccess: () => Promise<void>;
  /** Emails a 6-digit code: `link` saves this account to an email, `signin` restores an existing one. */
  sendEmailCode: (email: string, mode: EmailCodeMode) => Promise<void>;
  verifyEmailCode: (email: string, code: string, mode: EmailCodeMode) => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const ACCESS_KEY = 'voqdo.access';

const AccountContext = createContext<AccountValue | null>(null);

async function fetchAccess(): Promise<AccessSnapshot | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_access').maybeSingle();
  return error ? null : parseAccessRow(data);
}

const toUser = (user: User | null | undefined): AccountUser | null =>
  user ? { id: user.id, email: user.email ?? null, isAnonymous: !!user.is_anonymous } : null;

export function AccountProvider({ children }: { children: ReactNode }) {
  const { ready: journalReady, settings } = useJournal();
  const [sessionChecked, setSessionChecked] = useState(!cloudEnabled);
  const [user, setUser] = useState<AccountUser | null>(null);
  // Tagged with its owner so a previous account's status can never leak into the next.
  const [stored, setStored] = useState<{ userId: string; snapshot: AccessSnapshot } | null>(null);
  const snapshot = stored && stored.userId === user?.id ? stored.snapshot : null;
  const [tick, setTick] = useState(0);

  // Restore the session and follow sign-in changes.
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(toUser(data.session?.user));
      setSessionChecked(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(toUser(session?.user)));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Offline, the last known access still applies (the trial clock keeps running).
  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(ACCESS_KEY)
      .then((raw) => {
        const cached = raw ? (JSON.parse(raw) as { userId?: string; snapshot?: unknown }) : null;
        if (cached?.userId === user.id) {
          const parsed = parseCachedAccess(JSON.stringify(cached.snapshot));
          if (parsed) setStored((current) => (current?.userId === user.id ? current : { userId: user.id, snapshot: parsed }));
        }
      })
      .catch(() => {});
  }, [user]);

  // First launch after onboarding: create the guest account, starting the trial.
  useEffect(() => {
    if (!supabase || !sessionChecked || !journalReady || !settings.onboarded || user) return;
    let retry: ReturnType<typeof setTimeout>;
    const attempt = () =>
      supabase!.auth.signInAnonymously().then(({ error }) => {
        if (error) retry = setTimeout(attempt, 30_000);
      });
    attempt();
    return () => clearTimeout(retry);
  }, [sessionChecked, journalReady, settings.onboarded, user]);

  const store = useCallback((userId: string, next: AccessSnapshot | null) => {
    if (!next) return;
    setStored({ userId, snapshot: next });
    AsyncStorage.setItem(ACCESS_KEY, JSON.stringify({ userId, snapshot: next })).catch(() => {});
  }, []);

  const refreshAccess = useCallback(async () => {
    if (!user) return;
    store(user.id, await fetchAccess());
  }, [user, store]);

  // Fetch on sign-in and whenever the app comes back to the foreground.
  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = () =>
      fetchAccess().then((next) => {
        if (active) store(user.id, next);
      });
    load();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [user, store]);

  // Re-evaluate once a minute so the trial ends on time while the app is open.
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const access = useMemo(() => {
    void tick;
    return cloudEnabled ? accessState(snapshot) : accessState(null);
  }, [snapshot, tick]);

  const sendEmailCode = useCallback(async (email: string, mode: EmailCodeMode) => {
    if (!supabase) throw new Error('This build is not connected to VOQDO’s servers.');
    const address = email.trim().toLowerCase();
    const { error } =
      mode === 'link'
        ? await supabase.auth.updateUser({ email: address })
        : await supabase.auth.signInWithOtp({ email: address, options: { shouldCreateUser: false } });
    if (error) throw new Error(friendlyAuthError(error.message, mode));
  }, []);

  const verifyEmailCode = useCallback(async (email: string, code: string, mode: EmailCodeMode) => {
    if (!supabase) throw new Error('This build is not connected to VOQDO’s servers.');
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: mode === 'link' ? 'email_change' : 'email',
    });
    if (error) throw new Error('That code didn’t work. Check the latest email and try again.');
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!supabase) return;
    await invokeFunction('delete-account', {});
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    await AsyncStorage.removeItem(ACCESS_KEY).catch(() => {});
    setStored(null);
  }, []);

  const value = useMemo<AccountValue>(
    () => ({
      cloud: cloudEnabled,
      ready: !cloudEnabled || (sessionChecked && (!settings.onboarded || !!user)),
      user,
      access,
      refreshAccess,
      sendEmailCode,
      verifyEmailCode,
      deleteAccount,
    }),
    [sessionChecked, settings.onboarded, user, access, refreshAccess, sendEmailCode, verifyEmailCode, deleteAccount]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error('useAccount must be used inside AccountProvider');
  return context;
}

function friendlyAuthError(message: string, mode: EmailCodeMode) {
  const text = message.toLowerCase();
  if (text.includes('already') && mode === 'link') {
    return 'That email already has a VOQDO account. Use “Sign in to an existing account” instead.';
  }
  if (text.includes('signups not allowed') || text.includes('not found')) {
    return 'No VOQDO account uses that email yet.';
  }
  if (text.includes('rate') || text.includes('seconds')) return 'Please wait a minute before asking for another code.';
  if (text.includes('invalid') && text.includes('email')) return 'That email address doesn’t look right.';
  return 'Could not send a code right now. Please try again.';
}
