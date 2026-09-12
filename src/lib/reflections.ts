export type ReflectionMode = 'recap' | 'next-step' | 'question';
export type Reflection = { summary: string; observations: { text: string; entryIds: string[] }[]; question: string; action: string };
export type SavedReflection = Reflection & { id: string; createdAt: number; mode: ReflectionMode; model: string; sourceIds: string[] };
export function isReflection(value: unknown): value is Reflection {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return ['summary', 'question', 'action'].every((key) => typeof data[key] === 'string' && !!data[key]) && Array.isArray(data.observations)
    && data.observations.every((item) => item && typeof item.text === 'string' && Array.isArray(item.entryIds) && item.entryIds.every((id: unknown) => typeof id === 'string'));
}
export function parseSavedReflections(raw: string | null): SavedReflection[] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('Invalid saved reflections');
  return value.filter((item): item is SavedReflection => {
    if (!isReflection(item)) return false;
    const meta = item as Reflection & Partial<SavedReflection>;
    return typeof meta.id === 'string' && Number.isFinite(meta.createdAt)
      && ['recap', 'next-step', 'question'].includes(meta.mode ?? '') && typeof meta.model === 'string'
      && Array.isArray(meta.sourceIds) && meta.sourceIds.every((id: unknown) => typeof id === 'string');
  });
}
