export type MoodName = 'Calm' | 'Bright' | 'Heavy' | 'Restless' | 'Tender';

export const MASCOT_POSES = [
  'journal',
  'heart',
  'cheer',
  'nap',
  'wonder',
  'think',
  'listen',
  'laptop',
  'cocoa',
  'hello',
  'weep',
  'sleep',
  'wink',
  'shy',
  'study',
  'grow',
  'storm',
  'party',
  'rest',
  'peek',
  'star',
  'ponder',
  'bloom',
  'wave',
] as const;

export type MascotPose = (typeof MASCOT_POSES)[number];

export const MASCOT_LABELS: Record<MascotPose, string> = {
  journal: 'Writing',
  heart: 'Grateful',
  cheer: 'Celebrating',
  nap: 'Resting',
  wonder: 'Curious',
  think: 'Thinking',
  listen: 'Listening',
  laptop: 'Looking closer',
  cocoa: 'Warming up',
  hello: 'Saying hi',
  weep: 'Sitting with it',
  sleep: 'Sleepy',
  wink: 'Playful',
  shy: 'Tender',
  study: 'Reading',
  grow: 'Growing',
  storm: 'Stirred',
  party: 'Cheering you on',
  rest: 'Tired',
  peek: 'Checking in',
  star: 'Proud',
  ponder: 'Reflecting',
  bloom: 'Soft',
  wave: 'Waving',
};

export function mascotForMood(mood: MoodName): MascotPose {
  switch (mood) {
    case 'Calm':
      return 'listen';
    case 'Bright':
      return 'cheer';
    case 'Heavy':
      return 'weep';
    case 'Restless':
      return 'storm';
    case 'Tender':
      return 'heart';
  }
}

export type CompanionInput = {
  hour?: number;
  wroteToday: boolean;
  streak: number;
  weeklyComplete: boolean;
  empty: boolean;
  name?: string;
  /** Whole days since the last saved page. */
  daysAway?: number | null;
};

export type CompanionMoment = {
  pose: MascotPose;
  line: string;
  taps: string[];
};

/** Pick a pose and a few tap-lines from the person's day. */
export function companionMoment({
  hour = new Date().getHours(),
  wroteToday,
  streak,
  weeklyComplete,
  empty,
  name,
  daysAway,
}: CompanionInput): CompanionMoment {
  const who = name?.trim() && name.trim() !== 'You' ? name.trim() : 'you';

  if (empty) {
    return {
      pose: 'peek',
      line: 'I’ll keep a page open.',
      taps: ['No rush. I’m here.', 'A few honest lines is plenty.', 'Tap the plus when you’re ready.'],
    };
  }

  if (!wroteToday && daysAway != null && daysAway >= 2) {
    return {
      pose: daysAway >= 4 ? 'sleep' : 'nap',
      line: who === 'you' ? 'Oh — you’re back! I missed you.' : `Oh — ${who}! I missed you.`,
      taps: ['I kept your pages safe.', 'One line wakes me right up.', 'No catching up needed. Just today.'],
    };
  }

  if (weeklyComplete) {
    return {
      pose: 'party',
      line: 'Week complete. That’s a ritual.',
      taps: [`Nice work, ${who}.`, 'Rest if you want. Extra pages are optional.', 'Your garden is growing.'],
    };
  }

  if (wroteToday) {
    return {
      pose: streak >= 3 ? 'star' : 'heart',
      line: streak >= 3 ? `${streak}-day streak. Quietly proud.` : 'You showed up today.',
      taps: ['That page is yours.', 'Come back whenever.', 'Want another line? The plus is waiting.'],
    };
  }

  if (hour < 6 || hour >= 22) {
    return {
      pose: hour >= 23 || hour < 5 ? 'sleep' : 'nap',
      line: 'Even night pages count.',
      taps: ['A sentence is enough.', 'I’ll wait here.', 'Sleep well after, if you can.'],
    };
  }

  if (hour < 11) {
    return {
      pose: 'cocoa',
      line: 'Morning. One small page?',
      taps: ['Warm up with whatever’s true.', 'I’m listening when you are.', 'No perfect opening required.'],
    };
  }

  if (hour < 17) {
    return {
      pose: 'hello',
      line: `Hi ${who}. Ready when you are.`,
      taps: ['Tap me again — I like the company.', 'A messy page still counts.', 'Voice or writing. Your call.'],
    };
  }

  return {
    pose: 'think',
    line: 'What do you want to set down?',
    taps: ['The day can live here.', 'Heavy or light — both belong.', 'I’m still here.'],
  };
}

