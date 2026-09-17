import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MascotTalk } from '@/components/Mascot';
import { PrimaryButton } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { colors, font, gutter } from '@/theme';

const PILLARS = ['Journal.', 'Reflect.', 'Understand.', 'Grow.'];

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateSettings } = useJournal();

  const begin = () => {
    updateSettings({ onboarded: true });
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <View style={styles.glow} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <MascotTalk
            pose="hello"
            size={128}
            layout="stack"
            bare
            line="Hi. I’m Sprout — I’ll keep you company."
            taps={[
              'Journal. Reflect. Understand. Grow.',
              'A few honest lines is plenty.',
              'Tap me anytime. I like the company.',
            ]}
          />
          <Text style={styles.wordmark}>voqdo</Text>
          <Text style={styles.tagline}>
            A calmer you,{'\n'}a more meaningful tomorrow.
          </Text>
        </View>

        <View style={styles.pillars}>
          {PILLARS.map((word) => (
            <Text key={word} style={styles.pillar}>
              {word}
            </Text>
          ))}
        </View>

        <PrimaryButton label="Let’s Begin" icon="arrowRight" onPress={begin} />
        <Text style={styles.footer}>Kept on this device. Optional AI only when you ask.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
    top: '18%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(233,160,99,0.12)',
  },
  content: { flexGrow: 1, paddingHorizontal: gutter + 6 },
  brand: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 8 },
  wordmark: {
    fontFamily: font.displayRegular,
    fontSize: 48,
    lineHeight: 54,
    color: colors.text,
    letterSpacing: 1,
    marginTop: 4,
  },
  tagline: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
  },
  pillars: { gap: 3, marginBottom: 26 },
  pillar: { fontFamily: font.body, fontSize: 14.5, lineHeight: 22, color: colors.muted },
  footer: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.faint,
    textAlign: 'center',
    marginTop: 16,
  },
});
