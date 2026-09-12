import { CHALLENGES } from '@/lib/challenges';
import { analyzeEntry } from '@/lib/analyze';
import { CATEGORY_KEYS, type CategoryKey, type Mood } from '@/theme';
import type { Entry, Settings } from '@/context/journal';

export const DEFAULT_SETTINGS: Settings = {
  weeklyGoal: 3,
  onboarded: false,
  micGranted: false,
  nightlyPrompt: false,
  reminderTime: '9:00 PM',
  pro: false,
  name: 'You',
};


function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function parseSettings(raw: string | null): Settings {
  const parsed = safeParse<unknown>(raw, {});
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...DEFAULT_SETTINGS };
  const value = parsed as Record<string, unknown>;
  const next = { ...DEFAULT_SETTINGS };
  for (const key of ['onboarded', 'micGranted', 'nightlyPrompt', 'pro'] as const) {
    if (typeof value[key] === 'boolean') next[key] = value[key];
  }
  if (typeof value.name === 'string' && value.name.trim()) next.name = value.name.trim().slice(0, 40);
  if (typeof value.reminderTime === 'string') next.reminderTime = value.reminderTime;
  if (value.weeklyGoal === 3 || value.weeklyGoal === 5 || value.weeklyGoal === 7) next.weeklyGoal = value.weeklyGoal;
  return next;
}

const MOODS: Mood[] = ['Calm', 'Bright', 'Heavy', 'Restless', 'Tender'];

/**
 * Reads stored entries defensively.
 *
 * Anything unrecognised is repaired rather than dropped — a field written by
 * an older build, or a value that no longer exists in the enum, must never
 * cost someone their journal or crash a screen that indexes by it.
 */
export function parseEntries(raw: string | null): Entry[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Journal storage must contain an array');

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

  const durationMs = typeof raw.durationMs === 'number' && Number.isFinite(raw.durationMs) && raw.durationMs >= 0 ? raw.durationMs : 0;

  return {
    id,
    createdAt:
      typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt)
        ? raw.createdAt
        : Date.now(),
    source: raw.source === 'voice' ? 'voice' : raw.source === 'text' || durationMs === 0 ? 'text' : 'voice',
    durationMs,
    title: title ?? derived!.title,
    body,
    categories: Array.isArray(raw.categories) && raw.categories.length === 0 ? [] : categories.length > 0 ? categories : (derived!.categories ?? ['Reflection']),
    mood: mood ?? derived!.mood,
    emotions: emotions.length > 0 ? emotions : (derived?.emotions ?? []),
    affirmation: affirmation ?? derived!.affirmation,
    ...(CHALLENGES.some((challenge) => challenge.id === raw.challengeId) && Number.isInteger(raw.challengeStep) && Number(raw.challengeStep) >= 0 && Number(raw.challengeStep) < 3 ? { challengeId: raw.challengeId as string, challengeStep: raw.challengeStep as number } : {}),
    ...(typeof raw.analysisModel === 'string' ? { analysisModel: raw.analysisModel } : {}),
    audioUri: typeof raw.audioUri === 'string' ? raw.audioUri : undefined,
  };
}

