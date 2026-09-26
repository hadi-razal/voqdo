import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

/**
 * The Supabase client, or null when this build has no backend configured
 * (local development without `.env.local`). Every caller must handle null:
 * the app then runs fully on-device, without accounts, sync or the trial gate.
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

// Static web rendering runs without `window`; there is nothing to persist there.
const canPersist = Platform.OS !== 'web' || typeof window !== 'undefined';

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: canPersist ? AsyncStorage : undefined,
          persistSession: canPersist,
          autoRefreshToken: canPersist,
          detectSessionInUrl: false,
        },
      })
    : null;

export const cloudEnabled = supabase !== null;

// Refresh tokens only while the app is in the foreground, as Supabase advises for React Native.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Calls an Edge Function and surfaces its `{ error }` message on failure. */
export async function invokeFunction<T>(name: string, body: object, signal?: AbortSignal): Promise<T> {
  if (!supabase) throw new Error('This build is not connected to VOQDO’s servers.');
  const { data, error } = await supabase.functions.invoke<T>(name, { body, signal });
  if (!error) return data as T;
  if (error instanceof FunctionsHttpError) {
    const payload = await error.context.json().catch(() => null);
    const failure = new Error(typeof payload?.error === 'string' ? payload.error : 'Something went wrong. Please try again.');
    (failure as Error & { code?: string }).code = typeof payload?.code === 'string' ? payload.code : undefined;
    throw failure;
  }
  throw new Error(signal?.aborted ? 'Request cancelled.' : 'Could not reach VOQDO. Check your connection and try again.');
}
