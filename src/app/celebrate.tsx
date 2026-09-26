import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sprout } from '@/components/Sprout';
import { POSE_LOOKS } from '@/components/Mascot';
import { Sky } from '@/components/Sky';
import { Display, PrimaryButton, SecondaryButton } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { Icon, type IconName } from '@/icons';
import { challengeProgress, CHALLENGES } from '@/lib/challenges';
import { DAILY_XP, habitProgress } from '@/lib/habits';
import { companionForMood } from '@/lib/mascot';
import { grewTo, STAGES, stageFor } from '@/lib/pet';
import { dailyQuests } from '@/lib/quests';
import { colors, font, gutter, radius } from '@/theme';

const native = Platform.OS !== 'web';

type Reward = { key: string; icon: IconName; tint: string; title: string; detail: string };

/**
 * The moment after saving a new page. Everything shown is derived by
 * comparing the journal with and without this entry, so the screen can be
 * reopened or refreshed without inventing rewards.
 */
export default function Celebrate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, entryById } = useJournal();
  const entry = entryById(id ?? '');

  // Anchored once so the comparison cannot shift while the screen is open.
  const [now] = useState(() => Date.now());
  const result = useMemo(() => {
    if (!entry) return null;
    const before = entries.filter((item) => item.id !== entry.id);
    const was = habitProgress(before, now);
    const is = habitProgress(entries, now);
    const questsBefore = dailyQuests(before, now);
    const questsAfter = dailyQuests(entries, now);
    const grew = grewTo(was.totalDays, is.totalDays);
    const journey = entry.challengeId ? challengeProgress(entries, entry.challengeId, now) : null;
    const journeyBefore = entry.challengeId ? challengeProgress(before, entry.challengeId, now) : null;
    const newDay = is.totalDays > was.totalDays;

    const rewards: Reward[] = [];
    if (newDay) rewards.push({ key: 'xp', icon: 'sparkle', tint: colors.gold, title: `+${DAILY_XP} XP`, detail: `Level ${is.level} · ${is.nextLevelXp} XP to go` });
    if (is.level > was.level) rewards.push({ key: 'level', icon: 'trophy', tint: colors.gold, title: `Level ${is.level} reached`, detail: is.levelName });
    if (is.streak > 0) rewards.push({ key: 'streak', icon: 'flame', tint: colors.accent, title: `${is.streak}-day streak`, detail: is.streak > was.streak ? 'Kept alive today' : 'Still going strong' });
    if (is.shields > was.shields) rewards.push({ key: 'shield', icon: 'shield', tint: colors.success, title: 'Leaf shield earned', detail: 'Protects your streak on a missed day' });
    const badge = is.badges.find((item) => item.earned && !was.badges.find((old) => old.id === item.id)?.earned);
    if (badge) rewards.push({ key: 'badge', icon: 'trophy', tint: colors.gold, title: badge.name, detail: 'Milestone unlocked' });
    const finishedQuests = questsAfter.filter((quest, i) => quest.done && !questsBefore[i].done);
    const allDone = questsAfter.every((quest) => quest.done);
    if (allDone && !questsBefore.every((quest) => quest.done)) {
      rewards.push({ key: 'star', icon: 'star', tint: colors.gold, title: 'Star earned', detail: 'All three quests complete' });
    } else if (finishedQuests.length) {
      rewards.push({
        key: 'quests',
        icon: 'check',
        tint: colors.success,
        title: finishedQuests.map((quest) => quest.title).join(' · '),
        detail: `${questsAfter.filter((quest) => quest.done).length}/3 quests today`,
      });
    }
    if (journey?.done && !journeyBefore?.done) {
      const title = CHALLENGES.find((item) => item.id === entry.challengeId)?.title ?? 'Journey';
      rewards.push({ key: 'journey', icon: 'sprout', tint: colors.success, title: 'Journey complete', detail: title });
    }
    if (!rewards.length) rewards.push({ key: 'saved', icon: 'heart', tint: colors.accent, title: 'Another page kept', detail: 'Today’s XP is already earned' });

    return { was, is, grew, rewards, newDay };
  }, [entries, entry, now]);

  useEffect(() => {
    if (!entry) router.replace('/');
  }, [entry, router]);

  const [phase, setPhase] = useState<'before' | 'after'>(result?.grew ? 'before' : 'after');
  const [flash] = useState(() => new Animated.Value(0));
  const [reveal] = useState(() => new Animated.Value(0));
  const [bounce, setBounce] = useState(0);

  useEffect(() => {
    if (!result) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (result.grew) {
      timers.push(setTimeout(() => {
        Animated.sequence([
          Animated.timing(flash, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: native }),
          Animated.timing(flash, { toValue: 0, duration: 520, easing: Easing.in(Easing.quad), useNativeDriver: native }),
        ]).start();
      }, 700));
      timers.push(setTimeout(() => {
        setPhase('after');
        setBounce((n) => n + 1);
      }, 1080));
    } else {
      timers.push(setTimeout(() => setBounce((n) => n + 1), 350));
    }
    Animated.timing(reveal, { toValue: 1, duration: 600, delay: result.grew ? 1300 : 250, useNativeDriver: native }).start();
    return () => timers.forEach(clearTimeout);
  }, [result, flash, reveal]);

  if (!entry || !result) return null;

  const stageNow = phase === 'before' ? stageFor(result.was.totalDays) : stageFor(result.is.totalDays);
  const grownName = result.grew ? STAGES.find((stage) => stage.id === result.grew)!.name : null;
  const reaction = companionForMood(entry.mood);
  const hour = new Date(now).getHours();
  const evening = hour >= 17 || hour < 5;
  const headline = result.grew && phase === 'after'
    ? `Sprout grew into a ${grownName}!`
    : result.grew
      ? 'Something’s happening…'
      : result.newDay
        ? `You showed up ${evening ? 'tonight' : 'today'}`
        : 'Page saved';

  return (
    <View style={styles.root}>
      <Sky />
      <Confetti />
      <View style={[styles.body, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.stage}>
          <Animated.View
            style={[styles.flash, { opacity: flash, transform: [{ scale: flash.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] }) }] }]}
          />
          <View style={styles.halo} />
          <Sprout
            look={phase === 'before' ? { face: 'surprised', prop: 'sparkles' } : POSE_LOOKS[result.grew ? 'party' : result.newDay ? 'star' : 'cheer']}
            stage={stageNow}
            size={200}
            bounce={bounce}
          />
        </View>

        <View style={styles.copy}>
          <Display size={28} style={{ textAlign: 'center' }}>{headline}</Display>
          <Text style={styles.reaction}>“{result.grew && phase === 'after' ? STAGES.find((stage) => stage.id === result.grew)!.blurb : reaction.line}”</Text>
        </View>

        <Animated.View style={[styles.rewards, { opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
          {result.rewards.slice(0, 4).map((reward) => (
            <View key={reward.key} style={styles.reward}>
              <View style={[styles.rewardIcon, { backgroundColor: `${reward.tint}22` }]}>
                <Icon name={reward.icon} size={18} color={reward.tint} strokeWidth={2.3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardTitle} numberOfLines={1}>{reward.title}</Text>
                <Text style={styles.rewardDetail} numberOfLines={1}>{reward.detail}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <View style={styles.actions}>
          <PrimaryButton label="Read your page" icon="arrowRight" onPress={() => router.replace(`/entry/${entry.id}`)} />
          <SecondaryButton label="Back home" onPress={() => router.replace('/')} />
        </View>
      </View>
    </View>
  );
}

const PIECES = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 131) % 900,
  duration: 2600 + ((i * 211) % 1400),
  color: ['#FFB48C', '#FFD27A', '#7FE3B7', '#B9A2FF', '#FFA9CB', '#8EC5FF'][i % 6],
  spin: i % 2 ? 1 : -1,
  wide: i % 3 === 0,
}));

