/**
 * Merge rules for cloud sync. The device is the source of truth; the cloud is
 * a synced copy. Conflicts resolve by last writer wins on each item's own
 * timestamp (`updatedAt`, falling back to `createdAt`), and a local deletion
 * newer than a remote copy always wins.
 */

export type Stamped = { id: string; createdAt: number; updatedAt?: number };

/** Local deletions not yet confirmed by the server, as id → deleted-at ms. */
export type Tombstones = { entries: Record<string, number>; reflections: Record<string, number> };

export const EMPTY_TOMBSTONES: Tombstones = { entries: {}, reflections: {} };

export function stamp(item: Stamped): number {
  return item.updatedAt ?? item.createdAt;
}

export function mergeRemote<T extends Stamped>(
  local: T[],
  remote: T[],
  removed: { id: string; at: number }[],
  tombstones: Record<string, number>,
  combine: (local: T, remote: T) => T = (_, next) => next
): { items: T[]; changed: boolean } {
  const byId = new Map(local.map((item) => [item.id, item]));
  let changed = false;

  for (const next of remote) {
    const deletedAt = tombstones[next.id];
    if (deletedAt !== undefined && deletedAt >= stamp(next)) continue;
    const current = byId.get(next.id);
    if (!current || stamp(next) > stamp(current)) {
      byId.set(next.id, current ? combine(current, next) : next);
      changed = true;
    }
  }

  for (const { id, at } of removed) {
    const current = byId.get(id);
    if (current && stamp(current) <= at) {
      byId.delete(id);
      changed = true;
    }
  }

  if (!changed) return { items: local, changed };
  return { items: [...byId.values()].sort((a, b) => b.createdAt - a.createdAt), changed };
}

/** Drops tombstones the server has already accepted. */
export function pruneTombstones(tombstones: Tombstones, pushedUpTo: number): Tombstones {
  const keep = (record: Record<string, number>) =>
    Object.fromEntries(Object.entries(record).filter(([, at]) => at > pushedUpTo));
  return { entries: keep(tombstones.entries), reflections: keep(tombstones.reflections) };
}

export function parseTombstones(raw: string | null): Tombstones {
  if (!raw) return EMPTY_TOMBSTONES;
  try {
    const value = JSON.parse(raw) as Partial<Tombstones>;
    const clean = (record: unknown) =>
      record && typeof record === 'object'
        ? Object.fromEntries(
            Object.entries(record as Record<string, unknown>).filter(
              (pair): pair is [string, number] => typeof pair[1] === 'number' && Number.isFinite(pair[1])
            )
          )
        : {};
    return { entries: clean(value.entries), reflections: clean(value.reflections) };
  } catch {
    return EMPTY_TOMBSTONES;
  }
}
