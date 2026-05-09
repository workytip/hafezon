import { useState, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { Timer, Play, Pause, RotateCcw, X, Check, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePomodoroContext } from '@/contexts/PomodoroContext';
import { usePomodoroStorage } from '@/hooks/usePomodoroStorage';
import { useSoundSystem, SoundMode, NoiseType, NOISE_OPTIONS } from '@/hooks/useSoundSystem';

const pad = (n: number) => String(n).padStart(2, '0');
const DURATIONS = [5, 10, 15, 25];
const CIRCLE_R = 120;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

// Read fresh from localStorage every call — never stale
const getSoundMode = (): SoundMode =>
  (localStorage.getItem('pomodoro-sound') as SoundMode) ?? 'tick';
const getNoiseType = (): NoiseType =>
  (localStorage.getItem('pomodoro-noise-type') as NoiseType) ?? 'brown';

const SOUND_CYCLE: SoundMode[] = ['off', 'tick', 'noise', 'both'];
const SOUND_LABELS: Record<SoundMode, string> = {
  off: '🔇 صامت', tick: '🕐 تيك-توك', noise: '🌊 محيطي', both: '🕐🌊 كلاهما',
};

interface MiniPomodoroProps {
  taskLabel: string;
  className?: string;
}

export function MiniPomodoro({ taskLabel, className }: MiniPomodoroProps) {
  const uid = useId();
  const { activeId, claim, release } = usePomodoroContext();
  const { settings, addSession, sessions } = usePomodoroStorage();
  const { tick, bell, startNoise, stopNoise, resetTickCount } = useSoundSystem();

  const taskSessionCount = sessions.filter(s => s.taskLabel === taskLabel).length;

  // local mirror of sound prefs so the overlay re-renders when user cycles
  const [soundMode, setSoundMode] = useState<SoundMode>(getSoundMode);
  const [noiseType, setNoiseType] = useState<NoiseType>(getNoiseType);

  const [open, setOpen]         = useState(false);
  const [duration, setDuration] = useState(settings.workDuration);
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);

  const isActive = activeId === uid;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = duration * 60;
  const pct = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const strokeOffset = CIRCUMFERENCE * (1 - pct / 100);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopNoise();
    };
  }, []);

  // stop if another timer steals the slot
  useEffect(() => {
    if (!isActive && running) { setRunning(false); stopNoise(); }
  }, [isActive]);

  // noise lifecycle tied to running state
  useEffect(() => {
    const mode = getSoundMode();
    if (running && (mode === 'noise' || mode === 'both')) {
      startNoise(getNoiseType());
    } else {
      stopNoise();
    }
  }, [running]);

  // countdown
  useEffect(() => {
    if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      const mode = getSoundMode();
      if (mode === 'tick' || mode === 'both') tick();
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false); setDone(true);
          release(uid); bell(); stopNoise(); resetTickCount();
          addSession({
            date: new Date().toISOString().split('T')[0],
            taskLabel, duration,
            completedAt: new Date().toISOString(),
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running]);

  // Esc closes overlay
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (running) { setRunning(false); release(uid); }
    else { claim(uid); setRunning(true); setDone(false); }
  };

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRunning(false); setDone(false);
    setTimeLeft(duration * 60); release(uid); resetTickCount(); stopNoise();
  };

  const setDur = (e: React.MouseEvent, d: number) => {
    e.stopPropagation();
    if (running) return;
    setDuration(d); setTimeLeft(d * 60); setDone(false);
  };

  const cycleSoundInOverlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = SOUND_CYCLE[(SOUND_CYCLE.indexOf(getSoundMode()) + 1) % SOUND_CYCLE.length];
    localStorage.setItem('pomodoro-sound', next);
    setSoundMode(next);
    if (running) {
      stopNoise();
      if (next === 'noise' || next === 'both') setTimeout(() => startNoise(getNoiseType()), 50);
    }
  };

  const changeNoiseType = (e: React.MouseEvent, type: NoiseType) => {
    e.stopPropagation();
    localStorage.setItem('pomodoro-noise-type', type);
    setNoiseType(type);
    if (running && (getSoundMode() === 'noise' || getSoundMode() === 'both')) {
      stopNoise();
      setTimeout(() => startNoise(type), 50);
    }
  };

  // ── collapsed button ───────────────────────────────────────────────────────
  const collapsedBtn = (
    <button
      onClick={e => { e.stopPropagation(); setOpen(true); }}
      title="ابدأ مؤقت بومودورو"
      className={cn(
        'flex items-center gap-1 p-1 rounded-md transition-colors text-muted-foreground hover:text-primary hover:bg-primary/10',
        running && 'text-primary animate-pulse',
        className
      )}
    >
      <Timer className="h-3.5 w-3.5" />
      {taskSessionCount > 0 && (
        <span className="text-[10px] font-bold text-primary leading-none">{taskSessionCount}</span>
      )}
    </button>
  );

  // ── fullscreen overlay (via portal so it always covers the entire page) ────
  const overlay = open ? createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
      style={{ margin: 0, padding: 0 }}
      onClick={e => e.stopPropagation()}
      dir="rtl"
    >
      {/* top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        <button
          onClick={cycleSoundInOverlay}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-colors"
          title="تغيير وضع الصوت"
        >
          {soundMode === 'off' ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          <span className="text-xs">{SOUND_LABELS[soundMode]}</span>
        </button>
        <button
          onClick={e => { e.stopPropagation(); setOpen(false); }}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          title="إغلاق (Esc)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* task name */}
      <p className="text-white/50 text-sm mb-4 max-w-sm text-center px-8 truncate">{taskLabel}</p>

      {/* noise type picker — visible whenever sound mode includes ambient */}
      {(soundMode === 'noise' || soundMode === 'both') && (
        <div className="flex flex-wrap gap-2 mb-5 justify-center max-w-sm px-4">
          {NOISE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={e => changeNoiseType(e, opt.id)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                noiseType === opt.id
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
              )}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* duration picker */}
      {!running && !done && (
        <div className="flex gap-2 mb-8">
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={e => setDur(e, d)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                d === duration
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
              )}
            >
              {d} د
            </button>
          ))}
        </div>
      )}

      {/* large circle */}
      <div className="relative mb-10">
        <svg width="300" height="300" className="-rotate-90">
          <circle cx="150" cy="150" r={CIRCLE_R}
            fill="none" stroke="white" strokeWidth="7" opacity="0.1" />
          <circle cx="150" cy="150" r={CIRCLE_R}
            fill="none" stroke="hsl(var(--primary))" strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          {done ? (
            <>
              <Check className="h-14 w-14 text-emerald-400" />
              <span className="text-white text-xl font-bold">أحسنت!</span>
            </>
          ) : (
            <>
              <span className="text-white font-bold tabular-nums" style={{ fontSize: '4.5rem', lineHeight: 1 }}>
                {pad(Math.floor(timeLeft / 60))}:{pad(timeLeft % 60)}
              </span>
              <span className="text-white/40 text-sm">
                {running ? '● جاري التركيز' : 'اضغط للبدء'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* session badge */}
      {taskSessionCount > 0 && (
        <p className="text-white/30 text-xs mb-6">🍅 {taskSessionCount} جلسة مكتملة لهذه المهمة</p>
      )}

      {/* controls */}
      <div className="flex items-center gap-5">
        <button
          onClick={reset}
          className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
        >
          <RotateCcw className="h-6 w-6" />
        </button>
        <button
          onClick={toggle}
          className="p-6 rounded-full bg-primary hover:opacity-90 text-primary-foreground shadow-2xl transition-all active:scale-95"
        >
          {running
            ? <Pause className="h-10 w-10" />
            : <Play className="h-10 w-10 translate-x-0.5" />
          }
        </button>
        <div className="w-14" />
      </div>

      {/* esc hint */}
      <p className="absolute bottom-5 text-white/20 text-xs">Esc للخروج</p>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {collapsedBtn}
      {overlay}
    </>
  );
}
