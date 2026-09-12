import { MONTHLY_PRICE_LABEL } from '@/lib/pricing';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Card, Display, IconTile, Screen, TopBar } from '@/components/vq';
import { useToast } from '@/context/toast';
import type { IconName } from '@/icons';
import { catStyle, colors, font, glowShadow, gutter, radius, tabularNums } from '@/theme';

const BENEFITS: { title: string; icon: IconName; cat: string }[] = [
  { title: 'Unlimited recording length', icon: 'mic', cat: 'Self-Care' },
  { title: 'Custom reflection prompts', icon: 'search', cat: 'Mindset' },
  { title: 'Custom categories', icon: 'tag', cat: 'Personal Growth' },
  { title: 'Deeper monthly reflections', icon: 'sparkle', cat: 'Gratitude' },
  { title: 'Encrypted cloud backup', icon: 'cloud', cat: 'Reflection' },
  { title: 'Cross-device journal sync', icon: 'export', cat: 'Relationships' },
];

export default function Pro() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const { toast } = useToast();

  const upgrade = () => {
    toast('Pro is in development. No purchase or subscription has been created.');
  };

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={goBack} />

      <View style={styles.head}>
        <Text style={styles.kicker}>VOQDO PRO · PLANNED FEATURES</Text>
        <Display size={30}>
          Keep every word,{'\n'}
          <Text style={{ color: colors.accent }}>search every month</Text>
        </Display>
      </View>

      <View style={styles.grid}>
        {BENEFITS.map((benefit) => {
          const style = catStyle(benefit.cat);
          return (
            <Card key={benefit.title} style={styles.benefit}>
              <IconTile
                icon={benefit.icon}
                color={style.color}
                bg={style.bg}
                size={32}
                iconSize={15}
              />
              <Text style={styles.benefitText}>{benefit.title}</Text>
            </Card>
          );
        })}
      </View>

      <View style={styles.price}>
        <View style={styles.priceTop}>
          <Text style={styles.priceKicker}>MONTHLY</Text>
          <View style={styles.trial}>
            <Text style={styles.trialText}>In development</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.amount, tabularNums]}>{MONTHLY_PRICE_LABEL}</Text>
          <Text style={styles.per}>USD / month</Text>
        </View>

        <Body style={{ color: colors.muted }}>
          Planned pricing. Pro features and purchases are not available yet.
        </Body>

        <Pressable
          onPress={upgrade}
          style={({ pressed }) => [
            styles.cta,
            glowShadow(colors.accent, 'sm'),
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.ctaLabel}>
            {'Preview only · Coming soon'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.legal}>
        {['Restore Purchases', 'Terms', 'Privacy'].map((item, i) => (
          <View key={item} style={styles.legalItem}>
            {i > 0 && <Text style={styles.legalDot}>·</Text>}
            <Text style={styles.legalText}>{item}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 32, gap: 20 },
  head: { gap: 10, marginTop: 6 },
  kicker: { fontFamily: font.medium, fontSize: 10.5, letterSpacing: 1.6, color: colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  benefit: { width: '48%', padding: 13, gap: 10 },
  benefitText: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 17, color: colors.text },
  price: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xxl,
    padding: 20,
    gap: 8,
  },
  priceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceKicker: { fontFamily: font.medium, fontSize: 10.5, letterSpacing: 1.5, color: colors.muted },
  trial: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(243,196,162,0.14)',
  },
  trialText: { fontFamily: font.medium, fontSize: 11, color: colors.accent },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  amount: { fontFamily: font.display, fontSize: 42, color: colors.text },
  per: { fontFamily: font.body, fontSize: 13, color: colors.muted },
  cta: {
    marginTop: 10,
    paddingVertical: 15,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  ctaLabel: { fontFamily: font.semi, fontSize: 15, color: colors.accentInk },
  legal: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  legalItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legalDot: { fontFamily: font.body, fontSize: 12, color: colors.faint },
  legalText: { fontFamily: font.body, fontSize: 12, color: colors.faint },
});
