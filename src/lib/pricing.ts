import type { IconName } from '@/icons';

export const MONTHLY_PRICE_USD = 4.99;
export const MONTHLY_PRICE_LABEL = `$${MONTHLY_PRICE_USD.toFixed(2)}`;

/** Dodo product id for VOQDO Pro (set DODO_PRODUCT_ID on the server). */
export const DODO_PRO_PRODUCT_HINT = 'pdt_0NoQJf8X4upapEuXzNF3b';

/** What VOQDO Pro includes — shown on the paywall and the Pro screen. */
export const PRO_BENEFITS: { icon: IconName; title: string }[] = [
  { icon: 'mic', title: 'Unlimited journaling by voice or writing' },
  { icon: 'sprout', title: 'Sprout keeps growing — streaks, shields, garden' },
  { icon: 'sparkle', title: 'AI suggestions and weekly reflections' },
  { icon: 'cloud', title: 'Cloud backup and sync across devices' },
  { icon: 'trend', title: 'Guided journeys and insights' },
];

export const TRIAL_COPY = `Free for 3 days, then ${MONTHLY_PRICE_LABEL}/month. Cancel anytime.`;
