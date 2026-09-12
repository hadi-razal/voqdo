import { parseSavedReflections, type SavedReflection } from '@/lib/reflections';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { challengeProgress } from '@/lib/challenges';
import { analyzeEntry, type Analysis } from '@/lib/analyze';
import { DEFAULT_SETTINGS, parseEntries, parseSettings } from '@/lib/journalStorage';
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
  analysisModel?: string;
  challengeId?: string;
  challengeStep?: number;
  /** Local file URI of the recording, when one was kept. */
  audioUri?: string;
};

/** An analysed entry that has not been saved yet. */
export type Draft = Analysis & {
  editingId?: string;
  analysisModel?: string;
  challengeId?: string;
  challengeStep?: number;
  body: string;
  source: EntrySource;
  durationMs: number;
  audioUri?: string;
};

export type Settings = {
  weeklyGoal: 3 | 5 | 7;
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
  reflections: SavedReflection[];
  saveReflection: (reflection: SavedReflection) => Promise<void>;
  ready: boolean;
  loadError: boolean;
  retryLoad: () => void;
  entries: Entry[];
  settings: Settings;
  streak: number;
  week: WeekDay[];
  entryById: (id: string) => Entry | undefined;
  entriesIn: (cat: CategoryKey) => Entry[];
  countFor: (cat: CategoryKey) => number;
  search: (query: string) => Entry[];
  writing: string;
  setWriting: (text: string) => void;
  draft: Draft | null;
  setDraft: (draft: Draft | null) => void;
  /** Analyses the text and parks it as the current draft. */
  composeDraft: (input: { body: string; source: EntrySource; durationMs: number; audioUri?: string; challengeId?: string; challengeStep?: number }) => Draft;
  saveDraft: () => Promise<Entry | null>;
  editEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
};

const ENTRIES_KEY = 'voqdo.entries';
const SETTINGS_KEY = 'voqdo.settings';
const WRITING_KEY = 'voqdo.writing';
const REFLECTIONS_KEY = 'voqdo.reflections';


const JournalContext = createContext<JournalContextValue | null>(null);

export function JournalProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const saving = useRef(false);
  const [today, setToday] = useState(() => dayKey(Date.now()));
  useEffect(() => {
    const timer = setInterval(() => setToday(dayKey(Date.now())), 60_000);
    return () => clearInterval(timer);
  }, []);
  const [reflections, setReflections] = useState<SavedReflection[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [writing, setWriting] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadError(false);
      try {
        const [storedEntries, storedSettings, storedWriting, storedReflections] = await AsyncStorage.multiGet([
          ENTRIES_KEY,
          SETTINGS_KEY,
          WRITING_KEY,
          REFLECTIONS_KEY,
        ]);
        if (cancelled) return;

        setReflections(parseSavedReflections(storedReflections[1]));
        setWriting(storedWriting[1] ?? '');
        setEntries(parseEntries(storedEntries[1]));
        setSettings(parseSettings(storedSettings[1]));
        setReady(true);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  // Persist only after the initial load, so an empty first render cannot
  // overwrite what is already on disk.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries)).catch(() => Alert.alert('Could not save journal', 'Your changes are still open, but could not be stored on this device. Please free some space and try again.'));
  }, [entries, ready]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => Alert.alert('Could not save settings', 'Please try changing the setting again.'));
  }, [settings, ready]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(WRITING_KEY, writing).catch(() => Alert.alert('Draft not saved', 'Keep this screen open and try again after freeing device storage.'));
  }, [writing, ready]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(REFLECTIONS_KEY, JSON.stringify(reflections)).catch(() => Alert.alert('Could not store reflections', 'Please try again.'));
  }, [reflections, ready]);

  const saveReflection = useCallback(async (reflection: SavedReflection) => {
    const next = [reflection, ...reflections.filter((item) => item.id !== reflection.id)];
    await AsyncStorage.setItem(REFLECTIONS_KEY, JSON.stringify(next));
    setReflections(next);
  }, [reflections]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setReflections((current) => current.filter((reflection) => !reflection.sourceIds.includes(id)));
  }, []);

  const resetAll = useCallback(() => {
    setEntries([]);
    setReflections([]);
    setWriting('');
    setSettings({ ...DEFAULT_SETTINGS, onboarded: true });
    setDraft(null);
  }, []);

  const composeDraft = useCallback<JournalContextValue['composeDraft']>((input) => {
    const next: Draft = { ...analyzeEntry(input.body), ...input };
    saving.current = false;
    setDraft(next);
    return next;
  }, []);

  const saveDraft = useCallback(async (): Promise<Entry | null> => {
    if (!draft || saving.current || !draft.body.trim() || !draft.title.trim()) return null;
    saving.current = true;
    const original = entries.find((entry) => entry.id === draft.editingId);

    const journey = draft.challengeId ? challengeProgress(entries, draft.challengeId, Date.now()) : null;
    const challengeValid = original || (journey && !journey.done && !journey.todayDone && journey.completed === draft.challengeStep);
    const entry: Entry = {
      id: original?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: original?.createdAt ?? Date.now(),
      source: draft.source,
      durationMs: draft.durationMs,
      title: draft.title,
      body: draft.body,
      categories: draft.categories,
      mood: draft.mood,
      emotions: draft.emotions,
      affirmation: draft.affirmation,
      analysisModel: draft.analysisModel,
      challengeId: challengeValid ? draft.challengeId : undefined,
      challengeStep: challengeValid ? draft.challengeStep : undefined,
      audioUri: draft.audioUri,
    };

    const nextEntries = original
      ? entries.map((item) => item.id === original.id ? entry : item)
      : [entry, ...entries];
    try {
      await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(nextEntries));
    } catch {
      saving.current = false;
      return null;
    }
    setEntries(nextEntries);
    setDraft(null);
    if (!draft.editingId && draft.source === 'text') setWriting('');
    return entry;
  }, [draft, entries]);

  const week = useMemo(() => {
    // The day key invalidates calendar calculations when midnight passes.
    void today;
    return buildWeek(entries);
  }, [entries, today]);

  const value = useMemo<JournalContextValue>(
    () => ({
      reflections,
      saveReflection,
      ready,
      loadError,
      retryLoad: () => setLoadAttempt((value) => value + 1),
      editEntry: (entry) => { saving.current = false; setDraft({ ...entry, editingId: entry.id }); },
      entries,
      settings,
      streak: streakFrom(entries),
      week,
      entryById: (id) => entries.find((entry) => entry.id === id),
      entriesIn: (cat) => entries.filter((entry) => entry.categories.includes(cat)),
      countFor: (cat) => entries.filter((entry) => entry.categories.includes(cat)).length,
      search: (query) => searchEntries(entries, query),
      writing,
      setWriting,
      draft,
      setDraft,
      composeDraft,
      saveDraft,
      deleteEntry,
      updateSettings,
      resetAll,
    }),
    [reflections, saveReflection, ready, loadError, entries, settings, week, writing, draft, composeDraft, saveDraft, deleteEntry, updateSettings, resetAll]
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal() {
  const context = useContext(JournalContext);
  if (!context) throw new Error('useJournal must be used inside JournalProvider');
  return context;
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
