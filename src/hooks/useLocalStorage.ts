import { useCallback } from 'react';
import { UserSettings, DailyTask } from '@/types/schedule';
import { useSupabaseSync } from './useSupabaseSync';

interface TaskCompletion {
  newMemorization: boolean;
  nearReview: boolean;
  farReview: boolean;
  preparation: boolean;
  weeklyPreparation: boolean;
}

interface UserProgress {
  settings: UserSettings;
  tasks: DailyTask[];
  lastUpdated: string;
  completedDays: number[];
  dailyProgress: Record<string, TaskCompletion>;
  additionalMemorizedPages: number;
}

export const useLocalStorage = () => {
  const { data: progress, isLoaded, save, clear } = useSupabaseSync<UserProgress>(
    'quran',
    'quran-memorization-progress'
  );

  const saveProgress = useCallback((settings: UserSettings, tasks: DailyTask[]) => {
    const data: UserProgress = {
      settings,
      tasks,
      lastUpdated: new Date().toISOString(),
      completedDays: progress?.completedDays || [],
      dailyProgress: progress?.dailyProgress || {},
      additionalMemorizedPages: progress?.additionalMemorizedPages || 0,
    };
    save(data);
  }, [progress, save]);

  const updateDailyProgress = useCallback((
    date: string,
    taskType: keyof TaskCompletion,
    completed: boolean,
    pagesDelta = 0
  ) => {
    if (!progress) return;

    const current = progress.dailyProgress[date] || {
      newMemorization: false,
      nearReview: false,
      farReview: false,
      preparation: false,
      weeklyPreparation: false,
    };

    save({
      ...progress,
      dailyProgress: {
        ...progress.dailyProgress,
        [date]: { ...current, [taskType]: completed },
      },
      additionalMemorizedPages: (progress.additionalMemorizedPages || 0) + pagesDelta,
      lastUpdated: new Date().toISOString(),
    });
  }, [progress, save]);

  const getDailyProgress = useCallback((date: string): TaskCompletion => {
    return progress?.dailyProgress?.[date] || {
      newMemorization: false,
      nearReview: false,
      farReview: false,
      preparation: false,
      weeklyPreparation: false,
    };
  }, [progress]);

  const markDayComplete = useCallback((dayNumber: number) => {
    if (!progress) return;
    const completedDays = progress.completedDays.includes(dayNumber)
      ? progress.completedDays
      : [...progress.completedDays, dayNumber];
    save({ ...progress, completedDays });
  }, [progress, save]);

  const addMemorizedPages = useCallback((pages: number) => {
    if (!progress) return;
    save({
      ...progress,
      additionalMemorizedPages: (progress.additionalMemorizedPages || 0) + pages,
      lastUpdated: new Date().toISOString(),
    });
  }, [progress, save]);

  const getTotalMemorizedPages = useCallback(() => {
    if (!progress) return 0;
    return (progress.settings?.currentMemorizedPages || 0) + (progress.additionalMemorizedPages || 0);
  }, [progress]);

  return {
    progress,
    isLoaded,
    saveProgress,
    markDayComplete,
    clearProgress: clear,
    updateDailyProgress,
    getDailyProgress,
    addMemorizedPages,
    getTotalMemorizedPages,
  };
};
