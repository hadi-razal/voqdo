import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  Body,
  Card,
  Display,
  Kicker,
  PrimaryButton,
  Screen,
  TextButton,
  TopBar,
} from '@/components/vq';
import { useJournal } from '@/context/journal';
import { useToast } from '@/context/toast';
import { Icon, SparkIcon } from '@/icons';
import { confirmDestructive } from '@/lib/confirm';
import { formatDuration } from '@/lib/analyze';
import { challengeProgress } from '@/lib/challenges';
import { rewardMessage } from '@/lib/habits';
import { requestAiAnalysis } from '@/lib/remoteAnalysis';
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
  const { draft, setDraft, saveDraft, setWriting, entries } = useJournal();
  const { toast } = useToast();

  // Saving and discarding both clear the draft, and this screen is still
  // mounted when they do — without this flag the guard below would race the
  // intended navigation and bounce the user Home instead.
  const leaving = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');
  const aiRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { aiRequest.current?.abort(); }, []);

  // Landing here without a draft means the flow was interrupted.
  useEffect(() => {
    if (!draft && !leaving.current) router.replace('/');
  }, [draft, router]);

  if (!draft) return null;

  const mood = moodStyle(draft.mood);

  const askAi = async () => {
    if (aiRequest.current || isSaving || !draft.body.trim()) return;
    const controller = new AbortController();
    aiRequest.current = controller;
    setIsAnalyzing(true);
    setAiError('');
    const timer = setTimeout(() => controller.abort(), 25_000);
    try {
      const analysis = await requestAiAnalysis(draft.body, controller.signal);
      if (!controller.signal.aborted && !leaving.current) setDraft({ ...draft, ...analysis });
    } catch (error) {
      if (!leaving.current) setAiError(controller.signal.aborted
        ? 'AI took too long. Your draft is unchanged; you can save it or try again.'
        : error instanceof Error ? error.message : 'AI is unavailable. Your draft is unchanged.');
    } finally {
      clearTimeout(timer);
      aiRequest.current = null;
      if (!leaving.current) setIsAnalyzing(false);
    }
  };

  const toggle = (cat: CategoryKey) => {
    const on = draft.categories.includes(cat);
    setDraft({
      ...draft,
      categories: on
        ? draft.categories.filter((key) => key !== cat)
        : [...draft.categories, cat],
    });
  };

  const save = async () => {
    if (leaving.current || aiRequest.current) return;
    leaving.current = true;
    setIsSaving(true);
    const saved = await saveDraft();
    if (!saved) {
      leaving.current = false;
      setIsSaving(false);
      toast('Could not save. Your draft is still here; please try again.');
      return;
    }
    router.replace(`/entry/${saved.id}`);
    const journey = saved.challengeId ? challengeProgress([saved, ...entries], saved.challengeId, Date.now()) : null;
    toast(draft.editingId ? 'Entry updated' : journey?.done ? 'Journey complete · badge earned!' : rewardMessage(entries, [saved, ...entries]) ?? 'Entry saved');
  };

  const discard = () => confirmDestructive({
    title: draft.editingId ? 'Discard changes?' : 'Discard this draft?',
    message: draft.editingId ? 'Your original entry will stay unchanged.' : 'This draft has not been saved.',
    confirmLabel: 'Discard',
    onConfirm: () => {
      if (leaving.current) return;
      leaving.current = true;
      aiRequest.current?.abort();
      if (!draft.editingId && draft.source === 'text') setWriting('');
      setDraft(null);
      router.replace(draft.editingId ? `/entry/${draft.editingId}` : '/');
    },
  });

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={discard} />

      <View style={styles.head}>
        <Text style={styles.stamp}>
          Just now
          {draft.source === 'voice' ? ` · ${formatDuration(draft.durationMs)}` : ' · Written'}
        </Text>
        <Display size={28}>{draft.editingId ? 'Edit your entry' : 'Make it yours'}</Display>
        <Body>Correct your words and choose the mood that fits.</Body>
        <TextInput editable={!isSaving && !isAnalyzing} accessibilityLabel="Entry title" value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} style={styles.titleInput} placeholder="Entry title" placeholderTextColor={colors.faint} />
      </View>

      <TextInput editable={!isSaving && !isAnalyzing} accessibilityLabel="Entry text" multiline textAlignVertical="top" value={draft.body} onChangeText={(body) => setDraft({ ...draft, body, analysisModel: undefined })} style={styles.bodyInput} />

      <View style={[styles.section, { marginTop: 18 }]}>
        <PrimaryButton label={isAnalyzing ? 'Thinking…' : 'Generate AI suggestions'} disabled={isSaving || isAnalyzing || !draft.body.trim() || draft.body.length > 6000} onPress={askAi} />
        <Body>Uses a small AI model for your title, mood, tags, and reflection. Only this entry’s text is sent to OpenRouter and its model provider when you tap.</Body>
        {draft.body.length > 6000 && <Body>AI supports up to 6,000 characters. You can still save your full entry with local suggestions.</Body>}
        {!!aiError && <Body style={{ color: colors.warn }}>{aiError}</Body>}
      </View>
      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <SparkIcon size={15} color={colors.accent} />
          <Kicker color={colors.accent}>Suggested tags</Kicker>
        </View>
        <Body>{draft.analysisModel ? `AI suggestions · ${draft.analysisModel === "google/gemma-3-4b-it" ? "Gemma 3 4B" : "Small model"}. Review and adjust before saving.` : "Suggested from keywords on this device. Tap to adjust."}</Body>

        <View style={styles.chips}>
          {CATEGORY_KEYS.map((cat) => {
            const on = draft.categories.includes(cat);
            const style = catStyle(cat);

            return (
              <Pressable
                key={cat}
                disabled={isAnalyzing || isSaving}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
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

      <View style={[styles.section, { marginTop: 18 }]}>
        <Kicker>HOW DID IT FEEL?</Kicker>
        <View style={styles.chips}>
          {(['Calm', 'Bright', 'Heavy', 'Restless', 'Tender'] as const).map((value) => (
            <Pressable disabled={isAnalyzing || isSaving} key={value} accessibilityRole="button" accessibilityState={{ selected: draft.mood === value }} onPress={() => setDraft({ ...draft, mood: value })} style={[styles.chip, { borderColor: draft.mood === value ? moodStyle(value).color : colors.border, backgroundColor: draft.mood === value ? moodStyle(value).bg : 'transparent' }]}>
              <Text style={[styles.chipText, { color: moodStyle(value).color }]}>{value}</Text>
            </Pressable>
          ))}
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
        <PrimaryButton label={isSaving ? "Saving…" : draft.editingId ? "Save changes" : "Save Entry"} disabled={isSaving || isAnalyzing || !draft.body.trim() || !draft.title.trim()} onPress={save} />
        <TextButton label="Discard" onPress={discard} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleInput: { fontFamily: font.display, fontSize: 22, color: colors.text, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  bodyInput: { marginHorizontal: gutter, marginTop: 16, padding: 14, minHeight: 150, borderRadius: 14, backgroundColor: colors.surface, fontFamily: font.body, fontSize: 16, lineHeight: 26, color: colors.text },
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
