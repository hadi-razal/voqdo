import { MONTHLY_PRICE_LABEL } from '@/lib/pricing';
import { type Href, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Card, Display, IconTile, Screen, TopBar } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { useToast } from '@/context/toast';
import type { IconName } from '@/icons';
import { openCheckoutUrl, startProCheckout } from '@/lib/payments';
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
  const { settings, updateSettings } = useJournal();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);

  const upgrade = async () => {
    if (settings.pro) {
      toast('VOQDO Pro is already active on this device.');
      return;
    }
    if (request.current || busy) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    try {
      const session = await startProCheckout({
        name: settings.name,
        email: email.trim() || undefined,
        signal: controller.signal,
      });
      await openCheckoutUrl(session.checkoutUrl);
    } catch (error) {
      if (!controller.signal.aborted) {
        toast(error instanceof Error ? error.message : 'Could not open checkout.');
      }
    } finally {
      request.current = null;
      setBusy(false);
    }
  };

  const restore = () => {
    if (settings.pro) {
      toast('Pro is already unlocked on this device.');
      return;
    }
    router.push('/pro/success' as Href);
  };

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={goBack} />

      <View style={styles.head}>
        <Text style={styles.kicker}>{settings.pro ? 'VOQDO PRO · ACTIVE' : 'VOQDO PRO'}</Text>
        <Display size={30}>
          Keep every word,{'\n'}
          <Text style={{ color: colors.accent }}>search every month</Text>
        </Display>
        <Body>
          {settings.pro
            ? 'Thank you for supporting VOQDO. Pro is unlocked on this device.'
            : 'Habit XP and local journaling stay free. Pro is billed monthly through Dodo Payments.'}
        </Body>
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
            <Text style={styles.trialText}>{settings.pro ? 'Active' : 'Dodo Payments'}</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.amount, tabularNums]}>{MONTHLY_PRICE_LABEL}</Text>
          <Text style={styles.per}>USD / month</Text>
        </View>

        <Body style={{ color: colors.muted }}>
          Cancel anytime from your Dodo customer portal. Test-mode cards work while building.
        </Body>

        {!settings.pro && (
          <TextInput
            accessibilityLabel="Email for checkout receipt"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email for your receipt (optional)"
            placeholderTextColor={colors.faint}
            style={styles.email}
          />
        )}

        <Pressable
          onPress={settings.pro ? () => router.replace('/') : upgrade}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={settings.pro ? 'Back to journal' : 'Subscribe to VOQDO Pro'}
          style={({ pressed }) => [
            styles.cta,
            glowShadow(colors.accent, 'sm'),
            (pressed || busy) && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.ctaLabel}>
            {settings.pro
              ? 'Back to journal'
              : busy
                ? 'Opening checkout…'
                : `Subscribe · ${MONTHLY_PRICE_LABEL}/mo`}
          </Text>
        </Pressable>
        {settings.pro && (
          <Pressable
            onPress={() => {
              updateSettings({ pro: false });
              toast('Local Pro unlock cleared (testing only)');
            }}
            hitSlop={8}
          >
            <Body style={{ color: colors.faint, textAlign: 'center' }}>
              Clear local Pro unlock · testing only
            </Body>
          </Pressable>
        )}
      </View>

      <View style={styles.legal}>
        <Pressable onPress={restore} hitSlop={8}>
          <Text style={styles.legalText}>Restore</Text>
        </Pressable>
        <Text style={styles.legalDot}>·</Text>
        <Pressable onPress={() => router.push('/terms')} hitSlop={8}>
          <Text style={styles.legalText}>Terms</Text>
        </Pressable>
        <Text style={styles.legalDot}>·</Text>
        <Pressable onPress={() => router.push('/privacy')} hitSlop={8}>
          <Text style={styles.legalText}>Privacy</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 32, gap: 20 },
  head: { gap: 10, marginTop: 6 },
  kicker: {
    fontFamily: font.medium,
    fontSize: 10.5,
    letterSpacing: 1.6,
    color: colors.accent,
  },
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
  priceKicker: {
    fontFamily: font.medium,
    fontSize: 10.5,
    letterSpacing: 1.5,
    color: colors.muted,
  },
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
  email: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.body,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  cta: {
    marginTop: 10,
    paddingVertical: 15,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  ctaLabel: { fontFamily: font.semi, fontSize: 15, color: colors.accentInk },
  legal: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  legalDot: { fontFamily: font.body, fontSize: 12, color: colors.faint },
  legalText: { fontFamily: font.body, fontSize: 12, color: colors.muted },
});
