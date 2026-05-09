import { useState, useEffect, useRef, useId } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePomodoroContext } from '@/contexts/PomodoroContext';
import { usePomodoroStorage } from '@/hooks/usePomodoroStorage';

const pad = (n: number) => String(n).padStart(2, '0');
const DURATIONS = [5, 10, 15, 25];

interface MiniPomodoroProps {
  taskLabel: string;
  className?: string;
}

export function MiniPomodoro({ taskLabel, className }: MiniPomodoroProps) {
  const uid = useId();
  const { activeId, claim, release } = usePomodoroContext();
  const { settings, addSession } = usePomodoroStorage();

  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState(settings.workDuration);
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const isActive = activeId === uid;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = duration * 60;
  const pct = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  // stop if another timer claims the slot
  useEffect(() => {
    if (!isActive && running) {
      setRunning(false);
    }
  }, [isActive, running]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setDone(true);
          release(uid);
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

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (running) {
      setRunning(false);
      release(uid);
    } else {
      claim(uid);
      setRunning(true);
      setDone(false);
    }
  };

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRunning(false);
    setDone(false);
    setTimeLeft(duration * 60);
    release(uid);
  };

  const close = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRunning(false);
    setDone(false);
    setOpen(false);
    setTimeLeft(duration * 60);
    release(uid);
  };

  const setDur = (e: React.MouseEvent, d: number) => {
    e.stopPropagation();
    if (running) return;
    setDuration(d);
    setTimeLeft(d * 60);
    setDone(false);
  };

  const openTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  if (!open) {
    return (
      <button
        onClick={openTimer}
        title="ابدأ مؤقت بومودورو"
        className={cn(
          'p-1 rounded-md transition-colors text-muted-foreground hover:text-primary hover:bg-primary/10',
          className
        )}
      >
        <Timer className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div
      onClick={e => e.stopPropagation()}
      className={cn(
        'flex flex-col gap-1.5 pt-2 mt-2 border-t border-border/50',
        className
      )}
    >
      {/* duration picker */}
      {!running && !done && (
        <div className="flex gap-1">
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={e => setDur(e, d)}
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded transition-colors',
                d === duration
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              )}
            >
              {d}د
            </button>
          ))}
        </div>
      )}

      {/* timer row */}
      <div className="flex items-center gap-1.5">
        {/* mini ring */}
        <div className="relative w-7 h-7 shrink-0">
          <svg width="28" height="28" className="-rotate-90">
            <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor"
              strokeWidth="2.5" className="text-muted/30" />
            <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 11}
              strokeDashoffset={2 * Math.PI * 11 * (1 - pct / 100)}
              className={done ? 'text-emerald-500' : 'text-primary transition-all duration-1000'}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {done
              ? <Check className="h-3 w-3 text-emerald-500" />
              : <span className="text-[7px] font-bold text-primary tabular-nums leading-none">
                  {pad(Math.floor(timeLeft / 60))}
                </span>
            }
          </div>
        </div>

        {/* time */}
        <span className={cn(
          'text-xs font-mono font-bold tabular-nums w-10',
          done ? 'text-emerald-500' : running ? 'text-primary' : 'text-foreground'
        )}>
          {done ? 'أحسنت' : `${pad(Math.floor(timeLeft / 60))}:${pad(timeLeft % 60)}`}
        </span>

        {/* controls */}
        <button onClick={toggle}
          className="p-0.5 rounded hover:bg-primary/10 text-primary transition-colors">
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button onClick={reset}
          className="p-0.5 rounded hover:bg-muted text-muted-foreground transition-colors">
          <RotateCcw className="h-3 w-3" />
        </button>
        <button onClick={close}
          className="p-0.5 rounded hover:bg-muted text-muted-foreground transition-colors mr-auto">
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
