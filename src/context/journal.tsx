import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { analyzeEntry, type Analysis } from '@/lib/analyze';
import { CATEGORY_KEYS, type CategoryKey, type Mood } from '@/theme';

export type EntrySource = 'voice' | 'text';

export type Entry = {
  id: string;
  createdAt: number;
  source: EntrySource;
  /** Recording length in ms; 0 for typed entries. */
  durationMs: number;
  title: string;
  body: string;
  categories: CategoryKey[];
  mood: Mood;
  emotions: string[];
  affirmation: string;
  /** Local file URI of the recording, when one was kept. */
  audioUri?: string;
};

/** An analysed entry that has not been saved yet. */
export type Draft = Analysis & {
  body: string;
  source: EntrySource;
  durationMs: number;
  audioUri?: string;
};

export type Settings = {
  onboarded: boolean;
  micGranted: boolean;
  nightlyPrompt: boolean;
  reminderTime: string;
  pro: boolean;
  name: string;
};

/** One dot in the home screen's week strip. */
export type WeekDay = {
  key: string;
  label: string;
  done: boolean;
  isToday: boolean;
  isFuture: boolean;
};

type JournalContextValue = {
  ready: boolean;
  entries: Entry[];
  settings: Settings;
  streak: number;
  week: WeekDay[];
  entryById: (id: string) => Entry | undefined;
  entriesIn: (cat: CategoryKey) => Entry[];
  countFor: (cat: CategoryKey) => number;
  search: (query: string) => Entry[];
  draft: Draft | null;
  setDraft: (draft: Draft | null) => void;
  /** Analyses the text and parks it as the current draft. */
  composeDraft: (input: { body: string; source: EntrySource; durationMs: number; audioUri?: string }) => Draft;
  saveDraft: () => Entry | null;
  deleteEntry: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
};

const ENTRIES_KEY = 'voqdo.entries';
const SETTINGS_KEY = 'voqdo.settings';

const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  micGranted: false,
  nightlyPrompt: false,
  reminderTime: '9:00 PM',
  pro: false,
  name: 'You',
};

const JournalContext = createContext<JournalContextValue | null>(null);

