import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChartIcon, Icon, type IconName } from '@/icons';
import { colors, font, glowShadow, pressedOpacity, radius, shadow, sky } from '@/theme';

/**
 * Four destinations around a raised centre button. The plus opens a small
 * chooser — speak or write — so neither way of journaling is buried.
 */
export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: sky.bottom } }} tabBar={(props) => <VoqdoTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
      <Tabs.Screen name="progress" options={{ title: 'Garden' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
    </Tabs>
  );
}

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
  };
};

function VoqdoTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [choosing, setChoosing] = useState(false);
  const active = state.routes[state.index]?.name;

  const go = (name: string) => {
    const event = navigation.emit({ type: 'tabPress', target: name, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(name);
  };

  const open = (path: '/record' | '/write') => {
    setChoosing(false);
    router.push(path);
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        <TabButton label="Home" icon="home" active={active === 'index'} onPress={() => go('index')} />
        <TabButton label="Journal" icon="book" active={active === 'journal'} onPress={() => go('journal')} />

        <Pressable
          onPress={() => setChoosing(true)}
          accessibilityRole="button"
          accessibilityLabel="New journal entry"
          style={({ pressed }) => [styles.plusWrap, glowShadow(colors.accent, 'md'), pressed && { transform: [{ scale: 0.94 }] }]}
        >
          <LinearGradient colors={[colors.accent, colors.accentDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.plus}>
            <Icon name="plus" size={26} color={colors.accentInk} strokeWidth={2.6} />
          </LinearGradient>
        </Pressable>

        <TabButton label="Garden" icon="sprout" active={active === 'progress'} onPress={() => go('progress')} />
        <TabButton
          label="Insights"
          active={active === 'insights'}
          onPress={() => go('insights')}
          render={(color) => <ChartIcon size={22} color={color} strokeWidth={2} />}
        />
      </View>

      <Modal visible={choosing} transparent animationType="fade" onRequestClose={() => setChoosing(false)}>
        <Pressable style={styles.scrim} onPress={() => setChoosing(false)} accessibilityLabel="Close">
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 20 }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>How do you want to journal?</Text>
            <Text style={styles.sheetSub}>A few honest lines is plenty.</Text>
            <View style={styles.choices}>
              <Choice icon="mic" label="Speak" hint="Talk it out" tint={colors.accent} onPress={() => open('/record')} />
              <Choice icon="pencil" label="Write" hint="Type a page" tint={colors.success} onPress={() => open('/write')} />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function Choice({ icon, label, hint, tint, onPress }: { icon: IconName; label: string; hint: string; tint: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} — ${hint}`}
      style={({ pressed }) => [styles.choice, pressed && { opacity: pressedOpacity, transform: [{ scale: 0.97 }] }]}
    >
      <View style={[styles.choiceIcon, { backgroundColor: `${tint}22`, borderColor: `${tint}55` }]}>
        <Icon name={icon} size={26} color={tint} strokeWidth={2} />
      </View>
      <Text style={styles.choiceLabel}>{label}</Text>
      <Text style={styles.choiceHint}>{hint}</Text>
    </Pressable>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
  render,
}: {
  label: string;
  icon?: IconName;
  active: boolean;
  onPress: () => void;
  render?: (color: string) => React.ReactNode;
}) {
  const color = active ? colors.accent : colors.faint;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.tab, pressed && { opacity: pressedOpacity }]}
    >
      {render ? render(color) : icon ? <Icon name={icon} size={22} color={color} strokeWidth={2} /> : null}
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      <View style={[styles.dot, active && { backgroundColor: colors.accent }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: sky.bottom, paddingHorizontal: 14, paddingTop: 10 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadow.lift,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingTop: 4 },
  tabLabel: { fontFamily: font.medium, fontSize: 11 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent', marginTop: 1 },
  plusWrap: { borderRadius: 32, marginHorizontal: 6, marginTop: -28 },
  plus: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
  },
  scrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    marginHorizontal: 12,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 12,
    borderRadius: radius.xxl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadow.lift,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  sheetTitle: { fontFamily: font.display, fontSize: 22, color: colors.text, textAlign: 'center', letterSpacing: -0.3 },
  sheetSub: { fontFamily: font.body, fontSize: 13.5, color: colors.muted, textAlign: 'center', marginTop: -6 },
  choices: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 8 },
  choice: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 22,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  choiceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  choiceLabel: { fontFamily: font.semi, fontSize: 16, color: colors.text },
  choiceHint: { fontFamily: font.body, fontSize: 12.5, color: colors.muted },
});
