import type { Analysis } from './analyze';
import { CATEGORY_KEYS } from '@/theme';

export async function requestAiAnalysis(body: string, signal: AbortSignal): Promise<Analysis & { analysisModel: string }> {
  const base = process.env.EXPO_PUBLIC_ANALYSIS_URL || (__DEV__ ? 'http://127.0.0.1:8787' : '');
  if (!base) throw new Error('AI is not configured for this build. Local suggestions are still available.');
  const response = await fetch(`${base.replace(/\/$/, '')}/analyze`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }), signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'AI is unavailable. Try again later.');
  const value = data.analysis;
  if (!value || typeof value.title !== 'string' || !value.title.trim() || typeof value.affirmation !== 'string'
    || !['Calm', 'Bright', 'Heavy', 'Restless', 'Tender'].includes(value.mood)
    || !Array.isArray(value.categories) || !value.categories.every((cat: unknown) => CATEGORY_KEYS.includes(cat as typeof CATEGORY_KEYS[number]))
    || !Array.isArray(value.emotions) || !value.emotions.every((emotion: unknown) => typeof emotion === 'string')
    || typeof data.model !== 'string') throw new Error('AI returned an invalid suggestion. Your draft is unchanged.');
  return { title: value.title, categories: value.categories, mood: value.mood, emotions: value.emotions, affirmation: value.affirmation, analysisModel: data.model };
}

export async function requestReflection(body: string, mode: import('./reflections').ReflectionMode, signal: AbortSignal) {
  const base = process.env.EXPO_PUBLIC_ANALYSIS_URL || (__DEV__ ? 'http://127.0.0.1:8787' : '');
  if (!base) throw new Error('AI is not configured for this build.');
  const response = await fetch(`${base.replace(/\/$/, '')}/reflect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, mode }), signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'AI is unavailable. Please try again later.');
  const { isReflection } = await import('./reflections');
  if (!isReflection(data.reflection) || typeof data.model !== 'string') throw new Error('The reflection was incomplete. Please try again.');
  const ids = JSON.parse(body).entries.map((entry: { id: string }) => entry.id);
  if (data.reflection.observations.some((item: { entryIds: string[] }) => item.entryIds.some((id) => !ids.includes(id)))) throw new Error('The reflection contained invalid source links.');
  return { reflection: data.reflection, model: data.model };
}
