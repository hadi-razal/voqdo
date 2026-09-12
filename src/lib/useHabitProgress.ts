import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useJournal } from '@/context/journal';
import { habitProgress } from './habits';

export function useHabitProgress() {
  const { entries, settings } = useJournal();
  const [progress, setProgress] = useState(() => habitProgress(entries, Date.now(), settings.weeklyGoal));
  useFocusEffect(useCallback(() => {
    const refresh = () => setProgress(habitProgress(entries, Date.now(), settings.weeklyGoal));
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [entries, settings.weeklyGoal]));
  return progress;
}
