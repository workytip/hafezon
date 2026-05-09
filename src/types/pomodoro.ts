export type PomodoroMode = 'work' | 'short-break' | 'long-break';

export interface PomodoroSession {
  id: string;
  date: string;
  taskLabel: string;
  duration: number;
  completedAt: string;
}

export interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};
