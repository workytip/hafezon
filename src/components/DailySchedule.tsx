import { useState } from 'react';
import { DailyTask } from '@/types/schedule';
import { formatArabicDate } from '@/utils/scheduleGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  RefreshCw, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyScheduleProps {
  tasks: DailyTask[];
  onReset: () => void;
}

export const DailySchedule = ({ tasks, onReset }: DailyScheduleProps) => {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Record<string, DailyTask['completed']>>({});

  const currentTask = tasks[currentDayIndex];
  
  const getTaskCompletion = (date: string) => {
    return completedTasks[date] || {
      newMemorization: false,
      nearReview: false,
      farReview: false,
      preparation: false,
      weeklyPreparation: false,
    };
  };

  const toggleTaskCompletion = (date: string, taskType: keyof DailyTask['completed']) => {
    setCompletedTasks(prev => ({
      ...prev,
      [date]: {
        ...getTaskCompletion(date),
        [taskType]: !getTaskCompletion(date)[taskType],
      },
    }));
  };

  const completion = getTaskCompletion(currentTask.date);
  const completedCount = Object.values(completion).filter(Boolean).length;
  const totalTasks = 4;

  return (
    <div className="space-y-6">
      {/* الرأس */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          تعديل الإعدادات
        </Button>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          اليوم {currentTask.dayNumber} من {tasks.length}
        </Badge>
      </div>

      {/* التنقل بين الأيام */}
      <div className="flex items-center justify-between bg-card rounded-xl p-4 border border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))}
          disabled={currentDayIndex === 0}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            {formatArabicDate(currentTask.date)}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">الإنجاز:</span>
            <div className="flex gap-1">
              {[...Array(totalTasks)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 rounded-full transition-colors",
                    i < completedCount ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-primary">
              {completedCount}/{totalTasks}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentDayIndex(Math.min(tasks.length - 1, currentDayIndex + 1))}
          disabled={currentDayIndex === tasks.length - 1}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      {/* المهام */}
      <div className="grid gap-4">
        {/* الحفظ الجديد */}
        <TaskCard
          icon={<BookOpen className="h-5 w-5" />}
          title="الحفظ الجديد"
          description={currentTask.newMemorization.description}
          pages={currentTask.newMemorization.pages}
          surahName={currentTask.newMemorization.surahName}
          completed={completion.newMemorization}
          onToggle={() => toggleTaskCompletion(currentTask.date, 'newMemorization')}
          variant="primary"
          delay="0.1s"
        />

        {/* المراجعة القريبة */}
        <TaskCard
          icon={<RefreshCw className="h-5 w-5" />}
          title="المراجعة القريبة"
          description={currentTask.nearReview.description}
          pages={currentTask.nearReview.pages}
          surahName={currentTask.nearReview.surahName}
          completed={completion.nearReview}
          onToggle={() => toggleTaskCompletion(currentTask.date, 'nearReview')}
          variant="secondary"
          delay="0.2s"
        />

        {/* المراجعة البعيدة */}
        <TaskCard
          icon={<RefreshCw className="h-5 w-5" />}
          title="المراجعة البعيدة"
          description={currentTask.farReview.description}
          pages={currentTask.farReview.pages}
          juzNumber={currentTask.farReview.juzNumber}
          completed={completion.farReview}
          onToggle={() => toggleTaskCompletion(currentTask.date, 'farReview')}
          variant="accent"
          delay="0.3s"
        />

        {/* التحضير للغد */}
        <TaskCard
          icon={<Clock className="h-5 w-5" />}
          title="التحضير للغد"
          description={currentTask.tomorrowPreparation.description}
          pages={currentTask.tomorrowPreparation.pages}
          completed={completion.preparation}
          onToggle={() => toggleTaskCompletion(currentTask.date, 'preparation')}
          variant="muted"
          delay="0.4s"
        />
      </div>

      {/* قائمة الأيام */}
      <Card className="card-islamic">
        <CardHeader>
          <CardTitle className="text-lg">نظرة على الأسبوع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tasks.slice(0, 7).map((task, index) => {
              const dayCompletion = getTaskCompletion(task.date);
              const dayCompletedCount = Object.values(dayCompletion).filter(Boolean).length;
              const isComplete = dayCompletedCount === 4;
              const isToday = index === currentDayIndex;
              
              return (
                <button
                  key={task.date}
                  onClick={() => setCurrentDayIndex(index)}
                  className={cn(
                    "flex flex-col items-center min-w-[60px] p-3 rounded-lg transition-all",
                    isToday 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80",
                    isComplete && !isToday && "ring-2 ring-primary"
                  )}
                >
                  <span className="text-xs opacity-70">يوم</span>
                  <span className="text-lg font-bold">{task.dayNumber}</span>
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 mt-1" />
                  ) : (
                    <Circle className="h-4 w-4 mt-1 opacity-50" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface TaskCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  pages: number[];
  surahName?: string;
  juzNumber?: number;
  completed: boolean;
  onToggle: () => void;
  variant: 'primary' | 'secondary' | 'accent' | 'muted';
  delay: string;
}

const TaskCard = ({
  icon,
  title,
  description,
  pages,
  surahName,
  juzNumber,
  completed,
  onToggle,
  variant,
  delay,
}: TaskCardProps) => {
  const variantStyles = {
    primary: 'border-primary/30 bg-primary/5',
    secondary: 'border-secondary/30 bg-secondary/5',
    accent: 'border-accent bg-accent/50',
    muted: 'border-muted bg-muted/50',
  };

  const iconStyles = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/20 text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
    muted: 'bg-muted text-muted-foreground',
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-300 animate-slide-up border-2",
        variantStyles[variant],
        completed && "opacity-60"
      )}
      style={{ animationDelay: delay }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div 
            className="flex items-center justify-center cursor-pointer"
            onClick={onToggle}
          >
            <Checkbox 
              checked={completed}
              className="h-6 w-6 rounded-full border-2"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-2 rounded-lg", iconStyles[variant])}>
                {icon}
              </div>
              <h3 className={cn(
                "font-bold text-lg",
                completed && "line-through"
              )}>
                {title}
              </h3>
            </div>
            
            <p className="text-muted-foreground mb-3">{description}</p>
            
            <div className="flex flex-wrap gap-2">
              {surahName && (
                <Badge variant="outline" className="text-xs">
                  سورة {surahName}
                </Badge>
              )}
              {juzNumber && (
                <Badge variant="outline" className="text-xs">
                  الجزء {juzNumber}
                </Badge>
              )}
              {pages.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  الصفحات: {pages[0]} - {pages[pages.length - 1]}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
