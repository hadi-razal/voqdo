import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NightScene } from '@/components/NightScene';
import { PrimaryButton } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { colors, font, gutter } from '@/theme';

const PILLARS = ['Journal.', 'Reflect.', 'Understand.', 'Grow.'];

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { updateSettings } = useJournal();

  const begin = () => {
    updateSettings({ onboarded: true });
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <View style={styles.scene} pointerEvents="none">
        <NightScene width={width} height={height * 0.68} />
      </View>

      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.brand}>
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
        <Text style={styles.footer}>A kinder mind is a brighter you.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scene: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { flex: 1, paddingHorizontal: gutter + 6 },
  // Pushed to roughly the scene's optical centre, below the moon.
  brand: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  wordmark: {
    fontFamily: font.displayRegular,
    fontSize: 54,
    lineHeight: 62,
    color: colors.text,
    letterSpacing: 1,
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
