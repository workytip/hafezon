import { useState, useRef } from 'react';
import { DailyTask } from '@/types/schedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  RefreshCw, 
  RotateCcw,
  Clock, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Image as ImageIcon,
  FileText,
  Headphones,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { ExportTable } from './ExportTable';
import { MonthExportTable } from './MonthExportTable';
import { MiniPomodoro } from './MiniPomodoro';

interface WeeklyScheduleProps {
  tasks: DailyTask[];
  onReset: () => void;
  onEditSettings: () => void;
  getDailyProgress: (date: string) => DailyTask['completed'];
  updateDailyProgress: (date: string, taskType: keyof DailyTask['completed'], completed: boolean, pagesDelta?: number) => void;
  addMemorizedPages?: (pages: number) => void;
  enabledStages?: {
    nearReview: boolean;
    farReview: boolean;
    tomorrowPreparation: boolean;
    weeklyPreparation: boolean;
  };
}

export const WeeklySchedule = ({
  tasks,
  onReset,
  onEditSettings,
  getDailyProgress,
  updateDailyProgress,
  enabledStages = { nearReview: true, farReview: true, tomorrowPreparation: true, weeklyPreparation: true }
}: WeeklyScheduleProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const monthExportRef = useRef<HTMLDivElement>(null);

  const weekTasks = tasks.slice(currentWeekStart, currentWeekStart + 7);
  
  const getTaskCompletion = (date: string) => {
    return getDailyProgress(date);
  };

  const toggleTaskCompletion = (date: string, taskType: keyof DailyTask['completed'], pagesCount?: number) => {
    const current = getTaskCompletion(date);
    const newValue = !current[taskType];
    // pass pagesDelta atomically to avoid state race with addMemorizedPages
    let pagesDelta = 0;
    if (taskType === 'newMemorization' && pagesCount && pagesCount > 0) {
      pagesDelta = newValue ? pagesCount : -pagesCount;
    }
    updateDailyProgress(date, taskType, newValue, pagesDelta);
  };

  // حساب عدد المهام المفعلة
  const getActiveTaskCount = () => {
    let count = 1; // الحفظ الجديد دائماً مفعل
    if (enabledStages.nearReview) count++;
    if (enabledStages.farReview) count++;
    if (enabledStages.tomorrowPreparation) count++;
    if (enabledStages.weeklyPreparation) count++;
    return count;
  };

  const getWeekProgress = () => {
    let completed = 0;
    const activeTaskCount = getActiveTaskCount();
    let total = weekTasks.length * activeTaskCount;
    weekTasks.forEach(task => {
      const completion = getTaskCompletion(task.date);
      // نحسب فقط المهام المفعلة
      if (completion.newMemorization) completed++;
      if (enabledStages.nearReview && completion.nearReview) completed++;
      if (enabledStages.farReview && completion.farReview) completed++;
      if (enabledStages.tomorrowPreparation && completion.preparation) completed++;
      if (enabledStages.weeklyPreparation && completion.weeklyPreparation) completed++;
    });
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const progress = getWeekProgress();

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { weekday: 'long' });
  };

  const getShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
  };

  const weekNumber = Math.floor(currentWeekStart / 7) + 1;

  const exportAsImage = async () => {
    if (!exportRef.current) return;
    
    setIsExporting(true);
    toast.info('جاري تحضير الصورة بجودة عالية...');
    
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 6, // جودة أعلى جداً
        useCORS: true,
        logging: false,
        allowTaint: true,
        windowWidth: 1600,
      });
      
      const link = document.createElement('a');
      link.download = `quran-schedule-week-${weekNumber}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      toast.success('تم تصدير الجدول كصورة بجودة عالية');
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
    toast.info('جاري تحضير ملف PDF...');

    try {
      // انتظر تحميل الخطوط قبل الالتقاط لتجنب تشوه/فراغات
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 3, // تقليل الحجم لتسريع التصدير وتجنب ملفات PDF تالفة
        useCORS: true,
        logging: false,
        windowWidth: 1400,
      });

      // JPEG يقلل الحجم بشكل كبير مقارنة بـ PNG ويمنع فساد الملف عند الضخامة
      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const ratio = Math.min(availableWidth / imgWidthPx, availableHeight / imgHeightPx);

      const finalWidth = imgWidthPx * ratio;
      const finalHeight = imgHeightPx * ratio;
      const x = margin + (availableWidth - finalWidth) / 2;
      const y = margin + (availableHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
      pdf.save(`quran-schedule-week-${weekNumber}.pdf`);

      toast.success('تم تصدير الجدول كـ PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  // حساب رقم الشهر الحالي
  const currentMonth = Math.floor(currentWeekStart / 28) + 1;

  // الحصول على مهام الشهر الحالي (4 أسابيع = 28 يوم)
  const getMonthTasks = () => {
    const monthStart = (currentMonth - 1) * 28;
    return tasks.slice(monthStart, monthStart + 28);
  };

  const exportMonthAsPDF = async () => {
    if (!monthExportRef.current) return;

    setIsExporting(true);
    toast.info('جاري تحضير ملف PDF للشهر (كل أسبوع في صفحة)...');

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const addCanvasToPage = (canvas: HTMLCanvasElement) => {
        // استخدم JPEG لتفادي ملفات كبيرة/تالفة
        const imgData = canvas.toDataURL('image/jpeg', 0.92);

        const imgWidthPx = canvas.width;
        const imgHeightPx = canvas.height;
        const ratio = Math.min(availableWidth / imgWidthPx, availableHeight / imgHeightPx);

        const finalWidth = imgWidthPx * ratio;
        const finalHeight = imgHeightPx * ratio;
        const x = margin + (availableWidth - finalWidth) / 2;
        const y = margin + (availableHeight - finalHeight) / 2;

        pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
      };

      const captureAsCanvas = async (element: Element, containerWidth = 1400) => {
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
          position: absolute;
          left: -9999px;
          top: 0;
          background: #ffffff;
          width: ${containerWidth}px;
          padding: 24px;
          font-family: "Amiri", serif;
        `;
        tempContainer.dir = 'rtl';
        tempContainer.appendChild(element.cloneNode(true));
        document.body.appendChild(tempContainer);

        const canvas = await html2canvas(tempContainer, {
          backgroundColor: '#ffffff',
          scale: 2, // أسرع وأكثر استقراراً
          useCORS: true,
          logging: false,
          windowWidth: containerWidth + 48,
        });

        document.body.removeChild(tempContainer);
        return canvas;
      };

      const weekElements = monthExportRef.current.querySelectorAll('.week-page');

      // صفحة العنوان + الفهرس (بدون الاعتماد على nth-child لتجنب الالتقاط الخاطئ)
      const monthRoot = monthExportRef.current;
      const titleBlock = monthRoot.firstElementChild;
      const indexBlock = monthRoot.children[1];

      const headerIndexElement = document.createElement('div');
      if (titleBlock) headerIndexElement.appendChild(titleBlock.cloneNode(true));
      if (indexBlock) headerIndexElement.appendChild(indexBlock.cloneNode(true));

      const headerCanvas = await captureAsCanvas(headerIndexElement, 1400);
      addCanvasToPage(headerCanvas);

      // كل أسبوع صفحة مستقلة
      for (let i = 0; i < weekElements.length; i++) {
        pdf.addPage();
        const weekCanvas = await captureAsCanvas(weekElements[i], 1400);
        addCanvasToPage(weekCanvas);
      }

      // صفحة الملخص + التذييل
      const summaryBlock = monthRoot.children[monthRoot.children.length - 2];
      const footerBlock = monthRoot.lastElementChild;

      if (summaryBlock) {
        pdf.addPage();
        const summaryContainer = document.createElement('div');
        summaryContainer.appendChild(summaryBlock.cloneNode(true));
        if (footerBlock) summaryContainer.appendChild(footerBlock.cloneNode(true));

        const summaryCanvas = await captureAsCanvas(summaryContainer, 1400);
        addCanvasToPage(summaryCanvas);
      }

      pdf.save(`quran-schedule-month-${currentMonth}.pdf`);
      toast.success('تم تصدير جدول الشهر بنجاح');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* الرأس */}
      <div className="flex flex-col gap-4">
        {/* الصف الأول: أزرار الإعدادات */}
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" onClick={onEditSettings} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تعديل الإعدادات
          </Button>
          <Button variant="destructive" size="sm" onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            إعادة تعيين
          </Button>
        </div>

        {/* التنقل بين الأسابيع */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentWeekStart(Math.max(0, currentWeekStart - 7))}
            disabled={currentWeekStart === 0}
            className="gap-2 text-base px-6"
          >
            <ChevronRight className="h-5 w-5" />
            السابق
          </Button>
          
          <Badge variant="secondary" className="text-lg px-5 py-2.5">
            <Calendar className="h-5 w-5 ml-2" />
            الأسبوع {weekNumber}
          </Badge>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentWeekStart(Math.min(tasks.length - 7, currentWeekStart + 7))}
            disabled={currentWeekStart + 7 >= tasks.length}
            className="gap-2 text-base px-6"
          >
            التالي
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* الصف الثاني: أزرار التصدير مع شرح */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground ml-2">📄 تصدير للطباعة:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsImage}
            disabled={isExporting}
            className="gap-2"
            title="تحميل صورة للأسبوع للطباعة"
          >
            <ImageIcon className="h-4 w-4" />
            صورة الأسبوع
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsPDF}
            disabled={isExporting}
            className="gap-2"
            title="تحميل ملف PDF للأسبوع للطباعة"
          >
            <FileText className="h-4 w-4" />
            PDF الأسبوع
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportMonthAsPDF}
            disabled={isExporting}
            className="gap-2 bg-primary/10 border-primary/30 hover:bg-primary/20"
            title="تحميل ملف PDF لـ 4 أسابيع للطباعة"
          >
            <CalendarDays className="h-4 w-4" />
            PDF الشهر
          </Button>
        </div>
      </div>

      {/* جداول التصدير المخفية */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <ExportTable ref={exportRef} tasks={weekTasks} weekNumber={weekNumber} />
        <MonthExportTable ref={monthExportRef} tasks={getMonthTasks()} monthNumber={currentMonth} />
      </div>

      {/* المحتوى المرئي */}
      <div className="space-y-6">
        {/* شريط التقدم الأسبوعي */}
        <Card className="card-islamic overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">تقدم الأسبوع</h3>
                  <p className="text-sm text-muted-foreground">
                    {progress.completed} من {progress.total} مهمة
                  </p>
                </div>
              </div>
              <span className="text-3xl font-bold text-primary">{progress.percentage}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progress.percentage}%`,
                  background: 'var(--gradient-primary)'
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* جدول الأسبوع */}
        <div className="grid gap-4">
          {weekTasks.map((task, index) => {
            const completion = getTaskCompletion(task.date);
            const activeTaskCount = getActiveTaskCount();
            let completedCount = 0;
            if (completion.newMemorization) completedCount++;
            if (enabledStages.nearReview && completion.nearReview) completedCount++;
            if (enabledStages.farReview && completion.farReview) completedCount++;
            if (enabledStages.tomorrowPreparation && completion.preparation) completedCount++;
            if (enabledStages.weeklyPreparation && completion.weeklyPreparation) completedCount++;
            const isComplete = completedCount === activeTaskCount;

            return (
              <Card 
                key={task.date}
                className={cn(
                  "card-islamic transition-all duration-300 animate-slide-up overflow-hidden",
                  isComplete && "ring-2 ring-primary/50"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex flex-col items-center justify-center text-sm font-bold",
                        isComplete 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        <span className="text-xs opacity-70">يوم</span>
                        <span className="text-lg">{task.dayNumber}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{getDayName(task.date)}</CardTitle>
                        <p className="text-sm text-muted-foreground">{getShortDate(task.date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isComplete && (
                        <CheckCircle2 className="h-6 w-6 text-primary animate-scale-in" />
                      )}
                      <Badge variant={isComplete ? "default" : "secondary"}>
                        {completedCount}/{activeTaskCount}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className={cn(
                    "grid grid-cols-1 gap-3 sm:grid-cols-2",
                    [, 'lg:grid-cols-1', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-5'][Math.min(activeTaskCount, 5)]
                  )}>
                    {/* الحفظ الجديد */}
                    <TaskItem
                      icon={<BookOpen className="h-4 w-4" />}
                      title="الحفظ الجديد"
                      description={task.newMemorization.verseRange
                        ? task.newMemorization.unitLabel
                        : task.newMemorization.unitLabel || `سورة ${task.newMemorization.surahName}`}
                      subDescription={task.newMemorization.verseRange
                        ? task.newMemorization.description
                        : undefined}
                      pages={task.newMemorization.pages}
                      completed={completion.newMemorization}
                      onToggle={() => toggleTaskCompletion(task.date, 'newMemorization', task.newMemorization.pages.length)}
                      variant="primary"
                      taskLabel={`📖 الحفظ الجديد - ${task.newMemorization.description || task.newMemorization.surahName}`}
                    />

                    {/* المراجعة القريبة */}
                    {enabledStages.nearReview && (
                      <TaskItem
                        icon={<RefreshCw className="h-4 w-4" />}
                        title="المراجعة القريبة"
                        description={task.nearReview.unitLabel || `سورة ${task.nearReview.surahName}`}
                        pages={task.nearReview.pages}
                        completed={completion.nearReview}
                        onToggle={() => toggleTaskCompletion(task.date, 'nearReview')}
                        variant="secondary"
                        taskLabel={`🔄 المراجعة القريبة - ${task.nearReview.description || task.nearReview.surahName}`}
                      />
                    )}

                    {/* المراجعة البعيدة */}
                    {enabledStages.farReview && (
                      <TaskItem
                        icon={<RefreshCw className="h-4 w-4" />}
                        title="المراجعة البعيدة"
                        description={task.farReview.unitLabel || `الجزء ${task.farReview.juzNumber}`}
                        pages={task.farReview.pages}
                        completed={completion.farReview}
                        onToggle={() => toggleTaskCompletion(task.date, 'farReview')}
                        variant="accent"
                        taskLabel={`📚 المراجعة البعيدة - ${task.farReview.description || `الجزء ${task.farReview.juzNumber}`}`}
                      />
                    )}

                    {/* التحضير للغد */}
                    {enabledStages.tomorrowPreparation && (
                      <TaskItem
                        icon={<Clock className="h-4 w-4" />}
                        title="التحضير للغد"
                        description={task.tomorrowPreparation.description || "القراءة والاستماع"}
                        pages={task.tomorrowPreparation.pages}
                        completed={completion.preparation}
                        onToggle={() => toggleTaskCompletion(task.date, 'preparation')}
                        variant="muted"
                        taskLabel={`⏰ التحضير للغد`}
                      />
                    )}

                    {/* التحضير الأسبوعي */}
                    {enabledStages.weeklyPreparation && (
                      <TaskItem
                        icon={<Headphones className="h-4 w-4" />}
                        title="التحضير الأسبوعي"
                        description={task.weeklyPreparation.description}
                        pages={[]}
                        completed={completion.weeklyPreparation}
                        onToggle={() => toggleTaskCompletion(task.date, 'weeklyPreparation')}
                        variant="muted"
                        taskLabel={`🎧 التحضير الأسبوعي`}
                      />
                    )}
        </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* أزرار التنقل السفلية */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentWeekStart(Math.max(0, currentWeekStart - 7))}
            disabled={currentWeekStart === 0}
            className="gap-2 text-base px-6"
          >
            <ChevronRight className="h-5 w-5" />
            السابق
          </Button>
          
          <Badge variant="secondary" className="text-lg px-5 py-2.5">
            الأسبوع {weekNumber}
          </Badge>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentWeekStart(Math.min(tasks.length - 7, currentWeekStart + 7))}
            disabled={currentWeekStart + 7 >= tasks.length}
            className="gap-2 text-base px-6"
          >
            التالي
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* ملخص الأسبوع */}
        <Card className="card-islamic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              ملخص نهاية الأسبوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* حساب الإحصائيات من verseRange بدلاً من pages.length */}
            {(() => {
              const newMemPages = weekTasks.reduce((acc, t) => {
                if (t.newMemorization.verseRange) {
                  return acc + (t.newMemorization.verseRange.endVerse - t.newMemorization.verseRange.startVerse + 1);
                }
                return acc + t.newMemorization.pages.length;
              }, 0);
              
              const nearReviewPages = enabledStages.nearReview ? weekTasks.reduce((acc, t) => {
                if (t.nearReview.verseRange) {
                  return acc + (t.nearReview.verseRange.endVerse - t.nearReview.verseRange.startVerse + 1);
                }
                return acc + t.nearReview.pages.length;
              }, 0) : 0;
              
              const farReviewPages = enabledStages.farReview ? weekTasks.reduce((acc, t) => {
                if (t.farReview.verseRange) {
                  return acc + (t.farReview.verseRange.endVerse - t.farReview.verseRange.startVerse + 1);
                }
                return acc + t.farReview.pages.length;
              }, 0) : 0;

              const activeSummaryCards = [
                { show: true, title: "صفحات جديدة", value: newMemPages, icon: <BookOpen className="h-5 w-5" />, color: "primary" as const },
                { show: enabledStages.nearReview, title: "مراجعة قريبة", value: nearReviewPages, icon: <RefreshCw className="h-5 w-5" />, color: "secondary" as const },
                { show: enabledStages.farReview, title: "مراجعة بعيدة", value: farReviewPages, icon: <RefreshCw className="h-5 w-5" />, color: "accent" as const },
                { show: true, title: "إجمالي", value: newMemPages + nearReviewPages + farReviewPages, icon: <TrendingUp className="h-5 w-5" />, color: "gold" as const },
              ].filter(card => card.show);

              return (
                <div className="grid gap-4" style={{ 
                  gridTemplateColumns: `repeat(${activeSummaryCards.length}, minmax(0, 1fr))` 
                }}>
                  {activeSummaryCards.map((card, index) => (
                    <SummaryCard
                      key={index}
                      title={card.title}
                      value={card.value}
                      icon={card.icon}
                      color={card.color}
                    />
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface TaskItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  subDescription?: string;
  pages: number[];
  completed: boolean;
  onToggle: () => void;
  variant: 'primary' | 'secondary' | 'accent' | 'muted';
  taskLabel?: string;
}

const TaskItem = ({
  icon,
  title,
  description,
  subDescription,
  pages,
  completed,
  onToggle,
  variant,
  taskLabel,
}: TaskItemProps) => {
  const variantStyles = {
    primary: 'border-primary/30 bg-primary/5 hover:bg-primary/10',
    secondary: 'border-secondary/30 bg-secondary/5 hover:bg-secondary/10',
    accent: 'border-accent bg-accent/30 hover:bg-accent/50',
    muted: 'border-muted bg-muted/30 hover:bg-muted/50',
  };

  const iconStyles = {
    primary: 'text-primary',
    secondary: 'text-secondary-foreground',
    accent: 'text-accent-foreground',
    muted: 'text-muted-foreground',
  };

  return (
    <div 
      onClick={onToggle}
      className={cn(
        "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
        variantStyles[variant],
        completed && "opacity-60"
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn(
          "mt-0.5 h-5 w-5 rounded-full border-2 shrink-0 transition-colors",
          completed ? "bg-primary border-primary" : "border-gray-300 bg-transparent"
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={iconStyles[variant]}>{icon}</span>
            <span className={cn(
              "font-medium text-sm truncate",
              completed && "line-through"
            )}>
              {title}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
          {subDescription && (
            <p className="text-xs text-primary/80 mt-0.5">{subDescription}</p>
          )}
          {pages.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              ص {pages[0]}{pages.length > 1 ? ` - ${pages[pages.length - 1]}` : ''}
            </p>
          )}
        </div>
      </div>
      {taskLabel && (
        <MiniPomodoro taskLabel={taskLabel} />
      )}
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'accent' | 'gold';
}

const SummaryCard = ({ title, value, icon, color }: SummaryCardProps) => {
  const colorStyles = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/20 text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
    gold: 'bg-gold/20 text-gold',
  };

  return (
    <div className="text-center p-4 rounded-xl bg-muted/50">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2",
        colorStyles[color]
      )}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{title}</p>
    </div>
  );
};
