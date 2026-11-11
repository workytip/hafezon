import { useMemo, useState } from 'react';
import { Layers, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { IntensiveReview, UserSettings } from '@/types/schedule';
import { generateDailyTasks, getScheduleLength } from '@/utils/scheduleGenerator';

interface IntensiveReviewDialogProps {
  settings: UserSettings;
  onChange: (intensiveReview: IntensiveReview | null) => void;
}

const DURATIONS = [
  { days: 7, label: 'أسبوع' },
  { days: 14, label: 'أسبوعان' },
  { days: 30, label: 'شهر' },
];

const toDateString = (date: Date) => date.toISOString().split('T')[0];

const addDays = (dateString: string, days: number) => {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return toDateString(d);
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });

export const IntensiveReviewDialog = ({ settings, onChange }: IntensiveReviewDialogProps) => {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [isCustom, setIsCustom] = useState(false);
  const [startOffset, setStartOffset] = useState<0 | 1>(0);

  const active = settings.intensiveReview;
  const today = toDateString(new Date());
  // لا تبدأ الفترة قبل بداية الجدول
  const baseDate = today < settings.startDate ? settings.startDate : today;
  const startDate = addDays(baseDate, startOffset);
  const validDays = Math.min(Math.max(Math.round(days) || 0, 3), 60);

  // معاينة: كم صفحة يومياً ستُراجع
  const preview = useMemo(() => {
    const candidate = { ...settings, intensiveReview: { startDate, days: validDays } };
    const tasks = generateDailyTasks(candidate, getScheduleLength(candidate));
    const periodTasks = tasks.filter(t => t.intensive);
    const total = periodTasks.reduce((acc, t) => acc + t.farReview.pages.length, 0);
    const perDay = periodTasks.length > 0 ? Math.max(...periodTasks.map(t => t.farReview.pages.length)) : 0;
    return { total, perDay };
  }, [settings, startDate, validDays]);

  const apply = () => {
    onChange({ startDate, days: validDays });
    setOpen(false);
  };

  const cancel = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Layers className="h-4 w-4" />
          مراجعة مكثفة
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-md text-right">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle>فترة مراجعة مكثفة</DialogTitle>
          <DialogDescription>
            توقّف عن الحفظ الجديد مؤقتاً وراجع كل محفوظك خلال مدة تختارها.
            بعد انتهاء الفترة يُستأنف الحفظ من حيث توقفت.
          </DialogDescription>
        </DialogHeader>

        {active && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <p className="font-medium">فترة حالية: {active.days} أيام</p>
            <p className="text-muted-foreground">
              من {formatDate(active.startDate)} إلى {formatDate(addDays(active.startDate, active.days - 1))}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>المدة</Label>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.days}
                  onClick={() => { setDays(d.days); setIsCustom(false); }}
                  className={`rounded-xl border-2 p-2 text-sm transition-all ${
                    !isCustom && days === d.days
                      ? 'border-primary bg-primary/10 font-medium text-primary'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
              <button
                onClick={() => setIsCustom(true)}
                className={`rounded-xl border-2 p-2 text-sm transition-all ${
                  isCustom ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-muted hover:border-primary/50'
                }`}
              >
                مخصص
              </button>
            </div>
            {isCustom && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={3}
                  max={60}
                  value={days}
                  onChange={e => setDays(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">يوماً (من 3 إلى 60)</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>تبدأ</Label>
            <div className="grid grid-cols-2 gap-2">
              {([0, 1] as const).map(offset => (
                <button
                  key={offset}
                  onClick={() => setStartOffset(offset)}
                  className={`rounded-xl border-2 p-2 text-sm transition-all ${
                    startOffset === offset
                      ? 'border-primary bg-primary/10 font-medium text-primary'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  {offset === 0 ? 'اليوم' : 'غداً'}
                  <span className="block text-xs text-muted-foreground">{formatDate(addDays(baseDate, offset))}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            {preview.total > 0 ? (
              <>
                <p>
                  ستراجع حوالي <span className="font-bold text-primary">{preview.perDay} صفحة</span> يومياً
                </p>
                <p className="text-muted-foreground">إجمالي المراجعة: {preview.total} صفحة خلال {validDays} أيام</p>
                {preview.perDay > 40 && (
                  <p className="mt-1 text-amber-600">المقدار اليومي كبير — جرّب مدة أطول.</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">لا يوجد محفوظ لمراجعته بعد.</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button onClick={apply} disabled={preview.total === 0}>
            {active ? 'تحديث الفترة' : 'ابدأ المراجعة المكثفة'}
          </Button>
          {active && (
            <Button variant="outline" onClick={cancel} className="gap-1">
              <X className="h-4 w-4" />
              إلغاء الفترة
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
