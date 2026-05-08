import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun, ChevronRight, ChevronLeft, Calendar, Settings2, RotateCcw,
  Sparkles, Image as ImageIcon, FileText, MessageSquare, BookOpen,
  Plus, Trash2, ArrowLeft, ArrowRight, CheckCircle2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useDailyMuslimStorage } from '@/hooks/useDailyMuslimStorage';
import {
  DailyMuslimGoal, PRAYER_SECTIONS, DAILY_EMOJI_OPTIONS,
} from '@/types/dailyMuslim';
import { DailyMuslimExportTable } from '@/components/DailyMuslimExportTable';

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

const formatArabicFull = (d: Date) =>
  d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const formatArabicShort = (d: Date) =>
  d.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' });

const DailyMuslim = () => {
  const { progress, isLoaded, saveSettings, updateDayProgress, getDayProgress, clearProgress } = useDailyMuslimStorage();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [showSettings, setShowSettings] = useState(false);
  const [exportMode, setExportMode] = useState<null | 'day' | 'week' | 'month'>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [newGoalLabel, setNewGoalLabel] = useState('');
  const [newGoalIcon, setNewGoalIcon] = useState('⭐');
  const [newGoalSection, setNewGoalSection] = useState('fajr');

  const exportRef = useRef<HTMLDivElement>(null);

  const goals = progress?.settings?.goals || [];
  const selectedKey = toDateKey(selectedDate);

  // grouped goals for display
  const goalsBySection = useMemo(() => PRAYER_SECTIONS.map(sec => ({
    section: sec,
    items: goals.filter(g => g.sectionId === sec.id).sort((a, b) => a.order - b.order),
  })), [goals]);

  const dayProgress = getDayProgress(selectedKey);
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => dayProgress[g.id]).length;
  const dayPct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // dates for week view (selected day - 6 → selected day)
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 6));
  }, [selectedDate]);

  // dates for month view (calendar month containing selectedDate)
  const monthDates = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => new Date(y, m, i + 1));
  }, [selectedDate]);

  const toggleGoal = (goalId: string) => {
    updateDayProgress(selectedKey, goalId, !dayProgress[goalId]);
  };

  const addCustomGoal = () => {
    if (!newGoalLabel.trim()) return;
    const newGoal: DailyMuslimGoal = {
      id: `custom-${Date.now()}`,
      label: newGoalLabel.trim(),
      icon: newGoalIcon,
      sectionId: newGoalSection,
      order: goals.length,
    };
    saveSettings({ goals: [...goals, newGoal] });
    setNewGoalLabel('');
    setNewGoalIcon('⭐');
    toast.success('تمت إضافة الهدف');
  };

  const removeGoal = (id: string) => {
    saveSettings({ goals: goals.filter(g => g.id !== id) });
  };

  const moveGoal = (id: string, dir: 'up' | 'down') => {
    const idx = goals.findIndex(g => g.id === id);
    if (idx < 0) return;
    const goal = goals[idx];
    const sameSection = goals.filter(g => g.sectionId === goal.sectionId).sort((a, b) => a.order - b.order);
    const sIdx = sameSection.findIndex(g => g.id === id);
    const target = dir === 'up' ? sameSection[sIdx - 1] : sameSection[sIdx + 1];
    if (!target) return;
    const swapped = goals.map(g => {
      if (g.id === goal.id) return { ...g, order: target.order };
      if (g.id === target.id) return { ...g, order: goal.order };
      return g;
    });
    saveSettings({ goals: swapped });
  };

  const handleReset = () => {
    if (confirm('هل تريد فعلاً مسح جميع البيانات وإعادة الأهداف الافتراضية؟')) {
      clearProgress();
      toast.success('تمت إعادة التعيين');
    }
  };

  // ================= EXPORT =================
  const runExport = async (kind: 'day' | 'week' | 'month', as: 'image' | 'pdf') => {
    setExportMode(kind);
    // wait for off-screen render
    await new Promise(r => setTimeout(r, 100));
    if (!exportRef.current) {
      setExportMode(null);
      return;
    }
    setIsExporting(true);
    toast.info('جاري تحضير الملف...');
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise(r => setTimeout(r, 250));
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: as === 'image' ? 3 : 2,
        useCORS: true,
        logging: false,
        windowWidth: 1400,
      });
      if (as === 'image') {
        const link = document.createElement('a');
        link.download = `daily-muslim-${kind}-${selectedKey}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 8;
        const availW = pageW - margin * 2;
        const availH = pageH - margin * 2;
        const ratio = Math.min(availW / canvas.width, availH / canvas.height);
        const w = canvas.width * ratio;
        const h = canvas.height * ratio;
        pdf.addImage(imgData, 'JPEG', margin + (availW - w) / 2, margin + (availH - h) / 2, w, h);
        pdf.save(`daily-muslim-${kind}-${selectedKey}.pdf`);
      }
      toast.success('تم التصدير بنجاح');
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
      setExportMode(null);
    }
  };

  const exportDates = useMemo(() => {
    if (exportMode === 'day') return [selectedKey];
    if (exportMode === 'week') return weekDates.map(toDateKey);
    if (exportMode === 'month') return monthDates.map(toDateKey);
    return [selectedKey];
  }, [exportMode, selectedKey, weekDates, monthDates]);

  const exportTitle =
    exportMode === 'day' ? `متتبع يوم المسلم - ${formatArabicShort(selectedDate)}` :
    exportMode === 'week' ? 'متتبع يوم المسلم - الأسبوع' :
    exportMode === 'month' ? `متتبع يوم المسلم - ${selectedDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}` :
    'متتبع يوم المسلم';

  if (!isLoaded || !progress) {
    return (
      <div className="min-h-screen bg-background islamic-pattern flex items-center justify-center">
        <div className="animate-pulse text-primary">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background islamic-pattern">
      <div className="container max-w-6xl py-8 px-4 relative">
        <Link to="/contact" className="absolute top-8 left-4 z-10 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <MessageSquare className="h-4 w-4" />
          تواصل معنا
        </Link>

        <header className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-4 glow-emerald">
            <Sun className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">متتبع يوم المسلم</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            نظّم يومك حول الصلوات الخمس وتابع أهدافك الإيمانية بانتظام
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link to="/">
              <Button variant="outline" className="gap-2"><BookOpen className="h-4 w-4" /> جدول الحفظ</Button>
            </Link>
            <Link to="/ramadan">
              <Button variant="outline" className="gap-2">🌙 متتبع رمضان</Button>
            </Link>
          </div>
        </header>

        <main className="space-y-6 animate-fade-in">
          {/* أزرار العرض */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl bg-muted p-1">
              {([
                { id: 'day', label: 'يومي', icon: '📅' },
                { id: 'week', label: 'أسبوعي', icon: '🗓️' },
                { id: 'month', label: 'شهري', icon: '📆' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setView(t.id)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    view === t.id ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="ml-1">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSettings(s => !s)} className="gap-1">
                <Settings2 className="h-4 w-4" />{showSettings ? 'إخفاء الإعدادات' : 'الإعدادات'}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleReset} className="gap-1">
                <RotateCcw className="h-4 w-4" />إعادة تعيين
              </Button>
            </div>
          </div>

          {/* الإعدادات */}
          {showSettings && (
            <Card className="card-islamic">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  إدارة الأهداف
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  أضف أو احذف أو رتّب أهدافك حسب أوقات الصلاة. الأهداف الافتراضية مقترحات يمكنك حذف أيٍّ منها.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* إضافة هدف جديد */}
                <div className="border border-dashed border-primary/40 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    إضافة هدف جديد
                  </p>
                  <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                    <Input
                      value={newGoalLabel}
                      onChange={e => setNewGoalLabel(e.target.value)}
                      placeholder="اسم الهدف"
                      dir="rtl"
                      maxLength={60}
                      onKeyDown={e => e.key === 'Enter' && addCustomGoal()}
                    />
                    <select
                      value={newGoalSection}
                      onChange={e => setNewGoalSection(e.target.value)}
                      className="rounded-md border border-input bg-background px-3 text-sm h-10"
                    >
                      {PRAYER_SECTIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                      ))}
                    </select>
                    <Button onClick={addCustomGoal} disabled={!newGoalLabel.trim()} className="btn-primary-islamic gap-1">
                      <Plus className="h-4 w-4" />إضافة
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">اختر أيقونة</p>
                    <div className="flex flex-wrap gap-1">
                      {DAILY_EMOJI_OPTIONS.map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setNewGoalIcon(em)}
                          className={cn(
                            'w-9 h-9 rounded-md text-lg transition-all',
                            newGoalIcon === em ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-accent'
                          )}
                        >{em}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* قائمة الأهداف بالأقسام */}
                {goalsBySection.map(({ section, items }) => (
                  <div key={section.id} className="space-y-2">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <span className="text-xl">{section.icon}</span>{section.name}
                      <span className="text-xs text-muted-foreground font-normal">({items.length})</span>
                    </h3>
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic px-3">لا توجد أهداف في هذا القسم</p>
                    ) : (
                      <div className="space-y-1.5">
                        {items.map((g, i) => (
                          <div key={g.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                            <span className="text-xl">{g.icon}</span>
                            <span className="flex-1 text-sm">{g.label}</span>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => moveGoal(g.id, 'up')}
                                disabled={i === 0}
                                className="p-1 hover:bg-accent rounded disabled:opacity-30"
                                aria-label="up"
                              ><ArrowRight className="h-3.5 w-3.5 rotate-90" /></button>
                              <button
                                onClick={() => moveGoal(g.id, 'down')}
                                disabled={i === items.length - 1}
                                className="p-1 hover:bg-accent rounded disabled:opacity-30"
                                aria-label="down"
                              ><ArrowLeft className="h-3.5 w-3.5 rotate-90" /></button>
                              <button
                                onClick={() => removeGoal(g.id)}
                                className="p-1 hover:bg-destructive/20 text-destructive rounded"
                                aria-label="delete"
                              ><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* أزرار التصدير */}
          <Card className="card-islamic">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <p className="text-sm font-medium text-muted-foreground">للطباعة:</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={isExporting} onClick={() => runExport('day', 'image')} className="gap-1">
                    <ImageIcon className="h-4 w-4" />صورة اليوم
                  </Button>
                  <Button size="sm" variant="outline" disabled={isExporting} onClick={() => runExport('week', 'pdf')} className="gap-1">
                    <FileText className="h-4 w-4" />PDF أسبوعي
                  </Button>
                  <Button size="sm" variant="outline" disabled={isExporting} onClick={() => runExport('month', 'pdf')} className="gap-1">
                    <FileText className="h-4 w-4" />PDF شهري
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* العرض اليومي */}
          {view === 'day' && (
            <Card className="card-islamic">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="gap-1">
                    <ChevronRight className="h-4 w-4" />السابق
                  </Button>
                  <div className="text-center">
                    <CardTitle className="flex items-center gap-2 justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                      {formatArabicFull(selectedDate)}
                    </CardTitle>
                    {toDateKey(selectedDate) !== toDateKey(new Date()) && (
                      <button
                        onClick={() => setSelectedDate(new Date())}
                        className="text-xs text-primary hover:underline mt-1"
                      >العودة لليوم الحالي</button>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="gap-1">
                    التالي<ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* شريط التقدم العام */}
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      تقدم اليوم
                    </span>
                    <span className="font-bold text-primary">{completedGoals}/{totalGoals} ({dayPct}%)</span>
                  </div>
                  <Progress value={dayPct} className="h-2" />
                </div>

                {/* الأهداف بالأقسام */}
                {goalsBySection.map(({ section, items }) => {
                  if (items.length === 0) return null;
                  const sectionDone = items.filter(g => dayProgress[g.id]).length;
                  return (
                    <div key={section.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                          <span className="text-2xl">{section.icon}</span>
                          {section.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {sectionDone}/{items.length}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {items.map(g => {
                          const checked = !!dayProgress[g.id];
                          return (
                            <label
                              key={g.id}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                                checked ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:bg-accent/50'
                              )}
                            >
                              <Checkbox checked={checked} onCheckedChange={() => toggleGoal(g.id)} className="h-5 w-5" />
                              <span className="text-xl">{g.icon}</span>
                              <span className={cn('flex-1 text-sm', checked && 'line-through text-muted-foreground')}>
                                {g.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {goals.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد أهداف. افتح "الإعدادات" وأضف أهدافك.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* العرض الأسبوعي */}
          {view === 'week' && (
            <Card className="card-islamic">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="gap-1">
                    <ChevronRight className="h-4 w-4" />الأسبوع السابق
                  </Button>
                  <CardTitle className="flex items-center gap-2 justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                    آخر 7 أيام حتى {formatArabicShort(selectedDate)}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="gap-1">
                    الأسبوع التالي<ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
                  {weekDates.map(d => {
                    const k = toDateKey(d);
                    const dp = getDayProgress(k);
                    const done = goals.filter(g => dp[g.id]).length;
                    const pct = totalGoals > 0 ? Math.round((done / totalGoals) * 100) : 0;
                    const isToday = k === toDateKey(new Date());
                    const isSelected = k === selectedKey;
                    return (
                      <button
                        key={k}
                        onClick={() => { setSelectedDate(d); setView('day'); }}
                        className={cn(
                          'p-3 rounded-lg border text-center transition-all hover:border-primary',
                          isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card',
                          isToday && 'ring-2 ring-primary/50'
                        )}
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {d.toLocaleDateString('ar-EG', { weekday: 'short' })}
                        </div>
                        <div className="font-bold text-lg">{d.getDate()}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {d.toLocaleDateString('ar-EG', { month: 'short' })}
                        </div>
                        <div className="mt-2">
                          <Progress value={pct} className="h-1.5" />
                          <div className="text-xs mt-1 font-medium text-primary">{done}/{totalGoals}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* العرض الشهري */}
          {view === 'month' && (
            <Card className="card-islamic">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => {
                    const d = new Date(selectedDate);
                    d.setMonth(d.getMonth() - 1);
                    setSelectedDate(d);
                  }} className="gap-1">
                    <ChevronRight className="h-4 w-4" />الشهر السابق
                  </Button>
                  <CardTitle className="flex items-center gap-2 justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                    {selectedDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => {
                    const d = new Date(selectedDate);
                    d.setMonth(d.getMonth() + 1);
                    setSelectedDate(d);
                  }} className="gap-1">
                    الشهر التالي<ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* ملخص شهري */}
                {(() => {
                  let totalDone = 0; let totalSlots = 0; let perfectDays = 0;
                  monthDates.forEach(d => {
                    const dp = getDayProgress(toDateKey(d));
                    const done = goals.filter(g => dp[g.id]).length;
                    totalDone += done;
                    totalSlots += totalGoals;
                    if (totalGoals > 0 && done === totalGoals) perfectDays++;
                  });
                  const pct = totalSlots > 0 ? Math.round((totalDone / totalSlots) * 100) : 0;
                  return (
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="text-2xl font-bold text-primary">{pct}%</div>
                        <div className="text-xs text-muted-foreground">نسبة الإنجاز</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="text-2xl font-bold text-primary">{perfectDays}</div>
                        <div className="text-xs text-muted-foreground">أيام مكتملة</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="text-2xl font-bold text-primary">{totalDone}</div>
                        <div className="text-xs text-muted-foreground">إجمالي الأهداف المنجزة</div>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-7 gap-1.5">
                  {monthDates.map(d => {
                    const k = toDateKey(d);
                    const dp = getDayProgress(k);
                    const done = goals.filter(g => dp[g.id]).length;
                    const pct = totalGoals > 0 ? Math.round((done / totalGoals) * 100) : 0;
                    const isToday = k === toDateKey(new Date());
                    const tone =
                      pct === 100 ? 'bg-primary text-primary-foreground' :
                      pct >= 50 ? 'bg-primary/30' :
                      pct > 0 ? 'bg-primary/10' : 'bg-muted';
                    return (
                      <button
                        key={k}
                        onClick={() => { setSelectedDate(d); setView('day'); }}
                        className={cn(
                          'aspect-square rounded-md flex flex-col items-center justify-center text-xs hover:ring-2 hover:ring-primary transition-all',
                          tone,
                          isToday && 'ring-2 ring-primary'
                        )}
                        title={`${formatArabicShort(d)} - ${pct}%`}
                      >
                        <span className="font-bold">{d.getDate()}</span>
                        {pct > 0 && <span className="text-[9px] opacity-80">{pct}%</span>}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        <footer className="mt-12 text-center text-muted-foreground text-sm">
          <p>﴿ وَأَقِمِ الصَّلَاةَ ۖ إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ ﴾</p>
          <p className="mt-2">العنكبوت - الآية ٤٥</p>
        </footer>
      </div>

      {/* جدول التصدير المخفي */}
      {exportMode && (
        <div style={{ position: 'fixed', left: '-99999px', top: 0 }}>
          <DailyMuslimExportTable
            ref={exportRef}
            goals={goals}
            dates={exportDates}
            getDayProgress={getDayProgress}
            title={exportTitle}
          />
        </div>
      )}
    </div>
  );
};

export default DailyMuslim;
