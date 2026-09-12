import type { Entry } from '@/context/journal';

export const CHALLENGES = [
  { id: 'gratitude', title: 'Notice the good', description: 'Three days of small things worth keeping.', prompts: ['What small comfort made today better?', 'Who made a difference to your day, and how?', 'What is something ordinary you would miss if it were gone?'] },
  { id: 'growth', title: 'Small brave steps', description: 'Make room for effort, learning, and progress.', prompts: ['What did you try today, even if it felt awkward?', 'What did a recent mistake teach you?', 'What is one small step you want to take next?'] },
  { id: 'care', title: 'A kinder rhythm', description: 'Three gentle check-ins with yourself.', prompts: ['What gave you energy today, and what used it up?', 'Where could you give yourself a little more room?', 'What would taking care of yourself look like tomorrow?'] },
] as const;
export type ChallengeEntry = Pick<Entry, 'createdAt'> & { challengeId?: string; challengeStep?: number };
const key = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

export function challengeProgress(entries: ChallengeEntry[], id: string, now: number) {
  const challenge = CHALLENGES.find((item) => item.id === id);
  if (!challenge) return null;
  const valid = entries.filter((entry) => entry.challengeId === id && entry.createdAt <= now).sort((a, b) => a.createdAt - b.createdAt);
  const days = new Set<string>();
  let completed = 0;
  for (const entry of valid) {
    const day = key(entry.createdAt);
    if (entry.challengeStep === completed && !days.has(day) && completed < challenge.prompts.length) {
      days.add(day); completed++;
    }
  }
  return { challenge, completed, done: completed === challenge.prompts.length, todayDone: days.has(key(now)) };
}
