import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { NavLinks } from '@/components/AppNav';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Timer, BookOpen, Sun, TrendingUp, Clock, CalendarDays, Flame, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePomodoroStorage } from '@/hooks/usePomodoroStorage';

// ─── helpers ────────────────────────────────────────────────────────────────

const toDateKey = (d: Date) => d.toISOString().split('T')[0];

function shiftDate(d: Date, days: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + days);
  return c;
}

function getWeekKey(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return toDateKey(mon);
}

function getMonthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

function shortDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
}

function shortWeek(weekStart: string) {
  const d = new Date(weekStart);
  return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
}

function shortMonth(monthKey: string) {
  const [y, m] = monthKey.split('-');
  return new Date(+y, +m - 1).toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' });
}

type RangeTab = 'daily' | 'weekly' | 'monthly';

// ─── custom tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-md" dir="rtl">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-primary">{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

// ─── component ──────────────────────────────────────────────────────────────

export default function Analytics() {
  const { sessions } = usePomodoroStorage();
  const [tab, setTab] = useState<RangeTab>('daily');

  const today = toDateKey(new Date());

  // ── summary stats ──
  const stats = useMemo(() => {
    const total = sessions.length;
    const totalMin = sessions.reduce((s, x) => s + x.duration, 0);
    const activeDays = new Set(sessions.map(s => s.date)).size;
    const todayCount = sessions.filter(s => s.date === today).length;

    const taskCounts: Record<string, number> = {};
    sessions.forEach(s => {
      taskCounts[s.taskLabel] = (taskCounts[s.taskLabel] || 0) + 1;
    });
    const topTask = Object.entries(taskCounts).sort((a, b) => b[1] - a[1])[0];

    // streak
    let streak = 0;
    const check = new Date();
    while (true) {
      const key = toDateKey(check);
      if (!sessions.find(s => s.date === key)) break;
      streak++;
      check.setDate(check.getDate() - 1);
    }

    return { total, totalMin, activeDays, todayCount, topTask, streak };
  }, [sessions, today]);

  // ── daily chart (last 30 days) ──
  const dailyData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = toDateKey(shiftDate(new Date(), i - 29));
      const daySessions = sessions.filter(s => s.date === date);
      return {
        label: shortDay(date),
        جلسات: daySessions.length,
        دقائق: daySessions.reduce((s, x) => s + x.duration, 0),
      };
    });
  }, [sessions]);

  // ── weekly chart (last 12 weeks) ──
  const weeklyData = useMemo(() => {
    const weeks: Record<string, { جلسات: number; دقائق: number }> = {};
    sessions.forEach(s => {
      const k = getWeekKey(s.date);
      if (!weeks[k]) weeks[k] = { جلسات: 0, دقائق: 0 };
      weeks[k].جلسات++;
      weeks[k].دقائق += s.duration;
    });
    const allWeeks = Array.from({ length: 12 }, (_, i) => {
      const d = shiftDate(new Date(), (11 - i) * -7);
      d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
      return toDateKey(d);
    }).sort();
    return allWeeks.map(k => ({
      label: shortWeek(k),
      جلسات: weeks[k]?.جلسات ?? 0,
      دقائق: weeks[k]?.دقائق ?? 0,
    }));
  }, [sessions]);

  // ── monthly chart (last 12 months) ──
  const monthlyData = useMemo(() => {
    const months: Record<string, { جلسات: number; دقائق: number }> = {};
    sessions.forEach(s => {
      const k = getMonthKey(s.date);
      if (!months[k]) months[k] = { جلسات: 0, دقائق: 0 };
      months[k].جلسات++;
      months[k].دقائق += s.duration;
    });
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { label: shortMonth(k), جلسات: months[k]?.جلسات ?? 0, دقائق: months[k]?.دقائق ?? 0 };
    });
  }, [sessions]);

  const chartData = tab === 'daily' ? dailyData : tab === 'weekly' ? weeklyData : monthlyData;

  // ── top tasks ──
  const topTasks = useMemo(() => {
    const counts: Record<string, { sessions: number; minutes: number }> = {};
    sessions.forEach(s => {
      if (!counts[s.taskLabel]) counts[s.taskLabel] = { sessions: 0, minutes: 0 };
      counts[s.taskLabel].sessions++;
      counts[s.taskLabel].minutes += s.duration;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .slice(0, 8);
  }, [sessions]);

  // ── recent sessions ──
  const recent = [...sessions].reverse().slice(0, 20);

  return (
    <div className="min-h-screen bg-background islamic-pattern" dir="rtl">
      <div className="container max-w-5xl py-8 px-4">

        {/* Header */}
        <header className="text-center mb-8 animate-fade-in">
          <NavLinks />
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-3 glow-emerald">
            <TrendingUp className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">تحليلات بومودورو</h1>
          <p className="text-muted-foreground text-sm">تتبع تقدمك وإنتاجيتك عبر الوقت</p>
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { icon: <Timer className="h-5 w-5" />, label: 'إجمالي الجلسات', value: stats.total, unit: 'جلسة' },
            { icon: <Clock className="h-5 w-5" />, label: 'إجمالي الوقت', value: stats.totalMin, unit: 'دقيقة' },
            { icon: <CalendarDays className="h-5 w-5" />, label: 'أيام نشطة', value: stats.activeDays, unit: 'يوم' },
            { icon: <Flame className="h-5 w-5" />, label: 'أيام متتالية', value: stats.streak, unit: 'يوم' },
          ].map((s, i) => (
            <div key={i} className="card-islamic p-4 text-center">
              <div className="inline-flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary mb-2">
                {s.icon}
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Today's count */}
        {stats.todayCount > 0 && (
          <div className="card-islamic p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">اليوم</p>
              <p className="text-xs text-muted-foreground">أحسنت! استمر في التركيز</p>
            </div>
            <div className="text-3xl font-bold text-primary flex items-center gap-2">
              🍅 <span>{stats.todayCount}</span>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="card-islamic p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base">نشاط الجلسات</h2>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly'] as RangeTab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-all',
                    tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {{ daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري' }[t]}
                </button>
              ))}
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              لا توجد بيانات بعد. ابدأ جلسة بومودورو لتظهر هنا.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  interval={tab === 'daily' ? 4 : 0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="جلسات" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.جلسات > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                      opacity={entry.جلسات > 0 ? 1 : 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top tasks + recent sessions */}
        <div className="grid sm:grid-cols-2 gap-6 mb-6">

          {/* Top tasks */}
          <div className="card-islamic p-5">
            <h2 className="font-bold text-base mb-4">أكثر المهام تركيزاً</h2>
            {topTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">لا توجد بيانات بعد</p>
            ) : (
              <div className="space-y-3">
                {topTasks.map(([label, data], i) => {
                  const maxSessions = topTasks[0][1].sessions;
                  const pct = Math.round((data.sessions / maxSessions) * 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="truncate flex-1 text-foreground">{label}</span>
                        <span className="shrink-0 mr-2 text-primary font-bold">🍅 {data.sessions}</span>
                      </div>
                      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent sessions */}
          <div className="card-islamic p-5">
            <h2 className="font-bold text-base mb-4">آخر الجلسات</h2>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">لا توجد جلسات بعد</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recent.map(s => (
                  <div key={s.id} className="flex items-start justify-between gap-2 text-xs py-1.5 border-b border-border/40 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{s.taskLabel}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {new Date(s.completedAt).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className="shrink-0 text-primary font-medium">{s.duration} د</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