export function JournalProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [storedEntries, storedSettings] = await AsyncStorage.multiGet([
        ENTRIES_KEY,
        SETTINGS_KEY,
      ]);
      if (cancelled) return;

      setEntries(parseEntries(storedEntries[1]));
      setSettings({ ...DEFAULT_SETTINGS, ...safeParse(storedSettings[1], {}) });
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist only after the initial load, so an empty first render cannot
  // overwrite what is already on disk.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries, ready]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, ready]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    setEntries([]);
    setSettings({ ...DEFAULT_SETTINGS, onboarded: true });
    setDraft(null);
  }, []);

  const composeDraft = useCallback<JournalContextValue['composeDraft']>((input) => {
    const next: Draft = { ...analyzeEntry(input.body), ...input };
    setDraft(next);
    return next;
  }, []);

  const saveDraft = useCallback((): Entry | null => {
    if (!draft) return null;

    const entry: Entry = {
      id: `${Date.now()}`,
      createdAt: Date.now(),
      source: draft.source,
      durationMs: draft.durationMs,
      title: draft.title,
      body: draft.body,
      categories: draft.categories,
      mood: draft.mood,
      emotions: draft.emotions,
      affirmation: draft.affirmation,
      audioUri: draft.audioUri,
    };

    setEntries((current) => [entry, ...current]);
    setDraft(null);
    return entry;
  }, [draft]);

  const week = useMemo(() => buildWeek(entries), [entries]);

  const value = useMemo<JournalContextValue>(
    () => ({
      ready,
      entries,
      settings,
      streak: streakFrom(entries),
      week,
      entryById: (id) => entries.find((entry) => entry.id === id),
      entriesIn: (cat) => entries.filter((entry) => entry.categories.includes(cat)),
      countFor: (cat) => entries.filter((entry) => entry.categories.includes(cat)).length,
      search: (query) => searchEntries(entries, query),
      draft,
      setDraft,
      composeDraft,
      saveDraft,
      deleteEntry,
      updateSettings,
      resetAll,
    }),
    [ready, entries, settings, week, draft, composeDraft, saveDraft, deleteEntry, updateSettings, resetAll]
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal() {
  const context = useContext(JournalContext);
  if (!context) throw new Error('useJournal must be used inside JournalProvider');
  return context;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const MOODS: Mood[] = ['Calm', 'Bright', 'Heavy', 'Restless', 'Tender'];

/**
 * Reads stored entries defensively.
 *
 * Anything unrecognised is repaired rather than dropped — a field written by
 * an older build, or a value that no longer exists in the enum, must never
 * cost someone their journal or crash a screen that indexes by it.
 */
function parseEntries(raw: string | null): Entry[] {
  const parsed = safeParse<unknown>(raw, []);
  if (!Array.isArray(parsed)) return [];

  return parsed.map(normalizeEntry).filter((entry): entry is Entry => entry !== null);
}

function normalizeEntry(input: unknown): Entry | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;

  const id = typeof raw.id === 'string' && raw.id ? raw.id : null;
  // `transcript` is what an earlier build called the entry text.
  const body =
    typeof raw.body === 'string' && raw.body.trim()
      ? raw.body
      : typeof raw.transcript === 'string' && raw.transcript.trim()
        ? raw.transcript
        : null;

  if (!id || !body) return null;

  const categories = Array.isArray(raw.categories)
    ? raw.categories.filter((cat): cat is CategoryKey =>
        CATEGORY_KEYS.includes(cat as CategoryKey)
      )
    : [];

  const emotions = Array.isArray(raw.emotions)
    ? raw.emotions.filter((e): e is string => typeof e === 'string')
    : [];

  const mood = MOODS.includes(raw.mood as Mood) ? (raw.mood as Mood) : null;
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title : null;
  const affirmation =
    typeof raw.affirmation === 'string' && raw.affirmation.trim() ? raw.affirmation : null;

  // Re-derive only the parts that are missing, so a partial record is healed
  // instead of discarded.
  const derived = title && affirmation && mood && categories.length > 0 ? null : analyzeEntry(body);

  const durationMs = typeof raw.durationMs === 'number' && raw.durationMs >= 0 ? raw.durationMs : 0;

  return {
    id,
    createdAt:
      typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt)
        ? raw.createdAt
        : Date.now(),
    source: raw.source === 'text' || durationMs === 0 ? 'text' : 'voice',
    durationMs,
    title: title ?? derived!.title,
    body,
    categories: categories.length > 0 ? categories : (derived!.categories ?? ['Reflection']),
    mood: mood ?? derived!.mood,
    emotions: emotions.length > 0 ? emotions : (derived?.emotions ?? []),
    affirmation: affirmation ?? derived!.affirmation,
    audioUri: typeof raw.audioUri === 'string' ? raw.audioUri : undefined,
  };
}

function searchEntries(entries: Entry[], query: string): Entry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(q) ||
      entry.body.toLowerCase().includes(q) ||
      entry.mood.toLowerCase().includes(q) ||
      entry.categories.some((cat) => cat.toLowerCase().includes(q)) ||
      entry.emotions.some((emotion) => emotion.toLowerCase().includes(q))
  );
}

/** Consecutive days with an entry, counting back from today. */
function streakFrom(entries: Entry[]): number {
  if (entries.length === 0) return 0;

  const days = new Set(entries.map((entry) => dayKey(entry.createdAt)));
  const cursor = new Date();
  let streak = 0;

  // A journal written yesterday but not yet today still has a live streak.
  if (!days.has(dayKey(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor.getTime()))) return 0;
  }

  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Monday-first week containing today, marked with which days were written. */
function buildWeek(entries: Entry[]): WeekDay[] {
  const days = new Set(entries.map((entry) => dayKey(entry.createdAt)));
  const today = new Date();
  const todayKey = dayKey(today.getTime());

  // getDay() is Sunday-first; shift so Monday is index 0.
  const offset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - offset);

  return WEEKDAYS.map((label, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const key = dayKey(date.getTime());

    return {
      key,
      label,
      done: days.has(key),
      isToday: key === todayKey,
      isFuture: i > offset,
    };
  });
}

export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** "Today" / "Yesterday" / "Sun, Apr 27, 2025". */
export function dayLabel(ms: number): string {
  const today = new Date();
  if (dayKey(ms) === dayKey(today.getTime())) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(ms) === dayKey(yesterday.getTime())) return 'Yesterday';

  return new Date(ms).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Full stamp used on the entry screen: "Sun, Apr 27, 2025 · 10:14 PM". */
export function fullStamp(ms: number): string {
  const date = new Date(ms).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${date} · ${clockLabel(ms)}`;
}

export function clockLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export { CATEGORY_KEYS };
export type { CategoryKey };