export function companionForMood(mood: MoodName): CompanionMoment {
  switch (mood) {
    case 'Calm':
      return {
        pose: 'listen',
        line: 'I’ll stay quiet with you.',
        taps: ['Calm can be a whole page.', 'Nothing to fix. Just this.', 'We can sit here a while.'],
      };
    case 'Bright':
      return {
        pose: 'cheer',
        line: 'That light looks good on you.',
        taps: ['Keep a little of this for later.', 'Joy belongs in the journal too.', 'I’m cheering quietly.'],
      };
    case 'Heavy':
      return {
        pose: 'weep',
        line: 'You don’t have to carry it alone on the page.',
        taps: ['Heavy still counts.', 'One honest sentence is enough.', 'I’m here. No rush.'],
      };
    case 'Restless':
      return {
        pose: 'storm',
        line: 'We’ll sit through the weather.',
        taps: ['Restless energy can live here.', 'You don’t have to settle it first.', 'The page can hold the pace.'],
      };
    case 'Tender':
      return {
        pose: 'shy',
        line: 'Soft things belong here too.',
        taps: ['Tender is not too much.', 'I’ll be gentle with this page.', 'A small heart still counts.'],
      };
  }
}

export function companionForWrite({
  words,
  isJourney,
}: {
  words: number;
  isJourney?: boolean;
}): CompanionMoment {
  if (words <= 0) {
    return {
      pose: isJourney ? 'grow' : 'journal',
      line: isJourney ? 'One small step on the path.' : 'A few honest lines is plenty.',
      taps: ['No perfect opening required.', 'Start anywhere true.', 'I’m writing with you.'],
    };
  }
  if (words < 3) {
    return {
      pose: 'think',
      line: 'Keep going — almost a page.',
      taps: ['Two more words and we can save this.', 'Messy is welcome.', 'I’m still listening.'],
    };
  }
  return {
    pose: 'cheer',
    line: isJourney ? 'Journey step ready to keep.' : 'That’s enough. Continue when you’re ready.',
    taps: ['You showed up. That is the ritual.', 'Edit later if you want.', 'I’m proud of this page.'],
  };
}

export function companionForProgress({
  todayDone,
  weeklyComplete,
  streak,
  totalDays,
}: {
  todayDone: boolean;
  weeklyComplete: boolean;
  streak: number;
  totalDays: number;
}): CompanionMoment {
  if (weeklyComplete) {
    return {
      pose: 'party',
      line: 'Week complete. The garden noticed.',
      taps: ['Rest is part of the ritual.', 'Extra pages are optional.', 'Come back whenever you like.'],
    };
  }
  if (todayDone) {
    return {
      pose: streak >= 3 ? 'star' : 'bloom',
      line: streak >= 3 ? `${streak}-day streak. Quietly proud.` : 'Today’s page is in the garden.',
      taps: ['Take that good feeling with you.', 'Your XP is already earned.', 'Want another line? That’s extra, not required.'],
    };
  }
  if (totalDays === 0) {
    return {
      pose: 'grow',
      line: 'First page, first sprout.',
      taps: ['One check-in starts the garden.', '+20 XP when you save today.', 'I’ll wait right here.'],
    };
  }
  return {
    pose: 'grow',
    line: 'One page grows the garden.',
    taps: ['+20 XP for showing up today.', 'Streaks can restart. XP stays.', 'A small entry still counts.'],
  };
}

export function companionForChallenge({
  completedBest,
  anyDone,
}: {
  completedBest: number;
  anyDone: boolean;
}): CompanionMoment {
  if (anyDone) {
    return {
      pose: 'party',
      line: 'A journey finished. Badge earned.',
      taps: ['Three days of care, kept.', 'Start another whenever you like.', 'Your garden likes this.'],
    };
  }
  if (completedBest > 0) {
    return {
      pose: 'grow',
      line: `${completedBest}/3 days on the path.`,
      taps: ['Breaks are allowed. Progress waits.', 'Next prompt is ready when you are.', 'Small shifts still count.'],
    };
  }
  return {
    pose: 'wonder',
    line: 'Pick a small shift. Three days.',
    taps: ['One prompt a day is enough.', 'You can pause anytime.', 'I’ll walk it with you.'],
  };
}

export function companionForRecord({
  error,
  processing,
}: {
  error?: boolean;
  processing?: boolean;
}): CompanionMoment {
  if (error) {
    return {
      pose: 'rest',
      line: 'Couldn’t hear that. We can try again.',
      taps: ['Writing works too.', 'No page was lost.', 'I’m still here.'],
    };
  }
  if (processing) {
    return {
      pose: 'think',
      line: 'Holding what you said…',
      taps: ['Almost there.', 'Nothing leaves this device yet.', 'I’m gathering the page.'],
    };
  }
  return {
    pose: 'listen',
    line: 'I’m listening. Speak freely.',
    taps: ['Take your time.', 'Silence is fine too.', 'Tap stop when you’re done.'],
  };
}
