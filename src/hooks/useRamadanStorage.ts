import { useCallback } from 'react';
import { RamadanProgress, RamadanSettings, RamadanDayProgress } from '@/types/ramadan';
import { useSupabaseSync } from './useSupabaseSync';

export const useRamadanStorage = () => {
  const { data: progress, isLoaded, save, clear } = useSupabaseSync<RamadanProgress>(
    'ramadan',
    'ramadan-tracker-progress'
  );

  const saveSettings = useCallback((settings: RamadanSettings) => {
    save({
      settings,
      dailyProgress: progress?.dailyProgress || {},
      lastUpdated: new Date().toISOString(),
    });
  }, [progress, save]);

  const updateDayProgress = useCallback((dayKey: string, goalId: string, completed: boolean) => {
    if (!progress) return;
    const dayProgress = progress.dailyProgress[dayKey] || {};
    save({
      ...progress,
      dailyProgress: {
        ...progress.dailyProgress,
        [dayKey]: { ...dayProgress, [goalId]: completed },
      },
      lastUpdated: new Date().toISOString(),
    });
  }, [progress, save]);

  const getDayProgress = useCallback((dayKey: string): RamadanDayProgress => {
    return progress?.dailyProgress?.[dayKey] || {};
  }, [progress]);

  return { progress, isLoaded, saveSettings, updateDayProgress, getDayProgress, clearProgress: clear };
};
