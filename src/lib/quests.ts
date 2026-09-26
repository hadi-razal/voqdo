import type { Entry } from '@/context/journal';

/**
 * Three small quests a day: always "check in", plus two that rotate by date
 * so each evening feels a little different. Completion is derived from saved
 * entries, so quests cannot be gamed by drafts and never need extra storage.
 */

type QuestEntry = Pick<Entry, 'createdAt' | 'body' | 'source' | 'categories' | 'emotions' | 'challengeId'>;

type QuestDef = {
  id: string;
  title: string;
  hint: string;
  icon: 'check' | 'text' | 'mic' | 'heart' | 'refresh' | 'smile' | 'sprout';
  done: (today: QuestEntry[]) => boolean;
};

const words = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

const CHECK_IN: QuestDef = {
  id: 'checkin',
  title: 'Check in',
  hint: 'Save any page today',
  icon: 'check',
  done: (today) => today.length > 0,
};

const POOL: QuestDef[] = [
  { id: 'deep', title: 'Go a little deeper', hint: 'Write 80+ words today', icon: 'text', done: (today) => today.reduce((sum, entry) => sum + words(entry.body), 0) >= 80 },
  { id: 'voice', title: 'Say it out loud', hint: 'Save a voice entry', icon: 'mic', done: (today) => today.some((entry) => entry.source === 'voice') },
  { id: 'good', title: 'Notice the good', hint: 'Save a page tagged Gratitude', icon: 'heart', done: (today) => today.some((entry) => entry.categories.includes('Gratitude')) },
  { id: 'twice', title: 'Come back later', hint: 'Save two pages today', icon: 'refresh', done: (today) => today.length >= 2 },
  { id: 'feeling', title: 'Name a feeling', hint: 'Save a page with a recognised emotion', icon: 'smile', done: (today) => today.some((entry) => entry.emotions.length > 0) },
  { id: 'journey', title: 'Take a journey step', hint: 'Save a guided journey page', icon: 'sprout', done: (today) => today.some((entry) => !!entry.challengeId) },
];

const DAY = 86_400_000;
function ordinal(ms: number) {
  const date = new Date(ms);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY;
}

function questsForDay(day: number): QuestDef[] {
  const a = day % POOL.length;
  // An offset of 1..length-1 keeps the second quest distinct from the first.
  const b = (a + 1 + (Math.floor(day / POOL.length) % (POOL.length - 1))) % POOL.length;
  return [CHECK_IN, POOL[a], POOL[b]];
}

export type Quest = { id: string; title: string; hint: string; icon: QuestDef['icon']; done: boolean };

export function dailyQuests(entries: QuestEntry[], now = Date.now()): Quest[] {
  const day = ordinal(now);
  const today = entries.filter((entry) => entry.createdAt <= now && ordinal(entry.createdAt) === day);
  return questsForDay(day).map(({ done, ...quest }) => ({ ...quest, done: done(today) }));
}

/** Days on which every quest was completed — each one earns Sprout a star. */
export function starsEarned(entries: QuestEntry[], now = Date.now()): number {
  const byDay = new Map<number, QuestEntry[]>();
  for (const entry of entries) {
    if (entry.createdAt > now) continue;
    const day = ordinal(entry.createdAt);
    byDay.set(day, [...(byDay.get(day) ?? []), entry]);
  }
  let stars = 0;
  for (const [day, list] of byDay) if (questsForDay(day).every((quest) => quest.done(list))) stars++;
  return stars;
}
