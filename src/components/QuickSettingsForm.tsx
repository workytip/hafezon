import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { surahs, getRubByPage, getHizbByPage } from '@/data/quranData';
import { UserSettings, MemorizationUnit } from '@/types/schedule';
import { Zap, BookOpen, RefreshCw, ArrowLeft, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface QuickSettingsFormProps {
  onSubmit: (settings: UserSettings) => void;
  onSwitchToFull: () => void;
  initialSettings?: UserSettings;
}

// صفحات كل جزء (تقريباً 20 صفحة لكل جزء)
const PAGES_PER_JUZ = 20;

export const QuickSettingsForm = ({ onSubmit, onSwitchToFull, initialSettings }: QuickSettingsFormProps) => {
  const [memorizationUnit, setMemorizationUnit] = useState<MemorizationUnit>(initialSettings?.memorizationUnit || 'pages');
  const [direction, setDirection] = useState<'beginning' | 'end'>(
    initialSettings ? (initialSettings.currentSurahNumber >= 78 ? 'end' : 'beginning') : 'beginning'
  );
  const [currentSurahNumber, setCurrentSurahNumber] = useState<number>(
    initialSettings?.currentSurahNumber || 1
  );
  const [currentPosition, setCurrentPosition] = useState<number>(
    initialSettings ? (initialSettings.memorizationUnit === 'verses' ? initialSettings.currentVerseNumber : initialSettings.currentPageInSurah - (surahs.find(s => s.number === initialSettings.currentSurahNumber)?.startPage || 0) + 1) : 1
  );
  const [dailyAmount, setDailyAmount] = useState<number>(initialSettings?.dailyNewMemorization || 1);
  const [restDaysCount, setRestDaysCount] = useState<number>(() => {
    if (!initialSettings?.memorizationDays) return 0;
    return 7 - initialSettings.memorizationDays.length;
  });
  const [dailyReview, setDailyReview] = useState<number>(initialSettings?.dailyNearReview ? initialSettings.dailyNearReview * 2 : 5);
  const [hasFarReview, setHasFarReview] = useState<boolean>(initialSettings ? (initialSettings.dailyFarReview || 0) > 0 : false);
  const [farReviewSurahNumber, setFarReviewSurahNumber] = useState<number>(initialSettings?.farReviewSurahNumber || 1);
  const [memorizedJuzCount, setMemorizedJuzCount] = useState<number>(initialSettings ? Math.round(initialSettings.currentMemorizedPages / PAGES_PER_JUZ) : 0);

  const selectedSurah = surahs.find(s => s.number === currentSurahNumber);

  // ترتيب السور حسب اتجاه الحفظ
  const orderedSurahs = direction === 'end' ? [...surahs].reverse() : surahs;

  // حساب الصفحات المحفوظة من عدد الأجزاء
  const memorizedPages = useMemo(() => {
    return memorizedJuzCount * PAGES_PER_JUZ;
  }, [memorizedJuzCount]);

  const getUnitLabel = () => {
    switch (memorizationUnit) {
      case 'rub': return 'ربع';
      case 'hizb': return 'حزب';
      case 'verses': return 'آية';
      default: return 'صفحة';
    }
  };

  const getAmountLabel = (amount: number): string => {
    if (memorizationUnit === 'rub') {
      const words: Record<number, string> = {
        1: 'ربع واحد', 2: 'ربعان', 3: 'ثلاثة أرباع', 4: 'أربعة أرباع',
        5: 'خمسة أرباع', 6: 'ستة أرباع', 7: 'سبعة أرباع', 8: 'ثمانية أرباع',
      };
      return words[amount] || `${amount} ربع`;
    }
    if (memorizationUnit === 'hizb') {
      const words: Record<number, string> = {
        1: 'حزب واحد', 2: 'حزبان', 3: 'ثلاثة أحزاب', 4: 'أربعة أحزاب',
      };
      return words[amount] || `${amount} حزب`;
    }
    return `${amount} ${getUnitLabel()}`;
  };

  const getPositionLabel = () => {
    switch (memorizationUnit) {
      case 'verses': return 'الآية';
      default: return 'الصفحة';
    }
  };

  const getMaxPosition = () => {
    if (!selectedSurah) return 10;
    switch (memorizationUnit) {
      case 'verses': return selectedSurah.totalVerses;
      default: return selectedSurah.totalPages;
    }
  };

  const handleSubmit = () => {
    const startPage = selectedSurah 
      ? (memorizationUnit === 'pages' 
          ? selectedSurah.startPage + currentPosition - 1 
          : selectedSurah.startPage)
      : 1;

    const memDays = getMemorizationDaysFromRest(restDaysCount);
    const settings: UserSettings = {
      memorizationUnit,
      memorizationFrequency: 'daily',
      memorizationDays: memDays,
      currentSurahNumber,
      currentPageInSurah: startPage,
      currentRubNumber: getRubByPage(startPage)?.number || 1,
      currentHizbNumber: getHizbByPage(startPage)?.number || 1,
      currentVerseNumber: memorizationUnit === 'verses' ? currentPosition : 1,
      currentMemorizedPages: memorizedPages,
      dailyNewMemorization: dailyAmount,
      memorizedSurahs: [],
      nearReviewSurahNumber: currentSurahNumber,
      nearReviewStartVerse: 1,
      dailyNearReview: Math.ceil(dailyReview / 2),
      nearReviewOrder: 'forward',
      farReviewSurahNumber: hasFarReview ? farReviewSurahNumber : currentSurahNumber,
      farReviewStartVerse: 1,
      dailyFarReview: hasFarReview ? dailyReview : 0,
      farReviewOrder: 'forward',
      startDate: new Date().toISOString().split('T')[0],
      setupMode: 'quick',
    };
    onSubmit(settings);
  };

  // السبت=6، الجمعة=5، الخميس=4 — أيام الراحة الافتراضية بالأولوية
  const getMemorizationDaysFromRest = (restCount: number): number[] | undefined => {
    if (restCount === 0) return undefined;
    const restDays = [6, 5, 4].slice(0, restCount);
    return [0, 1, 2, 3, 4, 5, 6].filter(d => !restDays.includes(d));
  };

  const getRestDaysLabel = (count: number): string => {
    if (count === 0) return 'كل يوم';
    const names: Record<number, string> = { 4: 'الخميس', 5: 'الجمعة', 6: 'السبت' };
    const days = [6, 5, 4].slice(0, count).reverse().map(d => names[d]);
    return days.join(' و');
  };

  const getMaxDailyAmount = () => {
    switch (memorizationUnit) {
      case 'verses': return 50;
      case 'rub': return 8;
      case 'hizb': return 4;
      default: return 10; // زيادة الحد الأقصى للصفحات اليومية
    }
  };

  const getMaxReview = () => {
    switch (memorizationUnit) {
      case 'verses': return 50;
      case 'rub': return 8;
      case 'hizb': return 4;
      default: return 20;
    }
  };

  return (
    <Card className="card-islamic overflow-hidden">
      <div className="bg-gradient-to-l from-primary/20 to-primary/5 p-6 border-b border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/20">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">إعداد سريع</h2>
            <p className="text-sm text-muted-foreground">ابدأ في دقيقة واحدة</p>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* وحدة الحفظ */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-medium">
            <BookOpen className="h-4 w-4 text-primary" />
            كيف تحفظ؟
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: 'pages', label: 'صفحات' },
              { value: 'verses', label: 'آيات' },
              { value: 'rub', label: 'أرباع' },
              { value: 'hizb', label: 'أحزاب' },
            ].map((unit) => (
              <button
                key={unit.value}
                onClick={() => {
                  setMemorizationUnit(unit.value as MemorizationUnit);
                  setCurrentPosition(1);
                }}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  memorizationUnit === unit.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                {unit.label}
              </button>
            ))}
          </div>
        </div>

        {/* سؤال اتجاه الحفظ */}
        <div className="space-y-3">
          <Label className="text-base font-medium">من أين تحفظ القرآن؟</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setDirection('beginning');
                setCurrentSurahNumber(1);
                setCurrentPosition(1);
              }}
              className={`p-4 rounded-xl border-2 text-center transition-all space-y-1 ${
                direction === 'beginning'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-muted hover:border-primary/40'
              }`}
            >
              <div className="text-2xl">📖</div>
              <p className="font-semibold text-sm">من البداية</p>
              <p className="text-xs text-muted-foreground">الفاتحة، البقرة...</p>
            </button>
            <button
              onClick={() => {
                setDirection('end');
                setCurrentSurahNumber(78);
                setCurrentPosition(1);
              }}
              className={`p-4 rounded-xl border-2 text-center transition-all space-y-1 ${
                direction === 'end'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-muted hover:border-primary/40'
              }`}
            >
              <div className="text-2xl">📚</div>
              <p className="font-semibold text-sm">من النهاية</p>
              <p className="text-xs text-muted-foreground">النبأ، الناس...</p>
            </button>
          </div>
        </div>

        {/* السورة والموقع الحالي */}
        <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-muted">
          <Label className="flex items-center gap-2 text-base font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            أين وصلت في حفظك؟
          </Label>

          <Select
            value={currentSurahNumber.toString()}
            onValueChange={(v) => {
              setCurrentSurahNumber(parseInt(v));
              setCurrentPosition(1);
            }}
          >
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {orderedSurahs.map((surah) => (
                <SelectItem key={surah.number} value={surah.number.toString()}>
                  {surah.number}. {surah.arabicName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(memorizationUnit === 'pages' || memorizationUnit === 'verses') && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{getPositionLabel()} الحالية</span>
                <span className="text-lg font-bold text-primary">
                  {currentPosition}
                  <span className="text-sm font-normal text-muted-foreground"> من أصل {getMaxPosition()} {memorizationUnit === 'verses' ? 'آية' : 'وجه'}</span>
                </span>
              </div>
              <Slider
                value={[currentPosition]}
                onValueChange={(v) => setCurrentPosition(v[0])}
                min={1}
                max={getMaxPosition()}
                step={1}
                className="py-2"
              />
            </div>
          )}
        </div>

        {/* المقدار اليومي */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-base font-medium">مقدار الحفظ اليومي</Label>
            <span className="text-lg font-bold text-primary">
              {getAmountLabel(dailyAmount)}
            </span>
          </div>
          <Slider
            value={[dailyAmount]}
            onValueChange={(v) => setDailyAmount(v[0])}
            min={1}
            max={getMaxDailyAmount()}
            step={1}
            className="py-2"
          />
        </div>

        {/* أيام الراحة الأسبوعية */}
        <div className="space-y-3">
          <div>
            <Label className="text-base font-medium">أيام الراحة الأسبوعية</Label>
            <p className="text-xs text-muted-foreground mt-0.5">أيام بدون حفظ جديد — مراجعة فقط</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { count: 0, label: 'لا راحة' },
              { count: 1, label: 'يوم' },
              { count: 2, label: 'يومان' },
              { count: 3, label: '٣ أيام' },
            ].map(({ count, label }) => (
              <button
                key={count}
                onClick={() => setRestDaysCount(count)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  restDaysCount === count
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <span className="block text-sm font-semibold">{label}</span>
              </button>
            ))}
          </div>
          {restDaysCount > 0 && (
            <p className="text-xs text-muted-foreground">
              🗓 أيام الراحة: <span className="font-medium text-foreground">{getRestDaysLabel(restDaysCount)}</span>
            </p>
          )}
        </div>

        {/* المراجعة اليومية */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <Label className="flex items-center gap-2 text-base font-medium">
                <RefreshCw className="h-4 w-4 text-secondary-foreground" />
                المراجعة القريبة
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">كمية ما ستراجعه يومياً من حفظك الأخير</p>
            </div>
            <span className="text-lg font-bold text-secondary-foreground">
              {getAmountLabel(dailyReview)}
            </span>
          </div>
          <Slider
            value={[dailyReview]}
            onValueChange={(v) => setDailyReview(v[0])}
            min={1}
            max={getMaxReview()}
            step={1}
            className="py-2"
          />
        </div>

        {/* الحفظ السابق */}
        <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-muted">
          <Label className="flex items-center gap-2 text-base font-medium">
            📚 كم جزء حفظته سابقاً؟
          </Label>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {memorizedJuzCount === 0 ? 'لم أحفظ شيئاً بعد' : `${memorizedJuzCount} جزء (${memorizedPages} صفحة)`}
            </span>
            <span className="text-lg font-bold text-primary">{memorizedJuzCount}</span>
          </div>
          <Slider
            value={[memorizedJuzCount]}
            onValueChange={(v) => setMemorizedJuzCount(v[0])}
            min={0}
            max={30}
            step={1}
            className="py-2"
          />
        </div>

        {/* المراجعة البعيدة */}
        {memorizedJuzCount > 0 && (
          <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-muted">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">تفعيل المراجعة البعيدة للحفظ السابق</Label>
              <Switch
                checked={hasFarReview}
                onCheckedChange={setHasFarReview}
              />
            </div>
            
            {hasFarReview && (
              <Select
                value={farReviewSurahNumber.toString()}
                onValueChange={(v) => setFarReviewSurahNumber(parseInt(v))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="من أي سورة تبدأ المراجعة؟" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {surahs.map((surah) => (
                    <SelectItem key={surah.number} value={surah.number.toString()}>
                      {surah.number}. {surah.arabicName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* الأزرار */}
        <div className="space-y-3 pt-4">
          <Button onClick={handleSubmit} className="w-full h-12 text-lg gap-2">
            <Zap className="h-5 w-5" />
            ابدأ الآن
          </Button>
          <Button 
            variant="ghost" 
            onClick={onSwitchToFull}
            className="w-full text-muted-foreground gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            أريد تخصيصًا أكثر
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
