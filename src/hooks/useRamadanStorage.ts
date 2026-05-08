import { useState, useEffect, useCallback } from 'react';
import { RamadanProgress, RamadanSettings, RamadanDayProgress } from '@/types/ramadan';

const STORAGE_KEY = 'ramadan-tracker-progress';

export const useRamadanStorage = () => {
  const [progress, setProgress] = useState<RamadanProgress | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProgress(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading ramadan progress:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveSettings = useCallback((settings: RamadanSettings) => {
    const data: RamadanProgress = {
      settings,
      dailyProgress: progress?.dailyProgress || {},
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setProgress(data);
  }, [progress]);

  const updateDayProgress = useCallback((dayKey: string, goalId: string, completed: boolean) => {
    if (!progress) return;
    const dayProgress = progress.dailyProgress[dayKey] || {};
    const updated: RamadanProgress = {
      ...progress,
      dailyProgress: {
        ...progress.dailyProgress,
        [dayKey]: { ...dayProgress, [goalId]: completed },
      },
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setProgress(updated);
  }, [progress]);

  const getDayProgress = useCallback((dayKey: string): RamadanDayProgress => {
    return progress?.dailyProgress?.[dayKey] || {};
  }, [progress]);

  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProgress(null);
  }, []);

  return { progress, isLoaded, saveSettings, updateDayProgress, getDayProgress, clearProgress };
};
