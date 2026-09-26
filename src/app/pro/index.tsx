import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Caption, Card, Display, PrimaryButton, Screen, TopBar } from '@/components/vq';
import { useAccount } from '@/context/account';
import { useToast } from '@/context/toast';
import { Icon } from '@/icons';
import { openBillingPortal } from '@/lib/payments';
import { MONTHLY_PRICE_LABEL, PRO_BENEFITS } from '@/lib/pricing';
import { useCheckout } from '@/lib/useCheckout';
import { colors, font, gutter, radius, tabularNums } from '@/theme';

export default function Pro() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const { toast } = useToast();
  const { user, access, refreshAccess } = useAccount();
  const { checkout, busy } = useCheckout();
  const [email, setEmail] = useState('');

  const status = access.pro
    ? 'Thank you for supporting VOQDO. Pro is active on your account.'
    : access.trialActive
      ? `You’re on your free trial — ${access.daysLeft} ${access.daysLeft === 1 ? 'day' : 'days'} left. Subscribing starts your plan today.`
      : access.known
        ? 'Your free trial has ended. Subscribe to keep journaling with Sprout.'
        : 'Journal with Sprout every night, with everything included.';

  const manage = async () => {
    try {
      await openBillingPortal();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not open billing settings.');
    }
  };

  const restore = async () => {
    await refreshAccess();
    toast('Subscription status refreshed.');
  };

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={goBack} />

      <View style={styles.head}>
        <Text style={styles.kicker}>
          {access.pro ? 'VOQDO PRO · ACTIVE' : access.trialActive ? `FREE TRIAL · ${access.daysLeft}D LEFT` : 'VOQDO PRO'}
        </Text>
        <Display size={31}>
          Keep every word,{'\n'}
          <Text style={{ color: colors.accent }}>grow every night</Text>
        </Display>
        <Body>{status}</Body>
      </View>

      <Card style={styles.benefits}>
        {PRO_BENEFITS.map((benefit) => (
          <View key={benefit.title} style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Icon name={benefit.icon} size={16} color={colors.success} strokeWidth={2.2} />
            </View>
            <Text style={styles.benefitText}>{benefit.title}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.price}>
        <View style={styles.amountRow}>
          <Text style={[styles.amount, tabularNums]}>{MONTHLY_PRICE_LABEL}</Text>
          <Text style={styles.per}>USD / month</Text>
        </View>
        <Caption>Billed monthly by Dodo Payments. Cancel anytime from billing settings.</Caption>

        {!access.pro && !user?.email && (
          <TextInput
            accessibilityLabel="Email for your receipt"
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

        {access.pro ? (
          <PrimaryButton label="Manage subscription" onPress={manage} />
        ) : (
          <PrimaryButton
            label={busy ? 'Opening checkout…' : `Subscribe · ${MONTHLY_PRICE_LABEL}/mo`}
            disabled={busy}
            onPress={() => checkout(email)}
          />
        )}
      </Card>

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
  content: { paddingHorizontal: gutter, paddingBottom: 32, gap: 18 },
  head: { gap: 10, marginTop: 6 },
  kicker: { fontFamily: font.semi, fontSize: 11, letterSpacing: 1.6, color: colors.accent },
  benefits: { padding: 16, gap: 12 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { flex: 1, fontFamily: font.medium, fontSize: 14.5, color: colors.text },
  price: { padding: 20, gap: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  amount: { fontFamily: font.display, fontSize: 42, color: colors.text },
  per: { fontFamily: font.body, fontSize: 13, color: colors.muted },
  email: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.body,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.wash,
  },
  legal: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  legalDot: { fontFamily: font.body, fontSize: 12, color: colors.faint },
  legalText: { fontFamily: font.body, fontSize: 12, color: colors.muted },
});
