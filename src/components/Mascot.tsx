import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageStyle } from 'react-native';
import { useHabitProgress } from '@/lib/useHabitProgress';
import {
  companionMoment,
  MASCOT_LABELS,
  type MascotPose,
} from '@/lib/mascot';
import { colors, font, pressedOpacity, radius } from '@/theme';

const IMAGES: Record<MascotPose, number> = {
  journal: require('../../assets/images/mascot/journal.png'),
  heart: require('../../assets/images/mascot/heart.png'),
  cheer: require('../../assets/images/mascot/cheer.png'),
  nap: require('../../assets/images/mascot/nap.png'),
  wonder: require('../../assets/images/mascot/wonder.png'),
  think: require('../../assets/images/mascot/think.png'),
  listen: require('../../assets/images/mascot/listen.png'),
  laptop: require('../../assets/images/mascot/laptop.png'),
  cocoa: require('../../assets/images/mascot/cocoa.png'),
  hello: require('../../assets/images/mascot/hello.png'),
  weep: require('../../assets/images/mascot/weep.png'),
  sleep: require('../../assets/images/mascot/sleep.png'),
  wink: require('../../assets/images/mascot/wink.png'),
  shy: require('../../assets/images/mascot/shy.png'),
  study: require('../../assets/images/mascot/study.png'),
  grow: require('../../assets/images/mascot/grow.png'),
  storm: require('../../assets/images/mascot/storm.png'),
  party: require('../../assets/images/mascot/party.png'),
  rest: require('../../assets/images/mascot/rest.png'),
  peek: require('../../assets/images/mascot/peek.png'),
  star: require('../../assets/images/mascot/star.png'),
  ponder: require('../../assets/images/mascot/ponder.png'),
  bloom: require('../../assets/images/mascot/bloom.png'),
  wave: require('../../assets/images/mascot/wave.png'),
};

export function Mascot({
  pose,
  size = 88,
  style,
}: {
  pose: MascotPose;
  size?: number;
  style?: ImageStyle;
}) {
  return (
    <Image
      source={IMAGES[pose]}
      accessibilityLabel={MASCOT_LABELS[pose]}
      style={[{ width: size, height: size, flexShrink: 0 }, style]}
      resizeMode="contain"
    />
  );
}

/** Tappable buddy: pose + speech bubble that cycles a few lines. */
export function MascotTalk({
  pose,
  line,
  taps = [],
  size = 86,
  layout = 'row',
  bare = false,
}: {
  pose: MascotPose;
  line: string;
  taps?: string[];
  size?: number;
  layout?: 'row' | 'stack';
  bare?: boolean;
}) {
  const [tick, setTick] = useState(0);
  const lines = [line, ...taps];
  const shown = lines[tick % lines.length];
  const playful = tick > 0 && tick % lines.length === 0;

  return (
    <Pressable
      onPress={() => setTick((n) => n + 1)}
      accessibilityRole="button"
      accessibilityLabel={`${MASCOT_LABELS[pose]}. ${shown}. Double tap to hear another line.`}
      style={({ pressed }) => [
        styles.talk,
        layout === 'stack' && styles.talkStack,
        bare && styles.talkBare,
        pressed && { opacity: pressedOpacity },
      ]}
    >
      <Mascot pose={playful ? 'wink' : pose} size={size} />
      <View style={[styles.bubble, layout === 'stack' && styles.bubbleStack]}>
        <Text style={[styles.bubbleText, layout === 'stack' && styles.centered]}>{shown}</Text>
        <Text style={[styles.hint, layout === 'stack' && styles.centered]}>Tap me</Text>
      </View>
    </Pressable>
  );
}

/** Home companion that reacts to time of day, streaks, and today’s page. */
export function MascotBuddy({
  wroteToday,
  empty,
  name,
}: {
  wroteToday: boolean;
  empty: boolean;
  name?: string;
}) {
  const progress = useHabitProgress();
  const moment = useMemo(
    () =>
      companionMoment({
        wroteToday,
        empty,
        name,
        streak: progress.streak,
        weeklyComplete: progress.weeklyComplete,
      }),
    [wroteToday, empty, name, progress.streak, progress.weeklyComplete]
  );

  return <MascotTalk pose={moment.pose} line={moment.line} taps={moment.taps} />;
}

const styles = StyleSheet.create({
  talk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.xl,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'stretch',
  },
  talkStack: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  talkBare: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  bubble: { flex: 1, gap: 4 },
  bubbleStack: { flex: 0, alignItems: 'center' },
  bubbleText: {
    fontFamily: font.displayItalic,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  hint: { fontFamily: font.medium, fontSize: 11, color: colors.faint },
  centered: { textAlign: 'center' },
});
