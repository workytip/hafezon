import { useCallback } from 'react';
import { PomodoroSession, PomodoroSettings, DEFAULT_POMODORO_SETTINGS } from '@/types/pomodoro';
import { useSupabaseSync } from './useSupabaseSync';

interface PomodoroData {
  sessions: PomodoroSession[];
  settings: PomodoroSettings;
}

const DEFAULT_DATA: PomodoroData = {
  sessions: [],
  settings: DEFAULT_POMODORO_SETTINGS,
};

export function usePomodoroStorage() {
  const { data: raw, isLoaded, save } = useSupabaseSync<PomodoroData>(
    'pomodoro',
    'pomodoro-data'
  );

  const data = raw ?? DEFAULT_DATA;

  const addSession = useCallback((session: Omit<PomodoroSession, 'id'>) => {
    save({
      ...data,
      sessions: [
        ...data.sessions,
        { ...session, id: Date.now().toString() },
      ],
    });
  }, [data, save]);

  const updateSettings = useCallback((settings: PomodoroSettings) => {
    save({ ...data, settings });
  }, [data, save]);

  const todaySessions = data.sessions.filter(
    s => s.date === new Date().toISOString().split('T')[0]
  );

  return {
    sessions: data.sessions,
    todaySessions,
    settings: data.settings,
    isLoaded,
    addSession,
    updateSettings,
    persist: save,
  };
}
