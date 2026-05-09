import { useState, useEffect, useRef, useId } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Check, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePomodoroContext } from '@/contexts/PomodoroContext';
import { usePomodoroStorage } from '@/hooks/usePomodoroStorage';
import { useSoundSystem, NoiseType, NOISE_OPTIONS } from '@/hooks/useSoundSystem';

const pad = (n: number) => String(n).padStart(2, '0');
const DURATIONS = [5, 10, 15, 25];
const CIRCLE_R = 80;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

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

  const soundMode = localStorage.getItem('pomodoro-sound') ?? 'tick';
  const soundEnabled = soundMode !== 'off';
  const noiseType = (localStorage.getItem('pomodoro-noise-type') ?? 'brown') as NoiseType;

  const [open, setOpen]       = useState(false);
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // stop if another timer claims the slot
  useEffect(() => {
    if (!isActive && running) { setRunning(false); stopNoise(); }
  }, [isActive, running]);

  // noise on/off with running state
  useEffect(() => {
    if (running && (soundMode === 'noise' || soundMode === 'both')) {
      startNoise(noiseType);
    } else {
      stopNoise();
    }
  }, [running, soundMode]);

  // countdown
  useEffect(() => {
    if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      if (soundEnabled && (soundMode === 'tick' || soundMode === 'both')) tick();
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setDone(true);
          release(uid);
          bell();
          stopNoise();
          resetTickCount();
          addSession({
            date: new Date().toISOString().split('T')[0],
            taskLabel,
            duration,
            completedAt: new Date().toISOString(),
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running]);

  // Esc to close overlay
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (running) { setRunning(false); release(uid); }
    else { claim(uid); setRunning(true); setDone(false); }
  };

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRunning(false); setDone(false);
    setTimeLeft(duration * 60); release(uid); resetTickCount();
  };

  const setDur = (e: React.MouseEvent, d: number) => {
    e.stopPropagation();
    if (running) return;
    setDuration(d); setTimeLeft(d * 60); setDone(false);
  };

  const openTimer = (e: React.MouseEvent) => { e.stopPropagation(); setOpen(true); };
  const closeOverlay = (e: React.MouseEvent) => { e.stopPropagation(); setOpen(false); };

  // ── collapsed button ───────────────────────────────────────────────────────
  const collapsedBtn = (
    <button
      onClick={openTimer}
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

  // ── fullscreen overlay ─────────────────────────────────────────────────────
  const noiseLabel = NOISE_OPTIONS.find(o => o.id === noiseType);

  return (
    <>
      {collapsedBtn}

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={e => e.stopPropagation()}
          dir="rtl"
        >
          {/* close */}
          <button
            onClick={closeOverlay}
            className="absolute top-5 left-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="إغلاق (Esc)"
          >
            <X className="h-5 w-5" />
          </button>

          {/* task name */}
          <p className="text-white/60 text-sm mb-2 max-w-xs text-center truncate px-4">{taskLabel}</p>

          {/* duration picker */}
          {!running && !done && (
            <div className="flex gap-2 mb-6">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  onClick={e => setDur(e, d)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    d === duration
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  )}
                >
                  {d} د
                </button>
              ))}
            </div>
          )}

          {/* large circle timer */}
          <div className="relative mb-8">
            <svg width="220" height="220" className="-rotate-90">
              <circle cx="110" cy="110" r={CIRCLE_R}
                fill="none" stroke="white" strokeWidth="6" opacity="0.15" />
              <circle cx="110" cy="110" r={CIRCLE_R}
                fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {done ? (
                <>
                  <Check className="h-12 w-12 text-emerald-400 mb-1" />
                  <span className="text-white text-lg font-bold">أحسنت!</span>
                </>
              ) : (
                <>
                  <span className="text-white text-6xl font-bold tabular-nums">
                    {pad(Math.floor(timeLeft / 60))}:{pad(timeLeft % 60)}
                  </span>
                  <span className="text-white/50 text-sm mt-1">
                    {running ? 'جاري التركيز...' : 'جاهز'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* session count */}
          {taskSessionCount > 0 && (
            <p className="text-white/40 text-xs mb-4">🍅 {taskSessionCount} جلسة مكتملة لهذه المهمة</p>
          )}

          {/* controls */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={reset}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={toggle}
              className="p-5 rounded-full bg-primary hover:opacity-90 text-primary-foreground shadow-lg transition-all active:scale-95"
            >
              {running
                ? <Pause className="h-8 w-8" />
                : <Play className="h-8 w-8 translate-x-0.5" />
              }
            </button>
            <button
              onClick={e => { e.stopPropagation(); }}
              className="p-3 rounded-full bg-white/10 text-white/50 transition-colors cursor-default"
              title={noiseLabel ? `${noiseLabel.icon} ${noiseLabel.label}` : ''}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>

          {/* sound hint */}
          {soundEnabled && noiseLabel && (soundMode === 'noise' || soundMode === 'both') && (
            <p className="text-white/30 text-xs mb-2">
              {noiseLabel.icon} {noiseLabel.label} · يمكن تغييره من إعدادات بومودورو
            </p>
          )}

          {/* esc hint */}
          <p className="text-white/25 text-xs mt-2">اضغط Esc للخروج</p>
        </div>
      )}
    </>
  );
}
