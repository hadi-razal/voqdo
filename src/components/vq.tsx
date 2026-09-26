import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode, type Ref } from 'react';
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
import { Mascot } from '@/components/Mascot';
import { Sky } from '@/components/Sky';
import { Icon, type IconName } from '@/icons';
import { type MascotPose } from '@/lib/mascot';
import {
  catStyle,
  colors,
  font,
  glowShadow,
  gutter,
  pressedOpacity,
  radius,
  shadow,
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
    return (
      <View style={styles.screen}>
        <Sky />
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Sky />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[pad, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** Serif headline. */
export function Display({
  children,
  size = 26,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  size?: number;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: font.display, fontSize: size, lineHeight: size * 1.24, color: colors.text, letterSpacing: -0.3 },
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

/** Heading row for a group of content, with an optional action on the right. */
export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={10} style={({ pressed }) => pressed && { opacity: pressedOpacity }}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Frosted block — the default surface for grouped content. */
export function Card({
  children,
  style,
  onPress,
  tone = 'surface',
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: 'surface' | 'raised';
  accessibilityLabel?: string;
}) {
  const card: ViewStyle = {
    backgroundColor: tone === 'raised' ? colors.surfaceRaised : colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.xl,
    ...(tone === 'raised' ? null : shadow.card),
  };

  if (!onPress) return <View style={[card, style]}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [card, style, pressed && { opacity: pressedOpacity, transform: [{ scale: 0.99 }] }]}
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
  strokeWidth = 2,
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
        borderRadius: size * 0.34,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={iconSize ?? size * 0.48} color={color} strokeWidth={strokeWidth} />
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
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: pressedOpacity }}>
      {content}
    </Pressable>
  );
}

export function CategoryChip({ cat, onPress }: { cat: string; onPress?: () => void }) {
  const { color, bg } = catStyle(cat);
  return <Chip label={cat} color={color} bg={bg} onPress={onPress} />;
}

/** Apricot pill — the primary action. */
export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  style,
  tone = 'ink',
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  tone?: 'ink' | 'accent' | 'mint';
}) {
  const [from, to, ink] =
    tone === 'mint'
      ? ['#36C28B', colors.success, colors.successInk]
      : tone === 'accent'
        ? [colors.accent, colors.accentDeep, colors.accentInk]
        : [colors.inkDeep, colors.ink, colors.onInk];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.primaryWrap,
        !disabled && tone !== 'ink' && glowShadow(from, 'sm'),
        disabled && { opacity: 0.4 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
        <Text style={[styles.primaryLabel, { color: ink }]}>{label}</Text>
        {icon && <Icon name={icon} size={18} color={ink} strokeWidth={2.2} />}
      </LinearGradient>
    </Pressable>
  );
}

/** Outlined pill for the second-most-important action on a screen. */
export function SecondaryButton({
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
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.secondary, disabled && { opacity: 0.4 }, pressed && { opacity: pressedOpacity }, style]}
    >
      {icon && <Icon name={icon} size={17} color={colors.text} strokeWidth={2} />}
      <Text style={styles.secondaryLabel}>{label}</Text>
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
      accessibilityRole="button"
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
  size = 40,
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
          borderColor: colors.cardBorder,
        },
        !bare && shadow.card,
        pressed && { opacity: pressedOpacity },
      ]}
    >
      <Icon name={icon} size={size * 0.48} color={color} strokeWidth={2} />
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
        {onMore && <RoundButton icon="dots" onPress={onMore} label="More options" />}
      </View>
    </View>
  );
}

/** Rounded track with a gradient fill. `value` is 0–1. */
export function ProgressBar({
  value,
  color = colors.success,
  height = 8,
  track = colors.wash,
}: {
  value: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}
    >
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

/** Pill toggle group, e.g. 7 days / 30 days / All time. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, on && styles.segmentOn]}
          >
            <Text style={[styles.segmentText, on && { color: colors.onInk }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Big number over a small label. */
export function StatTile({
  value,
  label,
  icon,
  color = colors.text,
}: {
  value: string | number;
  label: string;
  icon?: IconName;
  color?: string;
}) {
  return (
    <View style={styles.stat}>
      {icon && <Icon name={icon} size={16} color={color} strokeWidth={2.2} />}
      <Text style={[styles.statN, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  pose = 'peek',
}: {
  title: string;
  body?: string;
  icon?: IconName;
  pose?: MascotPose;
}) {
  const [tick, setTick] = useState(0);

  return (
    <Pressable
      onPress={() => setTick((n) => n + 1)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. Tap Sprout for a wink.`}
      style={styles.empty}
    >
      <Mascot pose={tick % 2 === 1 ? 'wink' : pose} size={130} bounce={tick} />
      <Display size={21} style={{ textAlign: 'center' }}>{title}</Display>
      {body && <Body style={{ textAlign: 'center' }}>{body}</Body>}
    </Pressable>
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
      <Icon name={icon} size={16} color={color} strokeWidth={2} />
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: font.display, fontSize: 19, color: colors.text, letterSpacing: -0.2 },
  sectionAction: { fontFamily: font.medium, fontSize: 13, color: colors.accent },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  chipText: { fontFamily: font.medium, fontSize: 12.5 },
  primaryWrap: { borderRadius: radius.pill },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
  },
  primaryLabel: { fontFamily: font.semi, fontSize: 16 },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryLabel: { fontFamily: font.medium, fontSize: 15, color: colors.text },
  textButton: { paddingVertical: 12, alignItems: 'center' },
  textButtonLabel: { fontFamily: font.medium, fontSize: 14 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingBottom: 6,
  },
  topSlot: { minWidth: 40, justifyContent: 'center' },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadow.card,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.pill },
  segmentOn: { backgroundColor: colors.ink },
  segmentText: { fontFamily: font.medium, fontSize: 13, color: colors.muted },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadow.card,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  statN: { fontFamily: font.display, fontSize: 24, lineHeight: 29 },
  statLabel: { fontFamily: font.body, fontSize: 12, color: colors.faint },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 30 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.successBg,
    borderWidth: 0,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  noteText: { flex: 1, fontFamily: font.body, fontSize: 13, lineHeight: 19, color: colors.muted },
});
