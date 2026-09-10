import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChartIcon, Icon, type IconName } from '@/icons';
import { colors, font, glowShadow, pressedOpacity } from '@/theme';

/**
 * Four destinations around a raised centre button that opens the recorder.
 * Drawn by hand because the navigator's default bar cannot host the plus.
 */
export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <VoqdoTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
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
  const active = state.routes[state.index]?.name;

  const go = (name: string) => {
    const event = navigation.emit({ type: 'tabPress', target: name, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(name);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <TabButton label="Home" icon="home" active={active === 'index'} onPress={() => go('index')} />
      <TabButton
        label="Journal"
        icon="book"
        active={active === 'journal'}
        onPress={() => go('journal')}
      />

      <Pressable
        onPress={() => router.push('/record')}
        accessibilityRole="button"
        accessibilityLabel="New journal entry"
        style={({ pressed }) => [
          styles.plus,
          glowShadow(colors.accent, 'md'),
          pressed && { opacity: 0.85 },
        ]}
      >
        <Icon name="plus" size={24} color={colors.accentInk} strokeWidth={2} />
      </Pressable>

      <TabButton
        label="Insights"
        active={active === 'insights'}
        onPress={() => go('insights')}
        render={(color) => <ChartIcon size={21} color={color} />}
      />
      <TabButton
        label="Search"
        icon="search"
        active={active === 'search'}
        onPress={() => go('search')}
      />
    </View>
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
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.tab, pressed && { opacity: pressedOpacity }]}
    >
      {render ? render(color) : icon ? <Icon name={icon} size={21} color={color} /> : null}
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 8,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
  },
  tab: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 4 },
  tabLabel: { fontFamily: font.medium, fontSize: 10.5 },
  plus: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginBottom: 4,
  },
});
