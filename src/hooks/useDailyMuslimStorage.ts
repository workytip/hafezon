import { useCallback } from 'react';
import {
  DailyMuslimProgress, DailyMuslimSettings, DailyMuslimDayProgress,
  DEFAULT_DAILY_GOALS,
} from '@/types/dailyMuslim';
import { useSupabaseSync } from './useSupabaseSync';

const buildInitialSettings = (): DailyMuslimSettings => ({
  goals: DEFAULT_DAILY_GOALS.map((g, i) => ({ ...g, order: i })),
});

const DEFAULT_PROGRESS: DailyMuslimProgress = {
  settings: buildInitialSettings(),
  dailyProgress: {},
  lastUpdated: new Date().toISOString(),
};

export const useDailyMuslimStorage = () => {
  const { data: raw, isLoaded, save, clear } = useSupabaseSync<DailyMuslimProgress>(
    'daily_muslim',
    'daily-muslim-tracker'
  );

  // Provide defaults when no data exists yet
  const progress: DailyMuslimProgress = raw ?? DEFAULT_PROGRESS;

  const saveSettings = useCallback((settings: DailyMuslimSettings) => {
    save({
      settings,
      dailyProgress: progress.dailyProgress,
      lastUpdated: new Date().toISOString(),
    });
  }, [progress, save]);

  const updateDayProgress = useCallback((dateKey: string, goalId: string, completed: boolean) => {
    const dayProg = progress.dailyProgress[dateKey] || {};
    save({
      ...progress,
      dailyProgress: {
        ...progress.dailyProgress,
        [dateKey]: { ...dayProg, [goalId]: completed },
      },
      lastUpdated: new Date().toISOString(),
    });
  }, [progress, save]);

  const getDayProgress = useCallback((dateKey: string): DailyMuslimDayProgress => {
    return progress.dailyProgress[dateKey] || {};
  }, [progress]);

  const clearProgress = useCallback(() => {
    clear();
  }, [clear]);

  return { progress, isLoaded, saveSettings, updateDayProgress, getDayProgress, clearProgress };
};
