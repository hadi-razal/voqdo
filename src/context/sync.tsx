import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAccount } from '@/context/account';
import { useJournal, type Entry, type RemoteChanges } from '@/context/journal';
import { normalizeEntry } from '@/lib/journalStorage';
import { parseSavedReflections, type SavedReflection } from '@/lib/reflections';
import { supabase } from '@/lib/supabase';
import { stamp, type Tombstones } from '@/lib/syncMerge';

/**
 * Backs the journal up to Supabase and keeps devices in step.
 *
 * Push first (everything changed locally since the last push, plus pending
 * deletions), then pull everything the server changed since the last pull.
 * The database resolves conflicts (last writer wins) and enforces access:
 * after the trial, only deletions are accepted, while reading still works.
 */

type SyncStatus = { syncing: boolean; lastSyncedAt: number | null; error: string | null };
type SyncMeta = { pushedAt: number; pulled: { entries: string; reflections: string } };

const PAGE = 500;
const EPOCH = '1970-01-01T00:00:00.000Z';
const metaKey = (userId: string) => `voqdo.sync.${userId}`;

const SyncContext = createContext<(SyncStatus & { syncNow: () => void }) | null>(null);

const iso = (ms: number) => new Date(ms).toISOString();

function entryToRow(entry: Entry, userId: string) {
  return {
    user_id: userId,
    id: entry.id,
    created_at: iso(entry.createdAt),
    client_updated_at: stamp(entry),
    deleted_at: null,
    source: entry.source,
    duration_ms: Math.max(0, Math.round(entry.durationMs)),
    title: entry.title.slice(0, 200),
    body: entry.body.slice(0, 60000),
    categories: entry.categories,
    mood: entry.mood,
    emotions: entry.emotions.slice(0, 10),
    affirmation: entry.affirmation.slice(0, 600),
    analysis_model: entry.analysisModel ?? null,
    challenge_id: entry.challengeId ?? null,
    challenge_step: entry.challengeStep ?? null,
  };
}

function entryTombstone(id: string, at: number, userId: string) {
  // Placeholders satisfy NOT NULL on first insert; the server scrubs content anyway.
  return {
    user_id: userId, id, created_at: iso(at), client_updated_at: at, deleted_at: iso(at),
    source: 'text', duration_ms: 0, title: '', body: '', categories: [], mood: 'Calm', emotions: [], affirmation: '',
    analysis_model: null, challenge_id: null, challenge_step: null,
  };
}

function reflectionToRow(item: SavedReflection, userId: string) {
  return {
    user_id: userId,
    id: item.id,
    created_at: iso(item.createdAt),
    client_updated_at: item.createdAt,
    deleted_at: null,
    mode: item.mode,
    model: item.model,
    source_ids: item.sourceIds.slice(0, 5),
    summary: item.summary,
    observations: item.observations,
    question: item.question,
    action: item.action,
  };
}

function reflectionTombstone(id: string, at: number, userId: string) {
  return {
    user_id: userId, id, created_at: iso(at), client_updated_at: at, deleted_at: iso(at),
    mode: 'recap', model: 'deleted', source_ids: [], summary: '', observations: [], question: '', action: '',
  };
}

type Row = Record<string, unknown>;

function rowToEntry(row: Row): Entry | null {
  return normalizeEntry({
    id: row.id,
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: Number(row.client_updated_at),
    source: row.source,
    durationMs: row.duration_ms,
    title: row.title,
    body: row.body,
    categories: row.categories,
    mood: row.mood,
    emotions: row.emotions,
    affirmation: row.affirmation,
    analysisModel: row.analysis_model ?? undefined,
    challengeId: row.challenge_id ?? undefined,
    challengeStep: row.challenge_step ?? undefined,
  });
}

function rowToReflection(row: Row): SavedReflection | null {
  const [item] = parseSavedReflections(
    JSON.stringify([
      {
        id: row.id,
        createdAt: new Date(row.created_at as string).getTime(),
        mode: row.mode,
        model: row.model,
        sourceIds: row.source_ids,
        summary: row.summary,
        observations: row.observations,
        question: row.question,
        action: row.action,
      },
    ])
  );
  return item ?? null;
}

async function upsertAll(table: 'entries' | 'reflections', rows: object[]) {
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await supabase!.from(table).upsert(rows.slice(i, i + 100), { onConflict: 'user_id,id' });
    if (error) throw error;
  }
}

