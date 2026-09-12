import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Display, NoteCard, PrimaryButton, TextButton, TopBar } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { Icon } from '@/icons';
import { formatDuration } from '@/lib/analyze';
import { useVoiceCapture } from '@/lib/useVoiceCapture';
import { colors, font, glowShadow, gutter, tabularNums } from '@/theme';

export default function Record() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { composeDraft, settings, updateSettings } = useJournal();
  const { phase, transcript, elapsedMs, audioUri, error, start, stop, cancel } = useVoiceCapture();

  // The tap that opened this screen was the intent — begin at once. `start`
  // is stable and guards against being called twice.
  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (phase === 'listening' && !settings.micGranted) updateSettings({ micGranted: true });
  }, [phase, settings.micGranted, updateSettings]);

  // Once recognition settles, analyse what was said and hand off to Review.
  useEffect(() => {
    if (phase !== 'done') return;

    const spoken = transcript.trim();
    if (!spoken) {
      // Nothing was said — leave without creating an empty draft.
      if (router.canGoBack()) router.back();
      else router.replace('/');
      return;
    }

    composeDraft({ body: spoken, source: 'voice', durationMs: elapsedMs, audioUri });
    router.replace('/review');
  }, [phase, transcript, elapsedMs, audioUri, composeDraft, router]);

  const listening = phase === 'listening';
  const processing = phase === 'processing';

  const dismiss = () => {
    cancel();
    // Opened directly (deep link, notification) there is nothing to go back to.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 18 }]}>
      <TopBar onBack={dismiss} />

      <View style={styles.head}>
        <Display size={23}>New Journal Entry</Display>
        <Body style={{ textAlign: 'center' }}>Speak freely. We&rsquo;ll take care of the rest.</Body>
      </View>

      <View style={styles.stage}>
        <Orb active={listening} processing={processing} />

        <Text style={styles.status}>
          {error ? 'Couldn’t listen' : processing ? 'Just a moment…' : 'Listening...'}
        </Text>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <Waveform active={listening} />
        )}

        <Text style={[styles.timer, tabularNums]}>{formatDuration(elapsedMs)}</Text>

        {transcript.length > 0 && (
          <Text style={styles.transcript} numberOfLines={3}>
            {transcript}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        {error ? (
          <>
            <PrimaryButton label="Try again" onPress={start} />
            <TextButton label="Write instead" onPress={() => { cancel(); router.replace('/write'); }} />
          </>
        ) : (
          listening && (
            <>
              <Pressable
                onPress={stop}
                accessibilityLabel="Stop recording"
                style={({ pressed }) => [
                  styles.stop,
                  glowShadow(colors.glow, 'md'),
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.stopSquare} />
              </Pressable>
              <Text style={styles.stopLabel}>Tap to stop</Text>
            </>
          )
        )}

        <NoteCard icon="leaf">You&rsquo;re in a safe space here.</NoteCard>
      </View>
    </View>
  );
}

/** Concentric amber rings that breathe while the mic is open. */
function Orb({ active, processing }: { active: boolean; processing: boolean }) {
  const [breathe] = useState(() => new Animated.Value(0));
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: processing ? 700 : 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: processing ? 700 : 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe, processing]);

  useEffect(() => {
    if (!processing) return;
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [processing, spin]);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={styles.orb}>
      <Animated.View style={[styles.haloOuter, { transform: [{ scale }] }]} />
      <Animated.View style={[styles.haloMid, { transform: [{ scale }] }]} />

      {processing && (
        <Animated.View
          style={[
            styles.spinner,
            {
              transform: [
                { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
              ],
            },
          ]}
        />
      )}

      <Animated.View
        style={[styles.core, glowShadow(colors.glow, 'lg'), { transform: [{ scale }] }]}
      >
        <Icon name="mic" size={30} color={active ? colors.glow : colors.muted} strokeWidth={1.7} />
      </Animated.View>
    </View>
  );
}

const BAR_COUNT = 34;

/** Amber level meter. Bars animate on a staggered loop while recording. */
function Waveform({ active }: { active: boolean }) {
  const [bars] = useState(() =>
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.12))
  );

  useEffect(() => {
    if (!active) {
      bars.forEach((bar) => bar.setValue(0.12));
      return;
    }

    const loops = bars.map((bar, i) => {
      // Envelope: quiet at the edges, loud in the middle, with a fixed
      // per-bar jitter so the shape reads as speech, not a uniform comb.
      const centred = 1 - Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
      const envelope = 0.25 + Math.pow(centred, 0.7) * 0.75;
      const jitter = 0.45 + Math.abs(Math.sin(i * 12.9898)) * 0.55;
      const peak = Math.min(1, envelope * jitter * 1.35);
      const duration = 380 + ((i * 53) % 340);

      return Animated.loop(
        Animated.sequence([
          Animated.delay((i * 37) % 300),
          Animated.timing(bar, {
            toValue: peak,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 0.14,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ])
      );
    });

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [active, bars]);

  return (
    <View style={styles.wave}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            {
              height: bar.interpolate({ inputRange: [0, 1], outputRange: [3, 46] }),
              opacity: active ? 1 : 0.35,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: { alignItems: 'center', gap: 8, paddingHorizontal: gutter, marginTop: 4 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: gutter },
  orb: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  haloOuter: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: 'rgba(233,160,99,0.16)',
    backgroundColor: 'rgba(233,160,99,0.03)',
  },
  haloMid: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1,
    borderColor: 'rgba(233,160,99,0.3)',
    backgroundColor: 'rgba(233,160,99,0.05)',
  },
  spinner: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: colors.glow,
  },
  core: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1.6,
    borderColor: colors.glow,
    backgroundColor: '#191410',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: { fontFamily: font.body, fontSize: 15, color: colors.text },
  error: { fontFamily: font.body, fontSize: 13.5, lineHeight: 20, color: colors.warn, textAlign: 'center' },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 48 },
  waveBar: { width: 2.6, borderRadius: 1.3, backgroundColor: colors.glow },
  timer: { fontFamily: font.body, fontSize: 15, color: colors.muted },
  transcript: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.faint,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: gutter, alignItems: 'stretch', gap: 10 },
  stop: {
    alignSelf: 'center',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: { width: 17, height: 17, borderRadius: 4, backgroundColor: '#20160E' },
  stopLabel: {
    fontFamily: font.body,
    fontSize: 12.5,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 6,
  },
});
