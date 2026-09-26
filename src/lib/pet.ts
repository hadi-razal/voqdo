/**
 * Sprout, the companion who grows with the journal.
 *
 * Everything here is derived from saved journaling days, so there is nothing
 * extra to store and nothing to lose: delete a day and Sprout simply reflects
 * the journal as it now is. Sprout never dies or regresses a stage — being
 * away only makes it sleepy.
 */

export type SproutStage = 'seed' | 'sprout' | 'bud' | 'bloom' | 'grove';

export const STAGES: { id: SproutStage; name: string; days: number; blurb: string }[] = [
  { id: 'seed', name: 'Seed', days: 0, blurb: 'A tiny seed, waiting for a first page.' },
  { id: 'sprout', name: 'Sprout', days: 1, blurb: 'Two small leaves. The ritual has begun.' },
  { id: 'bud', name: 'Bud', days: 5, blurb: 'Something is getting ready to open.' },
  { id: 'bloom', name: 'Bloom', days: 14, blurb: 'A full flower, grown from honest pages.' },
  { id: 'grove', name: 'Grove', days: 30, blurb: 'A little tree spirit with deep roots.' },
];

export function stageFor(totalDays: number): SproutStage {
  let current: SproutStage = 'seed';
  for (const stage of STAGES) if (totalDays >= stage.days) current = stage.id;
  return current;
}

export function stageInfo(totalDays: number) {
  const index = STAGES.findIndex((stage) => stage.id === stageFor(totalDays));
  const stage = STAGES[index];
  const next = STAGES[index + 1] ?? null;
  const span = next ? next.days - stage.days : 1;
  const into = next ? totalDays - stage.days : 1;
  return {
    stage,
    index,
    next,
    daysToNext: next ? next.days - totalDays : 0,
    pct: next ? Math.max(0, Math.min(1, into / span)) : 1,
  };
}

export type PetEnergy = 'thriving' | 'happy' | 'sleepy' | 'dozing';

/** How lively Sprout is, from whole days since the last page. */
export function petEnergy(daysAway: number | null, todayDone: boolean): PetEnergy {
  if (todayDone) return 'thriving';
  if (daysAway === null || daysAway <= 1) return 'happy';
  if (daysAway <= 3) return 'sleepy';
  return 'dozing';
}

/** The stage reached by adding a day, if saving one would grow Sprout. */
export function grewTo(beforeDays: number, afterDays: number): SproutStage | null {
  const before = stageFor(beforeDays);
  const after = stageFor(afterDays);
  return before === after ? null : after;
}
