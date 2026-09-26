import type { Entry } from '@/context/journal';

export const DAILY_XP = 20;
export const LEVEL_XP = 100;
export const LEVEL_NAMES = ['Seed', 'Sprout', 'Sapling', 'Bloom', 'Grove', 'Forest'];
/** Journaled days needed to earn one leaf shield. */
export const SHIELD_EVERY = 7;
/** Shields that can be held at once. */
export const MAX_SHIELDS = 2;
const DAY = 86_400_000;

// Compare local calendar days as UTC ordinals, avoiding DST-length days.
export function ordinal(ms: number) {
  const date = new Date(ms);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY;
}

/**
 * Walks journaled days in order. A leaf shield is earned every seven
 * journaled days (holding at most two) and is spent automatically to bridge
 * a missed day, so one busy evening does not erase a long streak.
 */
function walkStreak(days: number[], today: number) {
  let shields = 0;
  let run = 0;
  let best = 0;
  let prev: number | null = null;
  days.forEach((day, i) => {
    if (prev === null) run = 1;
    else {
      const gap = day - prev - 1;
      if (gap === 0) run += 1;
      else if (gap <= shields) {
        shields -= gap;
        run += 1;
      } else run = 1;
    }
    if ((i + 1) % SHIELD_EVERY === 0) shields = Math.min(MAX_SHIELDS, shields + 1);
    best = Math.max(best, run);
    prev = day;
  });

  if (prev === null) return { streak: 0, best, shields: 0, protectedDays: 0 };
  // Days missed between the last page and today (today itself is still open).
  const missed = Math.max(0, today - prev - 1);
  if (missed === 0) return { streak: run, best, shields, protectedDays: 0 };
  if (missed <= shields) return { streak: run, best, shields: shields - missed, protectedDays: missed };
  return { streak: 0, best, shields, protectedDays: 0 };
}

export function habitProgress(entries: Pick<Entry, 'createdAt'>[], now = Date.now(), weeklyGoal = 3) {
  const today = ordinal(now);
  const days = [...new Set(entries.filter((entry) => Number.isFinite(entry.createdAt) && entry.createdAt <= now)
    .map((entry) => ordinal(entry.createdAt)).filter(Number.isFinite))].sort((a, b) => a - b);
  const completed = new Set(days);
  const monday = today - ((new Date(now).getDay() + 6) % 7);
  const weeklyDays = days.filter((day) => day >= monday).length;
  const walk = walkStreak(days, today);
  const xp = days.length * DAILY_XP;
  const level = Math.floor(xp / LEVEL_XP) + 1;
  const lastDay = days.length ? days[days.length - 1] : null;
  const badges = [
    { id: 'first', name: 'First page', description: 'Journal on your first day', value: days.length, target: 1 },
    { id: 'three', name: 'Finding rhythm', description: 'Journal on 3 different days', value: days.length, target: 3 },
    { id: 'streak', name: 'Steady steps', description: 'Build a 3-day streak', value: walk.best, target: 3 },
    { id: 'seven', name: 'A little ritual', description: 'Journal on 7 different days', value: days.length, target: 7 },
    { id: 'week', name: 'Seven in a row', description: 'Build a 7-day streak', value: walk.best, target: 7 },
    { id: 'month', name: 'Growing roots', description: 'Journal on 30 different days', value: days.length, target: 30 },
  ].map((badge) => ({ ...badge, earned: badge.value >= badge.target }));
  return {
    xp, level, levelName: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)],
    levelXp: xp % LEVEL_XP, nextLevelXp: LEVEL_XP - xp % LEVEL_XP,
    totalDays: days.length, todayDone: completed.has(today), weeklyDays, weeklyGoal,
    weeklyComplete: weeklyDays >= weeklyGoal, streak: walk.streak, bestStreak: walk.best, badges,
    shields: walk.shields,
    /** Missed days currently covered by a shield (the streak is being protected). */
    protectedDays: walk.protectedDays,
    /** Journaled days until the next shield is earned. */
    nextShieldIn: SHIELD_EVERY - (days.length % SHIELD_EVERY),
    /** Whole days since the last page; null for an empty journal. */
    daysAway: lastDay === null ? null : Math.max(0, today - lastDay),
  };
}

export type HabitProgress = ReturnType<typeof habitProgress>;

export function rewardMessage(before: Pick<Entry, 'createdAt'>[], after: Pick<Entry, 'createdAt'>[], now = Date.now()) {
  const previous = habitProgress(before, now);
  const current = habitProgress(after, now);
  if (current.totalDays <= previous.totalDays) return null;
  if (current.level > previous.level) return `+${DAILY_XP} XP · Level ${current.level} unlocked!`;
  const unlocked = current.badges.find((badge) => badge.earned && !previous.badges.find((item) => item.id === badge.id)?.earned);
  return unlocked ? `+${DAILY_XP} XP · ${unlocked.name} unlocked!` : `Daily check-in complete · +${DAILY_XP} XP`;
}
