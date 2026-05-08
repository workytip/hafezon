import { useState, useEffect, useCallback } from 'react';
import { UserSettings, DailyTask } from '@/types/schedule';

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
  additionalMemorizedPages: number; // صفحات الحفظ اليومي المضافة
}

const STORAGE_KEY = 'quran-memorization-progress';

export const useLocalStorage = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // تحميل البيانات عند بدء التطبيق
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // تأكد من وجود dailyProgress
        if (!parsed.dailyProgress) {
          parsed.dailyProgress = {};
        }
        if (parsed.additionalMemorizedPages === undefined) {
          parsed.additionalMemorizedPages = 0;
        }
        setProgress(parsed);
      } catch (e) {
        console.error('Error loading progress:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // حفظ البيانات
  const saveProgress = useCallback((settings: UserSettings, tasks: DailyTask[]) => {
    const data: UserProgress = {
      settings,
      tasks,
      lastUpdated: new Date().toISOString(),
      completedDays: progress?.completedDays || [],
      dailyProgress: progress?.dailyProgress || {},
      additionalMemorizedPages: progress?.additionalMemorizedPages || 0,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setProgress(data);
  }, [progress]);

  // تحديث التقدم اليومي
  const updateDailyProgress = useCallback((date: string, taskType: keyof TaskCompletion, completed: boolean) => {
    if (!progress) return;
    
    const currentDayProgress = progress.dailyProgress[date] || {
      newMemorization: false,
      nearReview: false,
      farReview: false,
      preparation: false,
      weeklyPreparation: false,
    };
    
    const updatedDayProgress = {
      ...currentDayProgress,
      [taskType]: completed,
    };
    
    const updatedProgress = {
      ...progress,
      dailyProgress: {
        ...progress.dailyProgress,
        [date]: updatedDayProgress,
      },
      lastUpdated: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
    setProgress(updatedProgress);
  }, [progress]);

  const getDailyProgress = useCallback((date: string): TaskCompletion => {
    return progress?.dailyProgress?.[date] || {
      newMemorization: false,
      nearReview: false,
      farReview: false,
      preparation: false,
      weeklyPreparation: false,
    };
  }, [progress]);

  // تحديث الأيام المكتملة
  const markDayComplete = useCallback((dayNumber: number) => {
    if (!progress) return;
    const completedDays = progress.completedDays.includes(dayNumber)
      ? progress.completedDays
      : [...progress.completedDays, dayNumber];
    const updated = { ...progress, completedDays };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setProgress(updated);
  }, [progress]);

  // مسح البيانات
  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProgress(null);
  }, []);

  // إضافة صفحات الحفظ اليومي
  const addMemorizedPages = useCallback((pages: number) => {
    if (!progress) return;
    const updated = {
      ...progress,
      additionalMemorizedPages: (progress.additionalMemorizedPages || 0) + pages,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setProgress(updated);
  }, [progress]);

  // الحصول على إجمالي الصفحات المحفوظة (الأساسية + اليومية)
  const getTotalMemorizedPages = useCallback(() => {
    if (!progress) return 0;
    return (progress.settings?.currentMemorizedPages || 0) + (progress.additionalMemorizedPages || 0);
  }, [progress]);

  return {
    progress,
    isLoaded,
    saveProgress,
    markDayComplete,
    clearProgress,
    updateDailyProgress,
    getDailyProgress,
    addMemorizedPages,
    getTotalMemorizedPages,
  };
};
