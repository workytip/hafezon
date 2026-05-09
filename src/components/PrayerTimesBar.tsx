import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrayerTimes, PrayerKey } from '@/hooks/usePrayerTimes';

const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr:    'الفجر',
  duha:    'الضحى',
  dhuhr:   'الظهر',
  asr:     'العصر',
  maghrib: 'المغرب',
  isha:    'العشاء',
};

const PRAYER_ICONS: Record<PrayerKey, string> = {
  fajr:    '🌅',
  duha:    '🌤️',
  dhuhr:   '☀️',
  asr:     '🌇',
  maghrib: '🌆',
  isha:    '🌙',
};

const ORDER: PrayerKey[] = ['fajr', 'duha', 'dhuhr', 'asr', 'maghrib', 'isha'];

function formatTime(d: Date) {
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function PrayerTimesBar() {
  const { times, currentPrayer, nextPrayer, loading, error, cityName } = usePrayerTimes();

  if (error) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground" dir="rtl">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحديد الموقع وحساب أوقات الصلاة…
      </div>
    );
  }

  if (!times) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden" dir="rtl">
      {/* City name */}
      {cityName && (
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{cityName}</span>
        </div>
      )}

      {/* Prayer times row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-primary/10 border-t border-primary/10">
        {ORDER.map(key => {
          const isCurrent = currentPrayer === key;
          const isNext    = nextPrayer === key;
          return (
            <div
              key={key}
              className={cn(
                'flex flex-col items-center gap-1 py-3 px-2 transition-colors',
                isCurrent ? 'bg-primary text-primary-foreground' :
                isNext    ? 'bg-primary/15 text-primary' :
                            'bg-background/80 text-foreground'
              )}
            >
              <span className="text-lg leading-none">{PRAYER_ICONS[key]}</span>
              <span className="text-xs font-bold">{PRAYER_LABELS[key]}</span>
              <span className={cn(
                'text-xs font-mono leading-none',
                isCurrent ? 'text-primary-foreground/90' : 'text-muted-foreground'
              )}>
                {formatTime(times[key])}
              </span>
              {isCurrent && (
                <span className="text-[10px] bg-primary-foreground/20 rounded-full px-1.5 py-0.5 leading-none mt-0.5">
                  الآن
                </span>
              )}
              {isNext && !isCurrent && (
                <span className="text-[10px] bg-primary/20 rounded-full px-1.5 py-0.5 leading-none mt-0.5">
                  التالية
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact inline time badge for card headers
export function PrayerTimeBadge({ prayerKey }: { prayerKey: PrayerKey }) {
  const { times } = usePrayerTimes();
  if (!times) return null;
  return (
    <span className="text-xs text-muted-foreground font-mono">
      {formatTime(times[prayerKey])}
    </span>
  );
}
