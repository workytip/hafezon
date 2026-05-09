import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Timer, Play, Pause, RotateCcw, BookOpen, Sun, Settings2, X, Check, TrendingUp, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { usePomodoroStorage } from '@/hooks/usePomodoroStorage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDailyMuslimStorage } from '@/hooks/useDailyMuslimStorage';
import { useSoundSystem, SoundMode, NoiseType, NOISE_OPTIONS } from '@/hooks/useSoundSystem';
import { PomodoroMode, PomodoroSettings, DEFAULT_POMODORO_SETTINGS } from '@/types/pomodoro';

// ─── helpers ────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');
const toDateKey = (d: Date) => d.toISOString().split('T')[0];

function modeDuration(mode: PomodoroMode, settings: PomodoroSettings) {
  if (mode === 'work') return settings.workDuration;
  if (mode === 'short-break') return settings.shortBreakDuration;
  return settings.longBreakDuration;
}

const MODE_LABELS: Record<PomodoroMode, string> = {
  work: 'وقت العمل',
  'short-break': 'استراحة قصيرة',
  'long-break': 'استراحة طويلة',
};

const MODE_COLORS: Record<PomodoroMode, string> = {
  work: 'text-primary',
  'short-break': 'text-emerald-400',
  'long-break': 'text-blue-400',
};

const CIRCLE_R = 88;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

// ─── component ──────────────────────────────────────────────────────────────

