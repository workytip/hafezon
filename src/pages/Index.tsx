import { useState, useEffect } from 'react';
import { SettingsForm } from '@/components/SettingsForm';
import { QuickSettingsForm } from '@/components/QuickSettingsForm';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { ProgressRing } from '@/components/ProgressRing';
import { UserSettings, DailyTask } from '@/types/schedule';
import { generateDailyTasks } from '@/utils/scheduleGenerator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BookOpen, RotateCcw, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          <div className="mt-6 inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-4 glow-emerald">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            جدول الحفظ والمراجعة
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            نظّم حفظك للقرآن الكريم ومراجعتك اليومية بطريقة منهجية ومتابعة دورية
          </p>
        </header>

        {/* المحتوى الرئيسي */}
        <main>
          {!settings ? (
            <div className="max-w-2xl mx-auto animate-fade-in">
              {formMode === 'choice' ? (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">كيف تريد إعداد جدولك؟</h2>
                    <p className="text-muted-foreground text-sm">اختر حسب وضعك الحالي</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      onClick={() => setFormMode('quick')}
                      className="card-islamic p-6 text-right hover:border-primary/50 transition-all group border-2"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                          <Zap className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold">إعداد سريع</h3>
                            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">مُوصى به</span>
                          </div>
                          <p className="text-xs text-muted-foreground">3 أسئلة · أقل من دقيقة</p>
                          <ul className="text-xs text-muted-foreground space-y-1 pt-1">
                            <li>✓ لمن لم يحفظ شيئاً بعد</li>
                            <li>✓ لمن يريد البدء الآن</li>
                            <li>✓ يمكن تعديله في أي وقت</li>
                          </ul>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setFormMode('full')}
                      className="card-islamic p-6 text-right hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-secondary/20 group-hover:bg-secondary/30 transition-colors shrink-0">
                          <Sparkles className="h-7 w-7 text-secondary-foreground" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <h3 className="text-lg font-bold">إعداد مخصص</h3>
                          <p className="text-xs text-muted-foreground">4 خطوات · 3 دقائق</p>
                          <ul className="text-xs text-muted-foreground space-y-1 pt-1">
                            <li>✓ لمن حفظ سابقاً ويريد مراجعته</li>
                            <li>✓ تحكم كامل في ترتيب المراجعة</li>
                            <li>✓ إعدادات متقدمة للأرباع والأحزاب</li>
                          </ul>
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