/** Every row changed since `since`, paged; rows at exactly `since` repeat harmlessly. */
async function pullAll(table: 'entries' | 'reflections', since: string) {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase!
      .from(table)
      .select('*')
      .gte('updated_at', since)
      .order('updated_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user, access } = useAccount();
  const { ready, entries, reflections, tombstones, applyRemote, confirmTombstones } = useJournal();
  const [status, setStatus] = useState<SyncStatus>({ syncing: false, lastSyncedAt: null, error: null });
  const running = useRef(false);
  const again = useRef(false);
  // Bumped when changes arrive mid-sync, so one more pass runs afterwards.
  const [rerun, setRerun] = useState(0);
  const snapshot = useRef({ entries, reflections, tombstones, hasAccess: access.hasAccess });

  useEffect(() => {
    snapshot.current = { entries, reflections, tombstones, hasAccess: access.hasAccess };
  }, [entries, reflections, tombstones, access.hasAccess]);

  const run = useCallback(async () => {
    if (!supabase || !user || !ready) return;
    if (running.current) {
      again.current = true;
      return;
    }
    running.current = true;
    try {
      const raw = await AsyncStorage.getItem(metaKey(user.id));
      setStatus((current) => ({ ...current, syncing: true }));
      const meta: SyncMeta = raw ? JSON.parse(raw) : { pushedAt: 0, pulled: { entries: EPOCH, reflections: EPOCH } };
      const { entries: localEntries, reflections: localReflections, tombstones: pending, hasAccess } = snapshot.current;
      const startedAt = Date.now();

      // Push. Without access only deletions go up; the server would refuse the rest.
      const deletions = (record: Tombstones[keyof Tombstones]) =>
        Object.entries(record).filter(([, at]) => at > meta.pushedAt);
      await upsertAll('entries', [
        ...(hasAccess ? localEntries.filter((entry) => stamp(entry) > meta.pushedAt).map((entry) => entryToRow(entry, user.id)) : []),
        ...deletions(pending.entries).map(([id, at]) => entryTombstone(id, at, user.id)),
      ]);
      await upsertAll('reflections', [
        ...(hasAccess ? localReflections.filter((item) => item.createdAt > meta.pushedAt).map((item) => reflectionToRow(item, user.id)) : []),
        ...deletions(pending.reflections).map(([id, at]) => reflectionTombstone(id, at, user.id)),
      ]);
      if (hasAccess) meta.pushedAt = startedAt;
      confirmTombstones(startedAt);

      // Pull.
      const [entryRows, reflectionRows] = await Promise.all([
        pullAll('entries', meta.pulled.entries),
        pullAll('reflections', meta.pulled.reflections),
      ]);
      const changes: RemoteChanges = { entries: [], removedEntries: [], reflections: [], removedReflections: [] };
      for (const row of entryRows) {
        if (row.deleted_at) changes.removedEntries.push({ id: String(row.id), at: Number(row.client_updated_at) });
        else {
          const entry = rowToEntry(row);
          if (entry) changes.entries.push(entry);
        }
      }
      for (const row of reflectionRows) {
        if (row.deleted_at) changes.removedReflections.push({ id: String(row.id), at: Number(row.client_updated_at) });
        else {
          const item = rowToReflection(row);
          if (item) changes.reflections.push(item);
        }
      }
      applyRemote(changes);
      const last = (rows: Row[], fallback: string) => (rows.length ? String(rows[rows.length - 1].updated_at) : fallback);
      meta.pulled = { entries: last(entryRows, meta.pulled.entries), reflections: last(reflectionRows, meta.pulled.reflections) };

      await AsyncStorage.setItem(metaKey(user.id), JSON.stringify(meta));
      setStatus({ syncing: false, lastSyncedAt: Date.now(), error: null });
    } catch {
      setStatus((current) => ({ ...current, syncing: false, error: 'Sync paused. Your journal is safe on this device.' }));
    } finally {
      running.current = false;
      if (again.current) {
        again.current = false;
        setRerun((n) => n + 1);
      }
    }
  }, [user, ready, applyRemote, confirmTombstones]);

  // Sign-in, access changes, a queued pass and returning to the app all trigger a sync.
  useEffect(() => {
    void rerun;
    const timer = setTimeout(run, 0);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [run, access.hasAccess, rerun]);

  // Local edits sync shortly after they settle.
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(run, 2000);
    return () => clearTimeout(timer);
  }, [entries, reflections, tombstones, user, run]);

  const value = useMemo(() => ({ ...status, syncNow: run }), [status, run]);
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used inside SyncProvider');
  return context;
}
