import { useState, useEffect, useCallback } from 'react';
import {
  DailyMuslimProgress, DailyMuslimSettings, DailyMuslimDayProgress,
  DEFAULT_DAILY_GOALS,
} from '@/types/dailyMuslim';

const STORAGE_KEY = 'daily-muslim-tracker';

const buildInitialSettings = (): DailyMuslimSettings => ({
  goals: DEFAULT_DAILY_GOALS.map((g, i) => ({ ...g, order: i })),
});

export const useDailyMuslimStorage = () => {
  const [progress, setProgress] = useState<DailyMuslimProgress | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProgress(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading daily-muslim progress:', e);
      }
    } else {
      // initialize with defaults but don't persist until user interacts
      setProgress({
        settings: buildInitialSettings(),
        dailyProgress: {},
        lastUpdated: new Date().toISOString(),
      });
    }
    setIsLoaded(true);
  }, []);

  const persist = (data: DailyMuslimProgress) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setProgress(data);
  };

  const saveSettings = useCallback((settings: DailyMuslimSettings) => {
    const data: DailyMuslimProgress = {
      settings,
      dailyProgress: progress?.dailyProgress || {},
      lastUpdated: new Date().toISOString(),
    };
    persist(data);
  }, [progress]);

  const updateDayProgress = useCallback((dateKey: string, goalId: string, completed: boolean) => {
    if (!progress) return;
    const dayProg = progress.dailyProgress[dateKey] || {};
    persist({
      ...progress,
      dailyProgress: {
        ...progress.dailyProgress,
        [dateKey]: { ...dayProg, [goalId]: completed },
      },
      lastUpdated: new Date().toISOString(),
    });
  }, [progress]);

  const getDayProgress = useCallback((dateKey: string): DailyMuslimDayProgress => {
    return progress?.dailyProgress?.[dateKey] || {};
  }, [progress]);

  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProgress({
      settings: buildInitialSettings(),
      dailyProgress: {},
      lastUpdated: new Date().toISOString(),
    });
  }, []);

  return { progress, isLoaded, saveSettings, updateDayProgress, getDayProgress, clearProgress };
};
