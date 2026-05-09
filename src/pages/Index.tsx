import { useState, useEffect } from 'react';
import { SettingsForm } from '@/components/SettingsForm';
import { QuickSettingsForm } from '@/components/QuickSettingsForm';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { ProgressRing } from '@/components/ProgressRing';
import { UserSettings, DailyTask } from '@/types/schedule';
import { generateDailyTasks } from '@/utils/scheduleGenerator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BookOpen, RotateCcw, Zap, Sparkles, ChevronLeft, Sun, Timer, TrendingUp } from 'lucide-react';
import { NavLinks } from '@/components/AppNav';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Index = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [formMode, setFormMode] = useState<'choice' | 'quick' | 'full' | 'edit'>('choice');
  const { progress, isLoaded, saveProgress, clearProgress, updateDailyProgress, getDailyProgress, addMemorizedPages, getTotalMemorizedPages } = useLocalStorage();

  // تحميل البيانات المحفوظة
  useEffect(() => {
    if (isLoaded && progress) {
      setSettings(progress.settings);
      setTasks(progress.tasks);
    }
  }, [isLoaded, progress]);

  const handleSettingsSubmit = (newSettings: UserSettings) => {
    setSettings(newSettings);
    const generatedTasks = generateDailyTasks(newSettings, 30);
    setTasks(generatedTasks);
    saveProgress(newSettings, generatedTasks);
    setFormMode('choice'); // إعادة تعيين وضع النموذج بعد الحفظ
  };

  const handleEditSettings = () => {
    const mode = settings?.setupMode === 'quick' ? 'quick' : 'edit';
    setFormMode(mode);
    setSettings(null);
  };

  const handleReset = () => {
    setSettings(null);
    setTasks([]);
    clearProgress();
    setFormMode('choice');
  };

  // عرض شاشة التحميل
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
        {/* الرأس */}
        <header className="text-center mb-10 animate-fade-in">
          {/* اسم التطبيق */}
          <div className="mb-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">Hafezon</p>
            <h1 className="text-5xl md:text-6xl font-bold text-primary">حافظون</h1>
          </div>
          <NavLinks />
          <div className="mt-6 inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-4 glow-emerald">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            جدول الحفظ والمراجعة
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            نظّم حفظك للقرآن الكريم ومراجعتك اليومية بطريقة منهجية ومتابعة دورية
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/daily-muslim">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer glow-emerald">
                <Sun className="h-6 w-6 text-primary" />
                <div className="text-right">
                  <span className="font-bold text-foreground block">☀️ متتبع يوم المسلم</span>
                  <span className="text-xs text-muted-foreground">جدول يومي حول أوقات الصلاة</span>
                </div>
                <ChevronLeft className="h-5 w-5 text-primary" />
              </div>
            </Link>
            <Link to="/pomodoro">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer glow-emerald">
                <Timer className="h-6 w-6 text-primary" />
                <div className="text-right">
                  <span className="font-bold text-foreground block">🍅 مؤقت بومودورو</span>
                  <span className="text-xs text-muted-foreground">ركّز على أهدافك بجلسات منتجة</span>
                </div>
                <ChevronLeft className="h-5 w-5 text-primary" />
              </div>
            </Link>
            <Link to="/analytics">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer glow-emerald">
                <TrendingUp className="h-6 w-6 text-primary" />
                <div className="text-right">
                  <span className="font-bold text-foreground block">📊 التحليلات</span>
                  <span className="text-xs text-muted-foreground">تتبع تقدمك وإنتاجيتك عبر الوقت</span>
                </div>
                <ChevronLeft className="h-5 w-5 text-primary" />
              </div>
            </Link>
          </div>
        </header>

        {/* المحتوى الرئيسي */}
        <main>
          {!settings ? (
            <div className="max-w-2xl mx-auto animate-fade-in">
              {formMode === 'choice' ? (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">كيف تريد البدء؟</h2>
                    <p className="text-muted-foreground">اختر الطريقة المناسبة لك</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      onClick={() => setFormMode('quick')}
                      className="card-islamic p-6 text-right hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Zap className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1">إعداد سريع</h3>
                          <p className="text-sm text-muted-foreground">
                            ابدأ في دقيقة واحدة مع الإعدادات الأساسية
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setFormMode('full')}
                      className="card-islamic p-6 text-right hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                          <Sparkles className="h-8 w-8 text-secondary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1">إعداد مخصص</h3>
                          <p className="text-sm text-muted-foreground">
                            تحكم كامل في جميع تفاصيل خطتك
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : formMode === 'quick' ? (
                <QuickSettingsForm 
                  onSubmit={handleSettingsSubmit} 
                  onSwitchToFull={() => setFormMode('full')}
                  initialSettings={progress?.settings}
                />
              ) : formMode === 'edit' ? (
                <SettingsForm 
                  onSubmit={handleSettingsSubmit} 
                  initialSettings={progress?.settings}
                />
              ) : (
                <SettingsForm onSubmit={handleSettingsSubmit} />
              )}
            </div>
          ) : (
            <div className="animate-fade-in space-y-8">
              {/* إحصائية المحفوظ */}
              <div className="card-islamic p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-right">
                    <h2 className="text-2xl font-bold mb-2">تقدمك في الحفظ</h2>
                    <p className="text-muted-foreground">
                      استمر في المثابرة، أنت على الطريق الصحيح
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditSettings}
                      className="mt-4"
                    >
                      <RotateCcw className="h-4 w-4 ml-2" />
                      تعديل الإعدادات
                    </Button>
                  </div>
                  <ProgressRing memorizedPages={getTotalMemorizedPages()} />
                </div>
              </div>

              <WeeklySchedule 
                tasks={tasks} 
                onReset={handleReset}
                onEditSettings={handleEditSettings}
                getDailyProgress={getDailyProgress}
                updateDailyProgress={updateDailyProgress}
                addMemorizedPages={addMemorizedPages}
                enabledStages={{
                  nearReview: settings.enableNearReview !== false,
                  farReview: settings.enableFarReview !== false,
                  tomorrowPreparation: settings.enableTomorrowPreparation !== false,
                  weeklyPreparation: settings.enableWeeklyPreparation !== false,
                }}
              />
            </div>
          )}
        </main>

        {/* التذييل */}
        <footer className="mt-16 text-center text-muted-foreground text-sm">
          <p>﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾</p>
          <p className="mt-2">الحجر - الآية ٩</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
