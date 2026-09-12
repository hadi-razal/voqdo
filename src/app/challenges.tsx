import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Body, Card, Display, Kicker, PrimaryButton, Screen, TopBar } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { CHALLENGES, challengeProgress } from '@/lib/challenges';
import { colors, font, gutter } from '@/theme';

export default function Challenges() {
  const router = useRouter();
  const { entries } = useJournal();
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(useCallback(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []));
  return <Screen contentStyle={{ paddingBottom: 40, gap: 18 }}>
    <TopBar onBack={() => router.canGoBack() ? router.back() : router.replace('/')} />
    <View style={styles.head}><Kicker color={colors.success}>THREE DAYS, ONE SMALL SHIFT</Kicker><Display size={28}>Guided journeys</Display><Body>One prompt on each of three different days. Take breaks whenever you need; your progress waits for you.</Body></View>
    {CHALLENGES.map((challenge) => {
      const progress = challengeProgress(entries, challenge.id, now)!;
      return <Card key={challenge.id} style={styles.card}>
        <Kicker color={progress.done ? colors.success : colors.accent}>{progress.done ? 'JOURNEY COMPLETE · BADGE EARNED' : `${progress.completed}/3 DAYS COMPLETE`}</Kicker>
        <Display size={22}>{challenge.title}</Display><Body>{challenge.description}</Body>
        {challenge.prompts.map((prompt, i) => <View key={prompt} style={styles.step}><Text style={[styles.number, i < progress.completed && { color: colors.success }]}>{i < progress.completed ? '✓' : i + 1}</Text><Body style={{ flex: 1 }}>{prompt}</Body></View>)}
        <PrimaryButton label={progress.done ? 'Visit your journal' : progress.todayDone ? 'Today’s step is complete' : progress.completed ? 'Continue journey' : 'Begin journey'} disabled={!progress.done && progress.todayDone} onPress={() => progress.done ? router.navigate('/journal') : router.push({ pathname: '/write', params: { prompt: challenge.prompts[progress.completed], challengeId: challenge.id, challengeStep: String(progress.completed) } })} />
        <Body>{progress.done ? 'Three moments of care, saved in your journal.' : 'Saving a journey entry completes the step. Your usual daily XP still applies.'}</Body>
      </Card>;
    })}
  </Screen>;
}
const styles = StyleSheet.create({ head: { marginHorizontal: gutter, gap: 10 }, card: { marginHorizontal: gutter, padding: 18, gap: 15 }, step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, number: { fontFamily: font.medium, color: colors.accent, fontSize: 15, width: 20 } });
