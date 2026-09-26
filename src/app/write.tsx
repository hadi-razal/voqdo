import { CHALLENGES } from '@/lib/challenges';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Kicker, PrimaryButton, TopBar } from '@/components/vq';
import { Mascot } from '@/components/Mascot';
import { Sky } from '@/components/Sky';
import { Icon } from '@/icons';
import { companionForWrite } from '@/lib/mascot';
import { useJournal } from '@/context/journal';
import { colors, font, gutter, MOODS, moodStyle, radius, tabularNums, type Mood } from '@/theme';

/** Typed counterpart to the recorder — same analysis, no microphone. */
export default function Write() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { composeDraft, setDraft, writing: text, setWriting: setText } = useJournal();
  const { prompt, challengeId, challengeStep, mood } = useLocalSearchParams<{
    prompt?: string;
    challengeId?: string;
    challengeStep?: string;
    mood?: string;
  }>();
  const journey = CHALLENGES.find((item) => item.id === challengeId);
  const step = Number(challengeStep);
  const isJourney =
    !!journey && Number.isInteger(step) && step >= 0 && step < journey.prompts.length;
  const chosenMood = MOODS.includes(mood as Mood) ? (mood as Mood) : null;
  const seededPrompt = useRef<string | null>(null);

  // If the editor is empty and a prompt arrived, seed it as a soft starter line.
  useEffect(() => {
    const next = typeof prompt === 'string' ? prompt.trim() : '';
    if (!next || seededPrompt.current === next) return;
    if (text.trim()) {
      seededPrompt.current = next;
      return;
    }
    seededPrompt.current = next;
    setText(`${next}\n\n`);
  }, [prompt, text, setText]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canSave = words >= 3;
  const companion = companionForWrite({ words, isJourney });

  const submit = () => {
    if (!canSave) return;
    const draft = composeDraft({ body: text.trim(), source: 'text', durationMs: 0, ...(isJourney ? { challengeId, challengeStep: step } : {}) });
    // A mood picked on Home is what the person said; it outranks keyword guesses.
    if (chosenMood) setDraft({ ...draft, mood: chosenMood });
    router.replace('/review');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: insets.top + 8 }]}
    >
      <Sky />
      <TopBar
        onBack={goBack}
        center={
          <View style={styles.counter}>
            <Text style={[styles.count, tabularNums]}>
              {words} {words === 1 ? 'word' : 'words'}
            </Text>
          </View>
        }
      />

      <View style={styles.head}>
        <Mascot pose={companion.pose} size={64} bounce={Math.floor(words / 10)} />
        <View style={{ flex: 1, gap: 4 }}>
          <Kicker color={isJourney ? colors.success : colors.accent}>
            {isJourney ? `${journey.title.toUpperCase()} · DAY ${step + 1}/3` : chosenMood ? `FEELING ${chosenMood.toUpperCase()}` : 'NEW PAGE'}
          </Kicker>
          <Text style={styles.companion}>{companion.line}</Text>
        </View>
        {chosenMood && <View style={[styles.moodDot, { backgroundColor: moodStyle(chosenMood).color }]} />}
      </View>

      <View style={styles.paper}>
        <TextInput
          accessibilityLabel="Journal text"
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          placeholder="Today was…"
          placeholderTextColor={colors.faint}
          style={styles.input}
          textAlignVertical="top"
          selectionColor={colors.accent}
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.meta}>
          <Icon name="lock" size={13} color={colors.faint} strokeWidth={2} />
          <Text style={styles.hint}>
            {canSave ? 'Saved on this device as you type.' : 'A few more words and it’s ready.'}
          </Text>
        </View>
        <PrimaryButton label="Continue" icon="arrowRight" onPress={submit} disabled={!canSave} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  counter: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.cardStrong,
  },
  count: { fontFamily: font.medium, fontSize: 12.5, color: colors.muted },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: gutter, marginTop: 4, marginBottom: 12 },
  companion: { fontFamily: font.medium, fontSize: 15, lineHeight: 21, color: colors.text },
  moodDot: { width: 12, height: 12, borderRadius: 6 },
  paper: {
    flex: 1,
    marginHorizontal: gutter,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontFamily: font.displayRegular,
    fontSize: 17.5,
    lineHeight: 29,
    color: colors.text,
    ...Platform.select({ web: { outlineStyle: 'none' } as object }),
  },
  footer: { paddingHorizontal: gutter, paddingTop: 12, gap: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center' },
  hint: { fontFamily: font.body, fontSize: 12.5, color: colors.faint },
});