/** A single gentle burst of falling confetti. */
function Confetti() {
  const { height } = useWindowDimensions();
  const [values] = useState(() => PIECES.map(() => new Animated.Value(0)));

  useEffect(() => {
    const animations = values.map((value, i) =>
      Animated.timing(value, { toValue: 1, duration: PIECES[i].duration, delay: PIECES[i].delay, easing: Easing.out(Easing.quad), useNativeDriver: native })
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((animation) => animation.stop());
  }, [values]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PIECES.map((piece, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: -20,
            left: `${piece.left}%`,
            width: piece.wide ? 12 : 7,
            height: piece.wide ? 7 : 12,
            borderRadius: 3,
            backgroundColor: piece.color,
            opacity: values[i].interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: values[i].interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.75] }) },
              { rotate: values[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spin * 540}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: gutter, justifyContent: 'space-between' },
  stage: { alignItems: 'center', justifyContent: 'center', height: 240 },
  halo: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(185, 162, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(185, 162, 255, 0.25)',
  },
  flash: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FFF3D6',
  },
  copy: { alignItems: 'center', gap: 10, paddingHorizontal: 8 },
  reaction: {
    fontFamily: font.displayItalic,
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
    textAlign: 'center',
  },
  rewards: { gap: 8 },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  rewardIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rewardTitle: { fontFamily: font.semi, fontSize: 15, color: colors.text },
  rewardDetail: { fontFamily: font.body, fontSize: 12.5, color: colors.muted },
  actions: { gap: 10 },
});