export default function Pomodoro() {
  const { todaySessions, settings, addSession, updateSettings } = usePomodoroStorage();
  const { progress: quranProgress } = useLocalStorage();
  const { progress: dailyMuslimProgress } = useDailyMuslimStorage();

  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [draftSettings, setDraftSettings] = useState<PomodoroSettings>(settings);
  const [completedThisSession, setCompletedThisSession] = useState(false);
  const [soundMode, setSoundMode] = useState<SoundMode>(() =>
    (localStorage.getItem('pomodoro-sound') as SoundMode) ?? 'tick'
  );
  const [noiseType, setNoiseType] = useState<NoiseType>(() =>
    (localStorage.getItem('pomodoro-noise-type') as NoiseType) ?? 'brown'
  );

  const { tick, startNoise, stopNoise, bell, resetTickCount } = useSoundSystem();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = modeDuration(mode, settings) * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const strokeOffset = CIRCUMFERENCE * (timeLeft / totalSeconds);

  const todayTasks = useMemo(() => {
    const today = toDateKey(new Date());
    const tasks: { label: string }[] = [];

    const dayTask = quranProgress?.tasks?.find(t => t.date === today);
    if (dayTask) {
      if (dayTask.newMemorization?.description)
        tasks.push({ label: `📖 ${dayTask.newMemorization.description}` });
      if (dayTask.nearReview?.description)
        tasks.push({ label: `🔄 ${dayTask.nearReview.description}` });
      if (dayTask.farReview?.description)
        tasks.push({ label: `📚 ${dayTask.farReview.description}` });
    }

    const dayGoalProgress = dailyMuslimProgress?.dailyProgress?.[today] ?? {};
    (dailyMuslimProgress?.settings?.goals ?? [])
      .filter(g => !dayGoalProgress[g.id])
      .forEach(g => tasks.push({ label: `${g.icon} ${g.label}` }));

    return tasks;
  }, [quranProgress, dailyMuslimProgress]);

  // sync timeLeft when mode or settings change
  useEffect(() => {
    if (!isRunning) setTimeLeft(modeDuration(mode, settings) * 60);
  }, [mode, settings]);

  // start/stop noise when running state or noise type changes
  useEffect(() => {
    if (isRunning && (soundMode === 'noise' || soundMode === 'both')) {
      stopNoise();
      setTimeout(() => startNoise(noiseType), 50);
    } else {
      stopNoise();
    }
  }, [isRunning, soundMode, noiseType]);

  // countdown
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      if (soundMode === 'tick' || soundMode === 'both') tick();
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          bell();
          stopNoise();
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [isRunning, soundMode]);

  const handleComplete = useCallback(() => {
    if (mode === 'work') {
      const next = sessionCount + 1;
      setSessionCount(next);
      setCompletedThisSession(true);
      addSession({
        date: toDateKey(new Date()),
        taskLabel: currentTask || 'جلسة عمل',
        duration: settings.workDuration,
        completedAt: new Date().toISOString(),
      });
      // auto-switch to break
      const isLong = next % settings.sessionsBeforeLongBreak === 0;
      setMode(isLong ? 'long-break' : 'short-break');
    } else {
      setMode('work');
      setCompletedThisSession(false);
    }
  }, [mode, sessionCount, currentTask, settings, addSession]);

  const reset = () => {
    setIsRunning(false);
    stopNoise();
    resetTickCount();
    setTimeLeft(modeDuration(mode, settings) * 60);
    setCompletedThisSession(false);
  };

  const switchMode = (m: PomodoroMode) => {
    setIsRunning(false);
    stopNoise();
    resetTickCount();
    setMode(m);
    setTimeLeft(modeDuration(m, settings) * 60);
    setCompletedThisSession(false);
  };

  const cycleSoundMode = () => {
    const order: SoundMode[] = ['off', 'tick', 'noise', 'both'];
    const next = order[(order.indexOf(soundMode) + 1) % order.length];
    setSoundMode(next);
    localStorage.setItem('pomodoro-sound', next);
  };

  const changeNoiseType = (type: NoiseType) => {
    setNoiseType(type);
    localStorage.setItem('pomodoro-noise-type', type);
  };

  const saveSettings = () => {
    updateSettings(draftSettings);
    setShowSettings(false);
    reset();
  };

  const totalTodayMinutes = todaySessions.reduce((s, x) => s + x.duration, 0);

  return (
    <div className="min-h-screen bg-background islamic-pattern" dir="rtl">
      <div className="container max-w-3xl py-8 px-4">

        {/* Header */}
        <header className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
              aria-label="الإعدادات"
            >
              <Settings2 className="h-5 w-5" />
            </button>
          </div>

          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-3 glow-emerald">
            <Timer className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">مؤقت بومودورو</h1>
          <p className="text-muted-foreground text-sm">ركّز على أهدافك اليومية بجلسات منتجة</p>
        </header>

        {/* Mode tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {(['work', 'short-break', 'long-break'] as PomodoroMode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                mode === m
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Timer circle */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <svg width="220" height="220" className="-rotate-90">
              {/* track */}
              <circle
                cx="110" cy="110" r={CIRCLE_R}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/30"
              />
              {/* progress */}
              <circle
                cx="110" cy="110" r={CIRCLE_R}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
                className={cn('transition-all duration-1000', MODE_COLORS[mode])}
              />
            </svg>

            {/* time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-5xl font-bold tabular-nums', MODE_COLORS[mode])}>
                {pad(Math.floor(timeLeft / 60))}:{pad(timeLeft % 60)}
              </span>
              <span className="text-xs text-muted-foreground mt-1">{MODE_LABELS[mode]}</span>
              {completedThisSession && (
                <span className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                  <Check className="h-3 w-3" /> اكتملت الجلسة
                </span>
              )}
            </div>
          </div>

          {/* Session dots */}
          <div className="flex gap-2 mt-4">
            {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full transition-all',
                  i < (sessionCount % settings.sessionsBeforeLongBreak)
                    ? 'bg-primary scale-110'
                    : 'bg-muted/50'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            🍅 {sessionCount} جلسة مكتملة اليوم
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            className="rounded-full h-11 w-11"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            onClick={() => setIsRunning(r => !r)}
            className="btn-primary-islamic rounded-full h-14 w-14 shadow-lg"
          >
            {isRunning
              ? <Pause className="h-6 w-6" />
              : <Play className="h-6 w-6 translate-x-0.5" />
            }
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={cycleSoundMode}
            title={{ off: 'الصوت مغلق', tick: 'تيك-توك', noise: 'ضوضاء بيضاء', both: 'تيك + ضوضاء' }[soundMode]}
            className={cn('rounded-full h-11 w-11', soundMode !== 'off' && 'border-primary text-primary')}
          >
            {soundMode === 'off' ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
        {soundMode !== 'off' && (
          <p className="text-center text-xs text-muted-foreground -mt-5 mb-6">
            {{ tick: '🕐 تيك-توك', noise: '🌊 ضوضاء بيضاء', both: '🕐🌊 تيك + ضوضاء' }[soundMode]}
            {' · '}اضغط للتغيير
          </p>
        )}

        {/* Task selector */}
        <div className="card-islamic p-5 mb-6">
          <h2 className="font-semibold text-sm text-muted-foreground mb-3">المهمة الحالية</h2>
          <input
            type="text"
            placeholder="اكتب ما تعمل عليه الآن..."
            value={currentTask}
            onChange={e => setCurrentTask(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary mb-3"
          />
          {todayTasks.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-2">أهداف اليوم:</p>
              <div className="flex flex-wrap gap-2">
                {todayTasks.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTask(t.label)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-lg border transition-all text-right',
                      currentTask === t.label
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-muted/30 border-border hover:bg-primary/10 hover:border-primary/30'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Today's progress */}
        {todaySessions.length > 0 && (
          <div className="card-islamic p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">جلسات اليوم</h2>
              <span className="text-xs text-muted-foreground">{totalTodayMinutes} دقيقة</span>
            </div>
            <Progress value={Math.min((todaySessions.length / 8) * 100, 100)} className="h-2 mb-3" />
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {[...todaySessions].reverse().map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate flex-1 text-right">{s.taskLabel}</span>
                  <span className="mr-3 shrink-0 text-primary font-medium">{s.duration} د</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-islamic p-6 w-full max-w-sm" dir="rtl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">إعدادات المؤقت</h3>
              <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {(
              [
                ['workDuration', 'وقت العمل (دقيقة)'],
                ['shortBreakDuration', 'استراحة قصيرة (دقيقة)'],
                ['longBreakDuration', 'استراحة طويلة (دقيقة)'],
                ['sessionsBeforeLongBreak', 'جلسات قبل الاستراحة الطويلة'],
              ] as [keyof PomodoroSettings, string][]
            ).map(([key, label]) => (
              <div key={key} className="mb-4">
                <label className="text-sm text-muted-foreground block mb-1">{label}</label>
                <input
                  type="number"
                  min={1}
                  max={key === 'sessionsBeforeLongBreak' ? 8 : 90}
                  value={draftSettings[key]}
                  onChange={e => setDraftSettings(d => ({ ...d, [key]: Number(e.target.value) }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}

            {/* Noise type picker */}
            <div className="mb-5">
              <p className="text-sm text-muted-foreground mb-2">نوع الصوت المحيط</p>
              <div className="grid grid-cols-3 gap-2">
                {NOISE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => changeNoiseType(opt.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all',
                      noiseType === opt.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                    )}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-[11px] font-medium leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
              {soundMode === 'off' || soundMode === 'tick' ? (
                <p className="text-[11px] text-muted-foreground mt-2 text-center">
                  فعّل وضع "ضوضاء" أو "كلاهما" لسماع الصوت المحيط
                </p>
              ) : null}
            </div>

            <div className="flex gap-2 mt-5">
              <Button onClick={saveSettings} className="btn-primary-islamic flex-1">حفظ</Button>
              <Button variant="outline" onClick={() => { setDraftSettings(DEFAULT_POMODORO_SETTINGS); }} className="flex-1">
                افتراضي
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
