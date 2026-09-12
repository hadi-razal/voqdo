import type { Entry } from '@/context/journal';

export const DAILY_XP = 20;
export const LEVEL_XP = 100;
export const LEVEL_NAMES = ['Seed', 'Sprout', 'Sapling', 'Bloom', 'Grove', 'Forest'];
const DAY = 86_400_000;

// Compare local calendar days as UTC ordinals, avoiding DST-length days.
function ordinal(ms: number) {
  const date = new Date(ms);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY;
}

export function habitProgress(entries: Pick<Entry, 'createdAt'>[], now = Date.now(), weeklyGoal = 3) {
  const today = ordinal(now);
  const days = [...new Set(entries.filter((entry) => Number.isFinite(entry.createdAt) && entry.createdAt <= now)
    .map((entry) => ordinal(entry.createdAt)).filter(Number.isFinite))].sort((a, b) => a - b);
  const completed = new Set(days);
  const monday = today - ((new Date(now).getDay() + 6) % 7);
  const weeklyDays = days.filter((day) => day >= monday).length;
  let bestStreak = 0;
  let run = 0;
  days.forEach((day, i) => { run = i > 0 && day === days[i - 1] + 1 ? run + 1 : 1; bestStreak = Math.max(bestStreak, run); });
  let cursor = completed.has(today) ? today : today - 1;
  let streak = 0;
  while (completed.has(cursor)) { streak++; cursor--; }
  const xp = days.length * DAILY_XP;
  const level = Math.floor(xp / LEVEL_XP) + 1;
  const badges = [
    { id: 'first', name: 'First page', description: 'Journal on your first day', value: days.length, target: 1 },
    { id: 'three', name: 'Finding rhythm', description: 'Journal on 3 different days', value: days.length, target: 3 },
    { id: 'streak', name: 'Steady steps', description: 'Build a 3-day streak', value: bestStreak, target: 3 },
    { id: 'seven', name: 'A little ritual', description: 'Journal on 7 different days', value: days.length, target: 7 },
    { id: 'week', name: 'Seven in a row', description: 'Build a 7-day streak', value: bestStreak, target: 7 },
    { id: 'month', name: 'Growing roots', description: 'Journal on 30 different days', value: days.length, target: 30 },
  ].map((badge) => ({ ...badge, earned: badge.value >= badge.target }));
  return {
    xp, level, levelName: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)],
    levelXp: xp % LEVEL_XP, nextLevelXp: LEVEL_XP - xp % LEVEL_XP,
    totalDays: days.length, todayDone: completed.has(today), weeklyDays, weeklyGoal,
    weeklyComplete: weeklyDays >= weeklyGoal, streak, bestStreak, badges,
  };
}

export function rewardMessage(before: Pick<Entry, 'createdAt'>[], after: Pick<Entry, 'createdAt'>[], now = Date.now()) {
  const previous = habitProgress(before, now);
  const current = habitProgress(after, now);
  if (current.totalDays <= previous.totalDays) return null;
  if (current.level > previous.level) return `+${DAILY_XP} XP · Level ${current.level} unlocked!`;
  const unlocked = current.badges.find((badge) => badge.earned && !previous.badges.find((item) => item.id === badge.id)?.earned);
  return unlocked ? `+${DAILY_XP} XP · ${unlocked.name} unlocked!` : `Daily check-in complete · +${DAILY_XP} XP`;
}
