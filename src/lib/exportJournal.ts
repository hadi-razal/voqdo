import { Share } from 'react-native';
import type { Entry } from '@/context/journal';

/** Shares the whole journal as Markdown through the system share sheet. */
export async function exportJournal(entries: Entry[]): Promise<'empty' | 'shared'> {
  if (!entries.length) return 'empty';
  await Share.share({
    title: 'VOQDO journal',
    message: entries
      .map(
        (entry) =>
          `# ${entry.title}\n\n${new Date(entry.createdAt).toLocaleString()} · ${entry.mood}\n\n${entry.body}\n\nTags: ${entry.categories.join(', ')}`
      )
      .join('\n\n---\n\n'),
  });
  return 'shared';
}
