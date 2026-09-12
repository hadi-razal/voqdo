import type { ReactNode, Ref } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/icons';
import {
  catStyle,
  colors,
  font,
  glowShadow,
  gutter,
  pressedOpacity,
  radius,
  type,
} from '@/theme';

/** Screen chrome and the small typed primitives every screen is built from. */

export function Screen({
  children,
  scroll = true,
  contentStyle,
  topInset = true,
  scrollRef,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  topInset?: boolean;
  scrollRef?: Ref<ScrollView>;
}) {
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: topInset ? insets.top + 8 : 0 };

  if (!scroll) {
    return <View style={[styles.screen, pad, contentStyle]}>{children}</View>;
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={[pad, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/** Serif headline. */
export function Display({
  children,
  size = 26,
  style,
}: {
  children: ReactNode;
  size?: number;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        { fontFamily: font.display, fontSize: size, lineHeight: size * 1.28, color: colors.text },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[type.body, style]}>
      {children}
    </Text>
  );
}

/** Journal prose, set in the serif so entries read like writing. */
export function Prose({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[type.prose, style]}>{children}</Text>;
}

export function Caption({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[type.caption, style]}>{children}</Text>;
}

export function Kicker({ children, color }: { children: ReactNode; color?: string }) {
  return <Text style={[type.kicker, color ? { color } : null]}>{children}</Text>;
}

/** Bordered dark block — the default surface for grouped content. */
export function Card({
  children,
  style,
  onPress,
  tone = 'surface',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: 'surface' | 'raised';
}) {
  const card: ViewStyle = {
    backgroundColor: tone === 'raised' ? colors.surfaceRaised : colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.xl,
  };

  if (!onPress) return <View style={[card, style]}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [card, style, pressed && { opacity: pressedOpacity }]}
    >
      {children}
    </Pressable>
  );
}

/** Rounded tinted square holding one glyph. */
export function IconTile({
  icon,
  color,
  bg,
  size = 38,
  iconSize,
  strokeWidth = 1.6,
}: {
  icon: IconName;
  color: string;
  bg: string;
  size?: number;
  iconSize?: number;
  strokeWidth?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.33,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={iconSize ?? size * 0.46} color={color} strokeWidth={strokeWidth} />
    </View>
  );
}

export function Chip({
  label,
  color,
  bg,
  onPress,
}: {
  label: string;
  color: string;
  bg: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: pressedOpacity }}>
      {content}
    </Pressable>
  );
}

export function CategoryChip({ cat, onPress }: { cat: string; onPress?: () => void }) {
  const { color, bg } = catStyle(cat);
  return <Chip label={cat} color={color} bg={bg} onPress={onPress} />;
}

/** Peach pill — the primary action. */
export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        glowShadow(colors.accent, 'md'),
        disabled && { opacity: 0.45 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Text style={styles.primaryLabel}>{label}</Text>
      {icon && <Icon name={icon} size={17} color={colors.accentInk} strokeWidth={1.9} />}
    </Pressable>
  );
}

export function TextButton({
  label,
  onPress,
  tone = 'muted',
}: {
  label: string;
  onPress: () => void;
  tone?: 'muted' | 'accent' | 'warn';
}) {
  const color = { muted: colors.muted, accent: colors.accent, warn: colors.warn }[tone];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.textButton, pressed && { opacity: pressedOpacity }]}
    >
      <Text style={[styles.textButtonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

/** Circular icon control used for back arrows and overflow menus. */
export function RoundButton({
  icon,
  onPress,
  size = 38,
  color = colors.text,
  bare = false,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  size?: number;
  color?: string;
  bare?: boolean;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bare ? 'transparent' : colors.surface,
          borderWidth: bare ? 0 : 1,
          borderColor: colors.borderSoft,
        },
        pressed && { opacity: pressedOpacity },
      ]}
    >
      <Icon name={icon} size={size * 0.5} color={color} strokeWidth={1.7} />
    </Pressable>
  );
}

/** Header row: back on the left, optional overflow on the right. */
export function TopBar({
  onBack,
  onMore,
  center,
}: {
  onBack?: () => void;
  onMore?: () => void;
  center?: ReactNode;
}) {
  return (
    <View style={styles.topBar}>
      <View style={styles.topSlot}>
        {onBack && <RoundButton icon="chevronLeft" onPress={onBack} label="Go back" />}
      </View>
      {center}
      <View style={[styles.topSlot, { alignItems: 'flex-end' }]}>
        {onMore && <RoundButton icon="dots" onPress={onMore} bare label="More options" />}
      </View>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  icon = 'moon',
}: {
  title: string;
  body?: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={22} color={colors.faint} strokeWidth={1.5} />
      </View>
      <Display size={19}>{title}</Display>
      {body && <Body style={{ textAlign: 'center' }}>{body}</Body>}
    </View>
  );
}

/** Soft note used for reassurance lines, e.g. "You're in a safe space here." */
export function NoteCard({
  icon,
  children,
  color = colors.success,
}: {
  icon: IconName;
  children: ReactNode;
  color?: string;
}) {
  return (
    <View style={styles.note}>
      <Icon name={icon} size={16} color={color} strokeWidth={1.6} />
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
  },
  chipText: { fontFamily: font.medium, fontSize: 12.5 },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
  },
  primaryLabel: { fontFamily: font.medium, fontSize: 15, color: colors.accentInk },
  textButton: { paddingVertical: 12, alignItems: 'center' },
  textButtonLabel: { fontFamily: font.medium, fontSize: 13.5 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingBottom: 4,
  },
  topSlot: { minWidth: 38, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 44, paddingHorizontal: 30 },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  noteText: { flex: 1, fontFamily: font.body, fontSize: 13, lineHeight: 19, color: colors.muted },
});
