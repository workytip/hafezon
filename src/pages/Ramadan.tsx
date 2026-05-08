import { useState, useEffect, useRef } from 'react';
import { useRamadanStorage } from '@/hooks/useRamadanStorage';
import { RamadanGoal, RamadanSettings, DEFAULT_GOALS, GOOD_DEEDS_SUGGESTIONS, RECITATION_UNIT_OPTIONS, RecitationUnit } from '@/types/ramadan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Moon, ChevronRight, ChevronLeft, Calendar, TrendingUp,
  CheckCircle2, Settings2, RotateCcw, Sparkles,
  Image as ImageIcon, FileText, MessageSquare
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { RamadanExportTable } from '@/components/RamadanExportTable';

// Sortable goal item for setup
const SortableGoalItem = ({ goal, onToggle, onAmountChange, onUnitChange, isFirst, isLast, onMoveUp, onMoveDown, onRemove }: {
  goal: RamadanGoal;
  onToggle: () => void;
  onAmountChange?: (amount: number) => void;
  onUnitChange?: (unit: RecitationUnit) => void;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove?: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: goal.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        isDragging ? "opacity-50 shadow-lg border-primary z-50" : "border-border",
        goal.enabled ? "bg-primary/5 border-primary/30" : "bg-muted/30"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Checkbox checked={goal.enabled} onCheckedChange={onToggle} className="h-5 w-5" />
      <span className="text-xl">{goal.icon}</span>
      <span className={cn("flex-1 font-medium text-sm", !goal.enabled && "text-muted-foreground")}>{goal.label}</span>
      {goal.id === 'quranRecitation' && goal.enabled && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {RECITATION_UNIT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUnitChange?.(opt.value)}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-colors",
                  goal.recitationUnit === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Input
            type="number"
            min={1}
            max={50}
            value={goal.dailyAmount || 5}
            onChange={(e) => onAmountChange?.(parseInt(e.target.value) || 1)}
            className="w-16 h-8 text-center text-sm"
          />
          <span className="text-xs text-muted-foreground">
            {RECITATION_UNIT_OPTIONS.find(o => o.value === goal.recitationUnit)?.label || 'صفحات'}
          </span>
        </div>
      )}
      <div className="flex items-center gap-0.5">
        {onRemove && (
          <button type="button" onClick={onRemove} className="p-0.5 hover:bg-destructive/20 rounded text-destructive">
            <span className="text-xs font-bold px-1">✕</span>
          </button>
        )}
        <div className="flex flex-col gap-0.5">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="p-0.5 hover:bg-accent rounded disabled:opacity-30">
            <ChevronUp className="h-3 w-3" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="p-0.5 hover:bg-accent rounded disabled:opacity-30">
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

const EMOJI_OPTIONS = ['🕌', '🤲', '🌙', '☀️', '📿', '📖', '💝', '🔍', '📚', '🎁', '🙏', '🍽️', '💡', '🌟', '⭐', '🕋', '🏠', '❤️', '🧕', '👨‍👩‍👧‍👦', '💪', '🌿', '🎯', '✨'];

const Ramadan = () => {
  const { progress, isLoaded, saveSettings, updateDayProgress, getDayProgress, clearProgress } = useRamadanStorage();
  const [mode, setMode] = useState<'setup' | 'tracker'>('setup');
  const [goals, setGoals] = useState<RamadanGoal[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalIcon, setNewGoalIcon] = useState('⭐');
  const [startDay, setStartDay] = useState(1);
  const exportRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isLoaded && progress?.settings) {
      setGoals(progress.settings.goals);
      setStartDay(progress.settings.startDay || 1);
      setMode('tracker');
      // حساب الأسبوع الحالي بناءً على تاريخ البدء
      const daysSinceStart = Math.floor((Date.now() - new Date(progress.settings.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const currentRamadanDay = (progress.settings.startDay || 1) + daysSinceStart;
      const currentWeek = Math.floor((Math.min(Math.max(currentRamadanDay, 1), 30) - 1) / 7) * 7;
      setCurrentWeekStart(currentWeek);
    } else if (isLoaded) {
      setGoals(DEFAULT_GOALS.map((g, i) => ({ ...g, enabled: i < 6, order: i })));
    }
  }, [isLoaded, progress]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = goals.findIndex(g => g.id === active.id);
      const newIndex = goals.findIndex(g => g.id === over.id);
      setGoals(arrayMove(goals, oldIndex, newIndex));
    }
  };

  const toggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g));
  };

  const updateAmount = (id: string, amount: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, dailyAmount: amount } : g));
  };

  const updateUnit = (id: string, unit: RecitationUnit) => {
    const unitLabel = RECITATION_UNIT_OPTIONS.find(o => o.value === unit)?.label || 'صفحات';
    setGoals(prev => prev.map(g => g.id === id ? { ...g, recitationUnit: unit, amountLabel: unitLabel } : g));
  };

  const addCustomGoal = () => {
    if (!newGoalName.trim()) return;
    const newGoal: RamadanGoal = {
      id: `custom-${Date.now()}`,
      label: newGoalName.trim(),
      icon: newGoalIcon,
      enabled: true,
      order: goals.length,
    };
    setGoals(prev => [...prev, newGoal]);
    setNewGoalName('');
    setNewGoalIcon('⭐');
  };

  const removeGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const moveGoal = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= goals.length) return;
    setGoals(arrayMove(goals, index, newIndex));
  };

  const handleSave = () => {
    const settings: RamadanSettings = {
      goals: goals.map((g, i) => ({ ...g, order: i })),
      startDate: progress?.settings?.startDate || new Date().toISOString().split('T')[0],
      startDay,
    };
    saveSettings(settings);
    setMode('tracker');
  };

  const handleReset = () => {
    clearProgress();
    setGoals(DEFAULT_GOALS.map((g, i) => ({ ...g, enabled: i < 6, order: i })));
    setMode('setup');
  };

  const enabledGoals = goals.filter(g => g.enabled);
  const weekDays = Array.from({ length: 7 }, (_, i) => currentWeekStart + i + 1);
  const weekNumber = Math.floor(currentWeekStart / 7) + 1;

  // حساب اليوم الحالي في رمضان
  const getCurrentRamadanDay = () => {
    if (!progress?.settings) return startDay;
    const daysSinceStart = Math.floor((Date.now() - new Date(progress.settings.startDate).getTime()) / (1000 * 60 * 60 * 24));
    return Math.min((progress.settings.startDay || 1) + daysSinceStart, 30);
  };
  const currentRamadanDay = getCurrentRamadanDay();

  const getWeekProgress = () => {
    let completed = 0;
    let total = weekDays.filter(d => d <= 30).length * enabledGoals.length;
    weekDays.forEach(day => {
      if (day > 30) return;
      const dayProg = getDayProgress(`day-${day}`);
      enabledGoals.forEach(g => {
        if (dayProg[g.id]) completed++;
      });
    });
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  // Export functions - render hidden full-month table
  const exportAsImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    toast.info('جاري تحضير الصورة...');
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise(r => setTimeout(r, 300));
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        logging: false,
        windowWidth: 1200,
      });
      const link = document.createElement('a');
      link.download = 'ramadan-tracker.png';
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success('تم تصدير الجدول كصورة');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    toast.info('جاري تحضير PDF...');
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise(r => setTimeout(r, 300));
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        logging: false,
        windowWidth: 1200,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const availW = pageWidth - margin * 2;
      const availH = pageHeight - margin * 2;
      const ratio = Math.min(availW / canvas.width, availH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(imgData, 'JPEG', margin + (availW - w) / 2, margin + (availH - h) / 2, w, h);
      pdf.save('ramadan-tracker.pdf');
      toast.success('تم تصدير الجدول كـ PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  // Get recitation label for display
  const getRecitationLabel = (goal: RamadanGoal) => {
    if (goal.id !== 'quranRecitation' || !goal.dailyAmount) return null;
    const unitLabel = RECITATION_UNIT_OPTIONS.find(o => o.value === goal.recitationUnit)?.label || 'صفحات';
    return `${goal.dailyAmount} ${unitLabel}`;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background islamic-pattern flex items-center justify-center">
        <div className="animate-pulse text-primary">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background islamic-pattern">
      <div className="container max-w-6xl py-8 px-4 relative">
        {/* رابط تواصل معنا */}
        <Link to="/contact" className="absolute top-8 left-4 z-10 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <MessageSquare className="h-4 w-4" />
          تواصل معنا
        </Link>
        {/* الرأس */}
        <header className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-4 glow-emerald">
            <Moon className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            متتبع رمضان
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            تابع أهدافك اليومية في شهر رمضان المبارك
          </p>
          <div className="mt-4">
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <BookOpen className="h-4 w-4" />
                جدول الحفظ والمراجعة
              </Button>
            </Link>
          </div>
        </header>

        <main>
          {mode === 'setup' ? (
            <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
              <Card className="card-islamic">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" />
                    اختر أهدافك اليومية
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    اختر الأهداف التي تريد تتبعها ورتبها بالسحب حسب أولويتك
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-accent/30 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                      اقتراحات للأعمال الصالحة:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {GOOD_DEEDS_SUGGESTIONS.map(deed => (
                        <Badge key={deed} variant="secondary" className="text-xs">{deed}</Badge>
                      ))}
                    </div>
                  </div>

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={goals.map(g => g.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {goals.map((goal, index) => (
                          <SortableGoalItem
                            key={goal.id}
                            goal={goal}
                            onToggle={() => toggleGoal(goal.id)}
                            onAmountChange={goal.id === 'quranRecitation' ? (amt) => updateAmount(goal.id, amt) : undefined}
                            onUnitChange={goal.id === 'quranRecitation' ? (unit) => updateUnit(goal.id, unit) : undefined}
                            isFirst={index === 0}
                            isLast={index === goals.length - 1}
                            onMoveUp={() => moveGoal(index, 'up')}
                            onMoveDown={() => moveGoal(index, 'down')}
                            onRemove={goal.id.startsWith('custom-') ? () => removeGoal(goal.id) : undefined}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {/* إضافة هدف مخصص */}
                  <div className="border border-dashed border-primary/30 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      أضف هدفاً خاصاً بك
                    </p>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-muted-foreground">اسم الهدف</label>
                        <Input
                          value={newGoalName}
                          onChange={(e) => setNewGoalName(e.target.value)}
                          placeholder="مثال: قيام الليل"
                          dir="rtl"
                          className="h-9"
                          maxLength={50}
                          onKeyDown={(e) => e.key === 'Enter' && addCustomGoal()}
                        />
                      </div>
                      <Button onClick={addCustomGoal} disabled={!newGoalName.trim()} size="sm" className="btn-primary-islamic h-9">
                        إضافة
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">اختر أيقونة</label>
                      <div className="flex flex-wrap gap-1.5">
                        {EMOJI_OPTIONS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewGoalIcon(emoji)}
                            className={cn(
                              "w-8 h-8 rounded-md text-lg flex items-center justify-center transition-all",
                              newGoalIcon === emoji ? "bg-primary/20 ring-2 ring-primary scale-110" : "hover:bg-accent"
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* اختيار يوم البدء */}
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      من أي يوم في رمضان تبدأ؟
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={startDay}
                        onChange={(e) => setStartDay(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-20 h-9 text-center"
                      />
                      <span className="text-sm text-muted-foreground">اليوم {startDay} من رمضان</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex-1 btn-primary-islamic" disabled={enabledGoals.length === 0}>
                      حفظ وبدء التتبع ({enabledGoals.length} هدف)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="animate-fade-in space-y-6">
              {/* أزرار الإعدادات والتصدير */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setMode('setup')} className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    تعديل الأهداف
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleReset} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    إعادة تعيين
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">📄 تصدير:</span>
                  <Button variant="outline" size="sm" onClick={exportAsImage} disabled={isExporting} className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    صورة
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportAsPDF} disabled={isExporting} className="gap-2">
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>

              {/* التنقل بين الأسابيع */}
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="lg" onClick={() => setCurrentWeekStart(Math.max(0, currentWeekStart - 7))} disabled={currentWeekStart === 0} className="gap-2 text-base px-6">
                  <ChevronRight className="h-5 w-5" />
                  السابق
                </Button>
                <Badge variant="secondary" className="text-lg px-5 py-2.5">
                  <Calendar className="h-5 w-5 ml-2" />
                  الأسبوع {weekNumber}
                </Badge>
                <Button variant="outline" size="lg" onClick={() => setCurrentWeekStart(Math.min(23, currentWeekStart + 7))} disabled={currentWeekStart + 7 > 23} className="gap-2 text-base px-6">
                  التالي
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>

              {/* شريط التقدم */}
              {(() => {
                const wp = getWeekProgress();
                return (
                  <Card className="card-islamic overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <TrendingUp className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">تقدم الأسبوع</h3>
                            <p className="text-sm text-muted-foreground">{wp.completed} من {wp.total} هدف</p>
                          </div>
                        </div>
                        <span className="text-3xl font-bold text-primary">{wp.percentage}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${wp.percentage}%`, background: 'var(--gradient-primary)' }} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* جدول الأسبوع */}
              {/* Hidden export table - full month */}
              <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <RamadanExportTable
                  ref={exportRef}
                  enabledGoals={enabledGoals}
                  getDayProgress={getDayProgress}
                />
              </div>

              <div className="grid gap-4">
                {weekDays.map((day, index) => {
                  if (day > 30) return null;
                  const dayKey = `day-${day}`;
                  const dayProg = getDayProgress(dayKey);
                  const completedCount = enabledGoals.filter(g => dayProg[g.id]).length;
                  const isComplete = completedCount === enabledGoals.length;
                  const isToday = day === currentRamadanDay;
                  const isBeforeStart = day < (progress?.settings?.startDay || 1);

                  return (
                    <Card
                      key={day}
                      className={cn(
                        "card-islamic transition-all duration-300 animate-slide-up overflow-hidden",
                        isComplete && "ring-2 ring-primary/50",
                        isToday && "ring-2 ring-primary shadow-lg",
                        isBeforeStart && "opacity-40"
                      )}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex flex-col items-center justify-center text-sm font-bold",
                              isToday ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background" :
                              isComplete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                              <span className="text-xs opacity-70">يوم</span>
                              <span className="text-lg">{day}</span>
                            </div>
                            <div>
                              <CardTitle className="text-lg">اليوم {day} من رمضان</CardTitle>
                              {isToday && <span className="text-xs text-primary font-medium">📍 اليوم</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isComplete && <CheckCircle2 className="h-6 w-6 text-primary animate-scale-in" />}
                            <Badge variant={isComplete ? "default" : "secondary"}>
                              {completedCount}/{enabledGoals.length}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {enabledGoals.map(goal => {
                            const checked = !!dayProg[goal.id];
                            const recitationLabel = getRecitationLabel(goal);
                            return (
                              <div
                                key={goal.id}
                                onClick={() => updateDayProgress(dayKey, goal.id, !checked)}
                                className={cn(
                                  "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
                                  checked
                                    ? "border-primary/30 bg-primary/10 opacity-60"
                                    : "border-border hover:border-primary/30 hover:bg-primary/5"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={checked} className="h-5 w-5 rounded-full border-2 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span>{goal.icon}</span>
                                      <span className={cn("font-medium text-xs truncate", checked && "line-through")}>
                                        {goal.label}
                                      </span>
                                    </div>
                                    {recitationLabel && (
                                      <p className="text-xs text-muted-foreground">{recitationLabel}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* أزرار التنقل السفلية */}
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="lg" onClick={() => setCurrentWeekStart(Math.max(0, currentWeekStart - 7))} disabled={currentWeekStart === 0} className="gap-2 text-base px-6">
                  <ChevronRight className="h-5 w-5" />
                  السابق
                </Button>
                <Badge variant="secondary" className="text-lg px-5 py-2.5">
                  الأسبوع {weekNumber}
                </Badge>
                <Button variant="outline" size="lg" onClick={() => setCurrentWeekStart(Math.min(23, currentWeekStart + 7))} disabled={currentWeekStart + 7 > 23} className="gap-2 text-base px-6">
                  التالي
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>

              {/* ملخص الشهر */}
              <Card className="card-islamic">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-primary" />
                    ملخص الشهر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    let totalCompleted = 0;
                    let totalGoals = 0;
                    for (let d = 1; d <= 30; d++) {
                      const dp = getDayProgress(`day-${d}`);
                      enabledGoals.forEach(g => {
                        totalGoals++;
                        if (dp[g.id]) totalCompleted++;
                      });
                    }
                    const pct = totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0;
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">الإنجاز الكلي</span>
                          <span className="text-2xl font-bold text-primary">{pct}%</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'var(--gradient-primary)' }} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="text-center p-4 rounded-xl bg-muted/50">
                            <p className="text-2xl font-bold text-foreground">{totalCompleted}</p>
                            <p className="text-xs text-muted-foreground">أهداف مكتملة</p>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-muted/50">
                            <p className="text-2xl font-bold text-foreground">{totalGoals - totalCompleted}</p>
                            <p className="text-xs text-muted-foreground">أهداف متبقية</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        <footer className="mt-16 text-center text-muted-foreground text-sm">
          <p>﴿ شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ ﴾</p>
          <p className="mt-2">البقرة - الآية ١٨٥</p>
        </footer>
      </div>
    </div>
  );
};

export default Ramadan;
