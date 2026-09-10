import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Body,
  Card,
  Display,
  Kicker,
  PrimaryButton,
  Prose,
  Screen,
  TextButton,
  TopBar,
} from '@/components/vq';
import { useJournal } from '@/context/journal';
import { useToast } from '@/context/toast';
import { Icon, SparkIcon } from '@/icons';
import { formatDuration } from '@/lib/analyze';
import {
  CATEGORY_KEYS,
  catStyle,
  colors,
  font,
  gutter,
  moodStyle,
  pressedOpacity,
  radius,
  type CategoryKey,
} from '@/theme';

/**
 * What VOQDO understood, shown before anything is saved. The prose is fixed;
 * the tags are the part a person is most likely to want to correct.
 */
export default function Review() {
  const router = useRouter();
  const { draft, setDraft, saveDraft } = useJournal();
  const { toast } = useToast();

  // Saving and discarding both clear the draft, and this screen is still
  // mounted when they do — without this flag the guard below would race the
  // intended navigation and bounce the user Home instead.
  const leaving = useRef(false);

  // Landing here without a draft means the flow was interrupted.
  useEffect(() => {
    if (!draft && !leaving.current) router.replace('/');
  }, [draft, router]);

  if (!draft) return null;

  const mood = moodStyle(draft.mood);

  const toggle = (cat: CategoryKey) => {
    const on = draft.categories.includes(cat);
    setDraft({
      ...draft,
      categories: on
        ? draft.categories.filter((key) => key !== cat)
        : [...draft.categories, cat],
    });
  };

  const save = () => {
    leaving.current = true;
    const saved = saveDraft();
    if (!saved) {
      leaving.current = false;
      return;
    }
    router.replace(`/entry/${saved.id}`);
    toast('Entry saved');
  };

  const discard = () => {
    leaving.current = true;
    setDraft(null);
    router.replace('/');
  };

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={discard} />

      <View style={styles.head}>
        <Text style={styles.stamp}>
          Just now
          {draft.source === 'voice' ? ` · ${formatDuration(draft.durationMs)}` : ' · Written'}
        </Text>
        <Display size={28}>{draft.title}</Display>
      </View>

      <Prose style={styles.body}>{draft.body}</Prose>

      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <SparkIcon size={15} color={colors.accent} />
          <Kicker color={colors.accent}>AI-Categorized</Kicker>
        </View>
        <Body>Tap to add or remove a tag.</Body>

        <View style={styles.chips}>
          {CATEGORY_KEYS.map((cat) => {
            const on = draft.categories.includes(cat);
            const style = catStyle(cat);

            return (
              <Pressable
                key={cat}
                onPress={() => toggle(cat)}
                style={({ pressed }) => [
                  styles.chip,
                  on
                    ? { backgroundColor: style.bg, borderColor: style.bg }
                    : { backgroundColor: 'transparent', borderColor: colors.border },
                  pressed && { opacity: pressedOpacity },
                ]}
              >
                <Text style={[styles.chipText, { color: on ? style.color : colors.faint }]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Card style={styles.rows}>
        <View style={styles.row}>
          <Icon name="smile" size={18} color={colors.muted} strokeWidth={1.6} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Mood</Text>
            <Text style={[styles.rowValue, { color: mood.color }]}>{draft.mood}</Text>
          </View>
        </View>

        <View style={[styles.row, styles.rowDivider]}>
          <Icon name="heart" size={18} color={colors.muted} strokeWidth={1.6} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Recognized Emotion</Text>
            <Text style={styles.rowValue}>
              {draft.emotions.length ? draft.emotions.join(', ') : 'Not sure yet'}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton label="Save Entry" onPress={save} />
        <TextButton label="Discard" onPress={discard} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  head: { paddingHorizontal: gutter, gap: 8, marginTop: 6 },
  stamp: { fontFamily: font.body, fontSize: 12.5, color: colors.muted },
  body: { paddingHorizontal: gutter, marginTop: 16 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: gutter,
    marginVertical: 22,
  },
  section: { paddingHorizontal: gutter, gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontFamily: font.medium, fontSize: 12.5 },
  rows: { marginHorizontal: gutter, marginTop: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15, paddingHorizontal: 16 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowLabel: { fontFamily: font.body, fontSize: 11.5, color: colors.faint },
  rowValue: { fontFamily: font.medium, fontSize: 14.5, color: colors.text, marginTop: 2 },
  actions: { paddingHorizontal: gutter, marginTop: 22, gap: 2 },
});
