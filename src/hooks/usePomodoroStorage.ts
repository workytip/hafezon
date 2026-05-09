import { useState, useEffect, useCallback } from 'react';
import { PomodoroSession, PomodoroSettings, DEFAULT_POMODORO_SETTINGS } from '@/types/pomodoro';

const STORAGE_KEY = 'pomodoro-data';

interface PomodoroData {
  sessions: PomodoroSession[];
  settings: PomodoroSettings;
}

export function usePomodoroStorage() {
  const [data, setData] = useState<PomodoroData>({
    sessions: [],
    settings: DEFAULT_POMODORO_SETTINGS,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = useCallback((next: PomodoroData) => {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addSession = useCallback((session: Omit<PomodoroSession, 'id'>) => {
    setData(prev => {
      const next = {
        ...prev,
        sessions: [
          ...prev.sessions,
          { ...session, id: Date.now().toString() },
        ],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateSettings = useCallback((settings: PomodoroSettings) => {
    setData(prev => {
      const next = { ...prev, settings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const todaySessions = data.sessions.filter(
    s => s.date === new Date().toISOString().split('T')[0]
  );

  return { sessions: data.sessions, todaySessions, settings: data.settings, addSession, updateSettings, persist };
}
