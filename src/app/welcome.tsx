import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mascot } from '@/components/Mascot';
import { Sky } from '@/components/Sky';
import { Body, Display, PrimaryButton, TextButton } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { Icon } from '@/icons';
import type { MascotPose } from '@/lib/mascot';
import { onboardingExit } from '@/lib/onboarding';
import { TRIAL_COPY } from '@/lib/pricing';
import { colors, font, gutter, radius } from '@/theme';

const GOALS = [
  { value: 3 as const, title: 'Gently', body: '3 nights a week' },
  { value: 5 as const, title: 'Steadily', body: '5 nights a week' },
  { value: 7 as const, title: 'Every night', body: 'A daily ritual' },
];

const STEP_POSES: MascotPose[] = ['hello', 'shy', 'grow'];

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useJournal();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.name === 'You' ? '' : settings.name);
  const [goal, setGoal] = useState<3 | 5 | 7>(settings.weeklyGoal);
  const [bounce, setBounce] = useState(0);

  const next = () => {
    setBounce((n) => n + 1);
    setStep((n) => n + 1);
  };

  const finish = (writeNow: boolean) => {
    onboardingExit.pending = true;
    updateSettings({ onboarded: true, weeklyGoal: goal, name: name.trim().slice(0, 40) || 'You' });
    // The editor falls back to Home when closed, so one replace covers both paths.
    if (writeNow) router.replace({ pathname: '/write', params: { prompt: 'What’s one thing on your mind tonight?' } });
    else router.replace('/');
  };

  const who = name.trim();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <Sky />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotOn, i < step && { backgroundColor: colors.success }]} />
          ))}
        </View>

        <View style={styles.hero}>
          <View style={styles.glow} />
          <Pressable onPress={() => setBounce((n) => n + 1)} accessibilityRole="button" accessibilityLabel="Sprout">
            <Mascot pose={STEP_POSES[step]} size={step === 0 ? 210 : 170} bounce={bounce} stage={step === 2 ? 'sprout' : 'seed'} />
          </Pressable>
        </View>

        {step === 0 && (
          <View style={styles.block}>
            <Text style={styles.wordmark}>voqdo</Text>
            <Display size={27} style={styles.center}>Meet Sprout, your{'\n'}nightly journal buddy</Display>
            <Body style={styles.center}>
              Speak or write a few honest lines before bed. Sprout grows from a tiny seed into a
              blooming grove — one page at a time.
            </Body>
            <View style={styles.features}>
              <Feature icon="mic" text="Talk it out or type it — your way" />
              <Feature icon="sprout" text="Watch Sprout grow as you show up" />
              <Feature icon="lock" text="Private and backed up. AI only when you ask" />
            </View>
            <PrimaryButton label="Let’s begin" icon="arrowRight" onPress={next} />
          </View>
        )}

        {step === 1 && (
          <View style={styles.block}>
            <Display size={27} style={styles.center}>What should Sprout call you?</Display>
            <Body style={styles.center}>Just a first name or a nickname. It stays on this device.</Body>
            <TextInput
              accessibilityLabel="Your name"
              value={name}
              onChangeText={setName}
              maxLength={40}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={next}
              placeholder="Your name"
              placeholderTextColor={colors.faint}
              selectionColor={colors.accent}
              style={styles.input}
            />
            <PrimaryButton label={who ? `Nice to meet you, ${who}` : 'Continue'} icon="arrowRight" onPress={next} />
            <TextButton label="Skip for now" onPress={next} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.block}>
            <Display size={27} style={styles.center}>How often should we meet?</Display>
            <Body style={styles.center}>Pick a pace that feels kind. You can change it anytime.</Body>
            <View style={{ gap: 10 }}>
              {GOALS.map((option) => {
                const on = option.value === goal;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setGoal(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    style={[styles.goal, on && styles.goalOn]}
                  >
                    <View style={[styles.radio, on && styles.radioOn]}>{on && <Icon name="check" size={13} color={colors.onInk} strokeWidth={3} />}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalTitle}>{option.title}</Text>
                      <Text style={styles.goalBody}>{option.body}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <PrimaryButton label="Start my free trial · write my first page" onPress={() => finish(true)} />
            <Text style={styles.trialNote}>{TRIAL_COPY}</Text>
            <TextButton label="Look around first" onPress={() => finish(false)} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Feature({ icon, text }: { icon: 'mic' | 'sprout' | 'lock'; text: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Icon name={icon} size={17} color={colors.success} strokeWidth={2.2} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: gutter + 4, justifyContent: 'space-between' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { width: 24, backgroundColor: colors.accent },
  hero: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, flexGrow: 1 },
  glow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(185,162,255,0.18)',
  },
  block: { gap: 14 },
  center: { textAlign: 'center' },
  wordmark: {
    fontFamily: font.displaySemi,
    fontSize: 16,
    letterSpacing: 4,
    color: colors.glow,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  features: { gap: 10, marginVertical: 6 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, fontFamily: font.medium, fontSize: 14.5, color: colors.text },
  input: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.cardStrong,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginVertical: 6,
  },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
  },
  goalOn: { borderColor: colors.ink, backgroundColor: colors.surface },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  trialNote: { fontFamily: font.body, fontSize: 12.5, color: colors.faint, textAlign: 'center', marginTop: -4 },
  goalTitle: { fontFamily: font.semi, fontSize: 16, color: colors.text },
  goalBody: { fontFamily: font.body, fontSize: 13, color: colors.muted },
});
