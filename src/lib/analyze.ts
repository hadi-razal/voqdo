import { CATEGORY_KEYS, type CategoryKey, type Mood } from '@/theme';

export type Analysis = {
  title: string;
  categories: CategoryKey[];
  mood: Mood;
  emotions: string[];
  affirmation: string;
};

/**
 * On-device understanding of a journal entry.
 *
 * Everything here is a pure function of the text: cue-word scoring picks the
 * categories and emotions, and the title/affirmation are chosen from curated
 * lines so the same entry always reads the same way. Swapping in a hosted
 * model later means replacing `analyzeEntry` and nothing else.
 */

const cue = (...words: string[]) => new RegExp(`\\b(${words.join('|')})\\b`, 'i');

type Rule = { cat: CategoryKey; weight: number; cues: RegExp };

const RULES: Rule[] = [
  {
    cat: 'Gratitude',
    weight: 1.3,
    cues: cue(
      'grateful',
      'gratitude',
      'thankful',
      'thanks',
      'glad',
      'lucky',
      'appreciate',
      'appreciated',
      'blessed',
      'proud of',
      'good thing',
      'made my day',
      'best part'
    ),
  },
  {
    cat: 'Self-Care',
    weight: 1.0,
    cues: cue(
      'rest',
      'rested',
      'nap',
      'sleep',
      'slept',
      'walk',
      'walked',
      'gym',
      'workout',
      'exercise',
      'yoga',
      'stretch',
      'meditat',
      'breathe',
      'breathing',
      'took time for myself',
      'time for myself',
      'self care',
      'self-care',
      'bath',
      'break',
      'unplugged',
      'slowed down',
      'ate well',
      'water'
    ),
  },
  {
    cat: 'Mindset',
    weight: 1.0,
    cues: cue(
      'mindset',
      'perspective',
      'reminded myself',
      'told myself',
      'realised',
      'realized',
      'reframe',
      'let go',
      'letting go',
      'accept',
      'accepted',
      'patience',
      'patient',
      'focus',
      'present',
      'mindful',
      'calm',
      'centered',
      'grounded',
      'clarity'
    ),
  },
  {
    cat: 'Personal Growth',
    weight: 1.1,
    cues: cue(
      'progress',
      'growth',
      'grew',
      'learned',
      'learning',
      'improve',
      'improved',
      'better at',
      'step',
      'steps',
      'goal',
      'goals',
      'habit',
      'discipline',
      'pushed myself',
      'challenge',
      'challenged',
      'proud of how',
      'showed up',
      'kept going',
      'small wins'
    ),
  },
  {
    cat: 'Anxiety',
    weight: 1.4,
    cues: cue(
      'anxious',
      'anxiety',
      'worried',
      'worry',
      'worrying',
      'stressed',
      'stress',
      'stressing',
      'overwhelmed',
      'overwhelming',
      'overthink',
      'overthinking',
      'panic',
      'panicking',
      'racing',
      'nervous',
      'dread',
      'tense',
      'on edge',
      'spiralling',
      'spiraling',
      'racing thoughts',
      'restless',
      'afraid',
      'scared',
      'pressure'
    ),
  },
  {
    cat: 'Relationships',
    weight: 1.2,
    cues: cue(
      'friend',
      'friends',
      'family',
      'mom',
      'mum',
      'dad',
      'sister',
      'brother',
      'wife',
      'husband',
      'partner',
      'girlfriend',
      'boyfriend',
      'colleague',
      'team',
      'called',
      'texted',
      'talked to',
      'spoke to',
      'coffee with',
      'dinner with',
      'lunch with',
      'caught up',
      'together',
      'people who'
    ),
  },
  {
    cat: 'Reflection',
    weight: 0.5,
    cues: cue(
      'thinking about',
      'thought about',
      'looking back',
      'wonder',
      'wondering',
      'notice',
      'noticed',
      'today was',
      'lately',
      'keep coming back',
      'sat with',
      'honest',
      'looking back on'
    ),
  },
];

type EmotionRule = { label: string; cues: RegExp };

const EMOTIONS: EmotionRule[] = [
  { label: 'Grateful', cues: cue('grateful', 'thankful', 'appreciate', 'appreciated', 'blessed', 'lucky') },
  { label: 'Hopeful', cues: cue('hopeful', 'hope', 'looking forward', 'optimistic', 'excited for', 'better tomorrow') },
  { label: 'Proud', cues: cue('proud', 'accomplished', 'achieved', 'pleased with', 'did well') },
  { label: 'Calm', cues: cue('calm', 'peaceful', 'settled', 'at ease', 'quiet', 'still', 'grounded') },
  { label: 'Anxious', cues: cue('anxious', 'anxiety', 'nervous', 'worried', 'worrying', 'on edge', 'dread', 'panic', 'racing') },
  { label: 'Overwhelmed', cues: cue('overwhelmed', 'too much', 'a lot', 'drowning', 'buried', 'swamped') },
  { label: 'Tired', cues: cue('tired', 'exhausted', 'drained', 'worn out', 'no energy', 'burnt out') },
  { label: 'Lonely', cues: cue('lonely', 'alone', 'isolated', 'missing', 'disconnected') },
  { label: 'Content', cues: cue('content', 'satisfied', 'enough', 'okay', 'fine', 'good day') },
  { label: 'Frustrated', cues: cue('frustrated', 'annoyed', 'irritated', 'angry', 'fed up') },
];

const POSITIVE = cue(
  'good',
  'great',
  'glad',
  'happy',
  'grateful',
  'proud',
  'calm',
  'best',
  'loved',
  'lucky',
  'beautiful',
  'excited',
  'better',
  'hopeful',
  'peaceful',
  'enjoyed'
);

const NEGATIVE = cue(
  'bad',
  'sad',
  'tired',
  'exhausted',
  'stressed',
  'anxious',
  'angry',
  'frustrated',
  'overwhelmed',
  'lonely',
  'worried',
  'guilty',
  'failed',
  'behind',
  'hard',
  'awful',
  'worse',
  'heavy'
);

const RESTLESS = cue('restless', 'racing', 'can’t sleep', 'cant sleep', 'on edge', 'wired', 'unsettled');
const TENDER = cue('tender', 'soft', 'gentle', 'vulnerable', 'emotional', 'cried', 'missing', 'love');

/** Titles read like chapter headings — one set per dominant category. */
const TITLES: Record<CategoryKey, string[]> = {
  Gratitude: ['A Grateful Day', 'Small Good Things', 'Something to Hold On To', 'The Good Parts'],
  'Self-Care': ['Making Room for Me', 'A Gentler Pace', 'Taking Care', 'Slowing Down'],
  Mindset: ['A Calmer Mind', 'Shifting the Frame', 'Choosing How to See It', 'Steady Thinking'],
  'Personal Growth': ['One Step Further', 'Progress, Quietly', 'Growing Through It', 'Small Steps Count'],
  Anxiety: ['Sitting With It', 'A Heavy Hour', 'Riding It Out', 'The Noise in My Head'],
  Relationships: ['People Who Matter', 'Time Together', 'Held by Others', 'Someone in Mind'],
  Reflection: ['A Quiet Look Back', 'Thinking It Through', 'Honest Lines', 'What Today Held'],
};

/** Closing line on the entry screen — warm, never instructive. */
const AFFIRMATIONS: Record<CategoryKey, string> = {
  Gratitude:
    'Noticing what went well is its own kind of strength, and you did that today.',
  'Self-Care':
    'Looking after yourself is not a detour from the work — it is the work.',
  Mindset:
    'You’re becoming a more mindful version of yourself, and that’s something beautiful.',
  'Personal Growth':
    'Progress does not always have to be big. Small steps still count, and you took one.',
  Anxiety:
    'Naming what weighs on you is how it starts to lose its grip. You did the hard part.',
  Relationships:
    'The people you make room for are part of how you take care of yourself too.',
  Reflection:
    'Sitting honestly with your own day is a quiet act of courage.',
};

export function analyzeEntry(text: string): Analysis {
  const clean = text.trim();

  if (!clean) {
    return {
      title: 'Untitled Entry',
      categories: [],
      mood: 'Calm',
      emotions: [],
      affirmation: AFFIRMATIONS.Reflection,
    };
  }

  const scored = RULES.map((rule) => ({
    cat: rule.cat,
    score: countMatches(clean, rule.cues) * rule.weight,
  })).filter((entry) => entry.score > 0);

  scored.sort(
    (a, b) => b.score - a.score || CATEGORY_KEYS.indexOf(a.cat) - CATEGORY_KEYS.indexOf(b.cat)
  );

  // Five chips is what the card can show without wrapping past two rows.
  // An entry that matched nothing still gets one tag, so it is never orphaned.
  const matched = scored.slice(0, 5).map((entry) => entry.cat);
  const categories: CategoryKey[] = matched.length > 0 ? matched : ['Reflection'];
  const dominant = categories[0];

  const emotions = EMOTIONS.filter((rule) => rule.cues.test(clean))
    .map((rule) => rule.label)
    .slice(0, 3);

  return {
    title: pick(TITLES[dominant], clean),
    categories,
    mood: detectMood(clean),
    emotions,
    affirmation: AFFIRMATIONS[dominant],
  };
}

function detectMood(text: string): Mood {
  const pos = countMatches(text, POSITIVE);
  const neg = countMatches(text, NEGATIVE);

  if (RESTLESS.test(text)) return 'Restless';
  if (TENDER.test(text) && neg <= pos) return 'Tender';
  if (neg > pos + 1) return 'Heavy';
  if (pos > neg + 1) return 'Bright';
  return 'Calm';
}

function countMatches(text: string, pattern: RegExp): number {
  const global = new RegExp(pattern.source, 'gi');
  return (text.match(global) ?? []).length;
}

/** Stable choice: the same text always yields the same title. */
function pick<T>(options: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return options[Math.abs(hash) % options.length];
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
