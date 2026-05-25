import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { surahs, juzs, TOTAL_RUB, TOTAL_HIZB, getSurahNameForRub, getSurahNameForHizb, rubs, hizbs } from '@/data/quranData';
import { UserSettings, MemorizationUnit, MemorizationFrequency, ReviewOrder } from '@/types/schedule';
import { BookOpen, Calendar, RefreshCw, Star, Grid3X3, Check, Clock, Layers, ChevronRight, ChevronLeft, Sparkles, GripVertical } from 'lucide-react';
import { JuzSelector } from './JuzSelector';
import { FlexibleSortableList } from './FlexibleSortableList';

interface SettingsFormProps {
  onSubmit: (settings: UserSettings) => void;
  initialSettings?: UserSettings | null;
}

const TOTAL_STEPS = 4;

export const SettingsForm = ({ onSubmit, initialSettings }: SettingsFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // الحالة - الحفظ
  const [memorizationUnit, setMemorizationUnit] = useState<MemorizationUnit>(
    initialSettings?.memorizationUnit || 'pages'
  );
  const [memorizationFrequency, setMemorizationFrequency] = useState<MemorizationFrequency>(
    initialSettings?.memorizationFrequency || 'daily'
  );
  const [currentSurahNumber, setCurrentSurahNumber] = useState<number>(
    initialSettings?.currentSurahNumber || 1
  );
  const [currentPageInSurah, setCurrentPageInSurah] = useState<number>(
    initialSettings?.currentPageInSurah || 1
  );
  const [currentRubNumber, setCurrentRubNumber] = useState<number>(
    initialSettings?.currentRubNumber || 1
  );
  const [currentHizbNumber, setCurrentHizbNumber] = useState<number>(
    initialSettings?.currentHizbNumber || 1
  );
  const [currentVerseNumber, setCurrentVerseNumber] = useState<number>(
    initialSettings?.currentVerseNumber || 1
  );
  const [memorizedSurahs, setMemorizedSurahs] = useState<number[]>(
    initialSettings?.memorizedSurahs || []
  );
  const [memorizedJuzs, setMemorizedJuzs] = useState<number[]>([]);
  const [dailyNewMemorization, setDailyNewMemorization] = useState<number>(
    initialSettings?.dailyNewMemorization || 1
  );
  const [dailyNewMemorizationDecimal, setDailyNewMemorizationDecimal] = useState<string>(
    initialSettings?.dailyNewMemorization?.toString() || '1'
  );
  const [startDate, setStartDate] = useState<string>(
    initialSettings?.startDate || new Date().toISOString().split('T')[0]
  );

  // الحالة - المراجعة القريبة
  const [nearReviewSurahNumber, setNearReviewSurahNumber] = useState<number>(
    initialSettings?.nearReviewSurahNumber || 1
  );
  const [nearReviewStartVerse, setNearReviewStartVerse] = useState<number>(
    initialSettings?.nearReviewStartVerse || 1
  );
  const [dailyNearReview, setDailyNearReview] = useState<number>(
    initialSettings?.dailyNearReview ?? 1
  );
  const [nearReviewOrder, setNearReviewOrder] = useState<ReviewOrder>(
    initialSettings?.nearReviewOrder || 'forward'
  );

  // الحالة - المراجعة البعيدة
  const [farReviewSurahNumber, setFarReviewSurahNumber] = useState<number>(
    initialSettings?.farReviewSurahNumber || 1
  );
  const [farReviewStartVerse, setFarReviewStartVerse] = useState<number>(
    initialSettings?.farReviewStartVerse || 1
  );
  const [dailyFarReview, setDailyFarReview] = useState<number>(
    initialSettings?.dailyFarReview ?? 50
  );
  const [farReviewOrder, setFarReviewOrder] = useState<ReviewOrder>(
    initialSettings?.farReviewOrder || 'forward'
  );

  // تفعيل/تعطيل المراحل
  const [enableNearReview, setEnableNearReview] = useState<boolean>(
    initialSettings?.enableNearReview !== false
  );
  const [enableFarReview, setEnableFarReview] = useState<boolean>(
    initialSettings?.enableFarReview !== false
  );
  const [enableTomorrowPreparation, setEnableTomorrowPreparation] = useState<boolean>(
    initialSettings?.enableTomorrowPreparation !== false
  );
  const [enableWeeklyPreparation, setEnableWeeklyPreparation] = useState<boolean>(
    initialSettings?.enableWeeklyPreparation !== false
  );

  // ترتيب السور المخصص للمراجعة القريبة - يستخدم معرفات فريدة: "juz-X" أو "surah-X"
  const [nearCustomOrder, setNearCustomOrder] = useState<string[]>(
    initialSettings?.nearReviewCustomOrder || []
  );
  // ترتيب السور المخصص للمراجعة البعيدة
  const [farCustomOrder, setFarCustomOrder] = useState<string[]>(
    initialSettings?.farReviewCustomOrder || []
  );

  // دمج السور المحفوظة مباشرة + السور من الأجزاء المختارة
  const allMemorizedSurahs = useMemo(() => {
    const surahSet = new Set<number>(memorizedSurahs);
    
    // إضافة كل السور الموجودة في الأجزاء المختارة
    memorizedJuzs.forEach((juzNumber) => {
      const juz = juzs.find((j) => j.number === juzNumber);
      if (!juz) return;
      
      // السور التي تتداخل مع هذا الجزء
      surahs.forEach((surah) => {
        if (surah.startPage <= juz.endPage && surah.endPage >= juz.startPage) {
          surahSet.add(surah.number);
        }
      });
    });
    
    return Array.from(surahSet);
  }, [memorizedSurahs, memorizedJuzs]);

  // الحصول على السور المحفوظة مرتبة حسب المصحف
  const sortedMemorizedSurahs = useMemo(() => {
    return [...allMemorizedSurahs].sort((a, b) => a - b);
  }, [allMemorizedSurahs]);

  // الحصول على السور في جزء معين
  const getSurahsInJuz = useCallback((juzNumber: number): number[] => {
    const juz = juzs.find(j => j.number === juzNumber);
    if (!juz) return [];
    return surahs
      .filter(s => s.startPage <= juz.endPage && s.endPage >= juz.startPage)
      .map(s => s.number);
  }, []);

  // تحويل ترتيب المجموعات إلى ترتيب سور
  const getExpandedSurahOrder = useCallback((groupOrder: string[]): number[] => {
    const result: number[] = [];
    groupOrder.forEach(id => {
      if (id.startsWith('juz-')) {
        const juzNum = parseInt(id.replace('juz-', ''));
        const juzSurahs = getSurahsInJuz(juzNum).filter(s => allMemorizedSurahs.includes(s));
        juzSurahs.forEach(s => {
          if (!result.includes(s)) result.push(s);
        });
      } else if (id.startsWith('surah-')) {
        const surahNum = parseInt(id.replace('surah-', ''));
        if (!result.includes(surahNum) && allMemorizedSurahs.includes(surahNum)) {
          result.push(surahNum);
        }
      }
    });
    return result;
  }, [getSurahsInJuz, allMemorizedSurahs]);

  // الحصول على توضيح الترتيب
  const getOrderDescription = useCallback((order: ReviewOrder) => {
    if (sortedMemorizedSurahs.length === 0) return null;
    
    const firstSurah = surahs.find(s => s.number === sortedMemorizedSurahs[0]);
    const lastSurah = surahs.find(s => s.number === sortedMemorizedSurahs[sortedMemorizedSurahs.length - 1]);
    
    if (!firstSurah || !lastSurah) return null;
    
    const surahCount = sortedMemorizedSurahs.length;
    
    if (order === 'forward') {
      return `📖 المراجعة من المحفوظ فقط (${surahCount} سورة): من "${firstSurah.arabicName}" إلى "${lastSurah.arabicName}" بترتيب المصحف`;
    } else if (order === 'backward') {
      return `📖 المراجعة من المحفوظ فقط (${surahCount} سورة): من "${lastSurah.arabicName}" إلى "${firstSurah.arabicName}" بعكس ترتيب المصحف`;
    }
    return null;
  }, [sortedMemorizedSurahs]);

  // تزامن الترتيب المخصص مع المحفوظ (بدون تعبئة تلقائية)
  // إذا كان المستخدم قد بدأ ترتيباً مخصصاً بالفعل، نحذف فقط العناصر التي لم تعد ضمن المحفوظ.
  // مهم: نسمح بالسور المنفردة والأجزاء الفرعية من السور الطويلة.
  const getValidIds = useCallback(() => {
    const validIds = new Set<string>();
    memorizedJuzs.forEach((juzNum) => validIds.add(`juz-${juzNum}`));
    allMemorizedSurahs.forEach((surahNum) => {
      validIds.add(`surah-${surahNum}`);
      // أضف الأجزاء الفرعية للسور الطويلة (surah-X-juz-Y)
      const surah = surahs.find(s => s.number === surahNum);
      if (surah) {
        juzs.forEach(juz => {
          if (surah.startPage <= juz.endPage && surah.endPage >= juz.startPage) {
            validIds.add(`surah-${surahNum}-juz-${juz.number}`);
          }
        });
      }
    });
    return validIds;
  }, [allMemorizedSurahs, memorizedJuzs]);

  // تزامن الترتيب المخصص للمراجعة القريبة
  useEffect(() => {
    if (nearCustomOrder.length === 0) return;
    const validIds = getValidIds();
    const nextOrder = nearCustomOrder.filter((id) => validIds.has(id));
    if (nextOrder.length !== nearCustomOrder.length) {
      setNearCustomOrder(nextOrder);
    }
  }, [allMemorizedSurahs, memorizedJuzs, nearCustomOrder, getValidIds]);

  // تزامن الترتيب المخصص للمراجعة البعيدة
  useEffect(() => {
    if (farCustomOrder.length === 0) return;
    const validIds = getValidIds();
    const nextOrder = farCustomOrder.filter((id) => validIds.has(id));
    if (nextOrder.length !== farCustomOrder.length) {
      setFarCustomOrder(nextOrder);
    }
  }, [allMemorizedSurahs, memorizedJuzs, farCustomOrder, getValidIds]);

  // المعدل اليومي الفعلي بالوحدة المختارة
  const actualDailyNew = useMemo(() =>
    memorizationUnit === 'pages'
      ? parseFloat(dailyNewMemorizationDecimal) || 1
      : dailyNewMemorization,
  [memorizationUnit, dailyNewMemorizationDecimal, dailyNewMemorization]);

  // الحد الأقصى المنطقي للمراجعة = أسبوع من الحفظ
  const maxNearReview = useMemo(() =>
    Math.max(Math.ceil(actualDailyNew * 7), 1),
  [actualDailyNew]);

  const maxFarReview = useMemo(() =>
    allMemorizedSurahs.length > 0
      ? Math.min(Math.max(Math.ceil(actualDailyNew * 14), 5), 50)
      : Math.max(Math.ceil(actualDailyNew * 7), 1),
  [actualDailyNew, allMemorizedSurahs.length]);

  // ضبط تلقائي عند تجاوز الحد الجديد: القريب يرجع للأدنى، البعيد يبقى عند الأعلى
  const [nearReviewCapped, setNearReviewCapped] = useState(false);
  const [farReviewCapped, setFarReviewCapped] = useState(false);

  useEffect(() => {
    if (dailyNearReview > maxNearReview) {
      setDailyNearReview(1);
      setNearReviewCapped(true);
    } else {
      setNearReviewCapped(false);
    }
  }, [maxNearReview]);

  useEffect(() => {
    if (dailyFarReview > maxFarReview) {
      setDailyFarReview(maxFarReview);
      setFarReviewCapped(true);
    } else {
      setFarReviewCapped(false);
    }
  }, [maxFarReview]);

  // تقدير الوقت اليومي
  const dailyTimeEstimate = useMemo(() => {
    let min = Math.round(actualDailyNew * 12);
    if (enableNearReview) min += Math.round(dailyNearReview * 4);
    if (enableFarReview) min += Math.round(dailyFarReview * 3);
    if (enableTomorrowPreparation) min += 5;
    if (enableWeeklyPreparation) min += 5;
    return min;
  }, [actualDailyNew, enableNearReview, dailyNearReview, enableFarReview, dailyFarReview, enableTomorrowPreparation, enableWeeklyPreparation]);

  const currentMemorizedPages = useMemo(() => {
    const pages = new Set<number>();

    // السور المختارة
    memorizedSurahs.forEach((surahNumber) => {
      const surah = surahs.find((s) => s.number === surahNumber);
      if (!surah) return;
      for (let p = surah.startPage; p <= surah.endPage; p++) pages.add(p);
    });

    // الأجزاء المختارة
    memorizedJuzs.forEach((juzNumber) => {
      const juz = juzs.find((j) => j.number === juzNumber);
      if (!juz) return;
      for (let p = juz.startPage; p <= juz.endPage; p++) pages.add(p);
    });

    return pages.size;
  }, [memorizedSurahs, memorizedJuzs]);

  const selectedSurah = surahs.find(s => s.number === currentSurahNumber);
  const nearReviewSurah = surahs.find(s => s.number === nearReviewSurahNumber);
  const farReviewSurah = surahs.find(s => s.number === farReviewSurahNumber);

  const getUnitLabel = () => {
    switch (memorizationUnit) {
      case 'rub': return 'ربع';
      case 'hizb': return 'حزب';
      case 'verses': return 'آية';
      default: return 'صفحة';
    }
  };

  const getUnitLabelPlural = () => {
    switch (memorizationUnit) {
      case 'rub': return 'أرباع';
      case 'hizb': return 'أحزاب';
      case 'verses': return 'آيات';
      default: return 'صفحات';
    }
  };

  const getMaxUnit = () => {
    switch (memorizationUnit) {
      case 'rub': return TOTAL_RUB;
      case 'hizb': return TOTAL_HIZB;
      case 'verses': return selectedSurah?.totalVerses || 7;
      default: return 604;
    }
  };

  const handleSubmit = () => {
    const newMemValue = memorizationUnit === 'pages' 
      ? parseFloat(dailyNewMemorizationDecimal) || 1 
      : dailyNewMemorization;
    onSubmit({
      memorizationUnit,
      memorizationFrequency,
      currentSurahNumber,
      currentPageInSurah: selectedSurah ? selectedSurah.startPage + currentPageInSurah - 1 : 1,
      currentRubNumber,
      currentHizbNumber,
      currentVerseNumber,
      currentMemorizedPages,
      dailyNewMemorization: newMemValue,
      memorizedSurahs: sortedMemorizedSurahs,
      nearReviewSurahNumber,
      nearReviewStartVerse,
      dailyNearReview,
      nearReviewOrder,
      // الترتيب المخصص للمراجعة القريبة (نمرر الـ strings مباشرة)
      nearReviewCustomOrder: nearReviewOrder === 'custom' 
        ? nearCustomOrder 
        : undefined,
      farReviewSurahNumber,
      farReviewStartVerse,
      dailyFarReview,
      farReviewOrder,
      // الترتيب المخصص للمراجعة البعيدة (نمرر الـ strings مباشرة)
      farReviewCustomOrder: farReviewOrder === 'custom' 
        ? farCustomOrder 
        : undefined,
      // تفعيل/تعطيل المراحل
      enableNearReview,
      enableFarReview,
      enableTomorrowPreparation,
      enableWeeklyPreparation,
      startDate,
    });
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const stepTitles = [
    'طريقة الحفظ',
    'مقدار الحفظ',
    'السور المحفوظة',
    'المراجعة'
  ];

  return (
    <div className="space-y-6">
      {/* شريط التقدم */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">الخطوة {currentStep} من {TOTAL_STEPS}</span>
          <span className="font-semibold text-primary">{stepTitles[currentStep - 1]}</span>
        </div>
        <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-2" />
        
        {/* مؤشرات الخطوات */}
        <div className="flex justify-between">
          {stepTitles.map((title, index) => (
            <div 
              key={index}
              className={`flex flex-col items-center ${index + 1 <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  index + 1 < currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : index + 1 === currentStep 
                      ? 'bg-primary/20 border-2 border-primary text-primary' 
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1 < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className="text-[10px] sm:text-xs mt-1 text-center leading-tight">{title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* المحتوى */}
      <div className="card-islamic p-6 min-h-[400px] animate-fade-in">
        {/* الخطوة 1: طريقة الحفظ */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-gold/20 mb-2">
                <Grid3X3 className="h-8 w-8 text-gold" />
              </div>
              <h2 className="text-2xl font-bold">كيف تريد تقسيم حفظك؟</h2>
              <p className="text-muted-foreground">اختر الوحدة التي تناسب طريقة حفظك ثم اضغط "التالي"</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                <Calendar className="h-4 w-4" />
                <span>سيتم إنشاء جدول أسبوعي تفاعلي</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { value: 'pages', icon: BookOpen, label: 'بالصفحات', desc: '604 صفحة' },
                { value: 'rub', icon: Grid3X3, label: 'بالأرباع', desc: '240 ربع' },
                { value: 'hizb', icon: Star, label: 'بالأحزاب', desc: '60 حزب' },
                { value: 'verses', icon: Layers, label: 'بالآيات', desc: '6236 آية' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMemorizationUnit(option.value as MemorizationUnit)}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 p-6 transition-all hover:scale-[1.02] ${
                    memorizationUnit === option.value 
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30' 
                      : 'border-border bg-background hover:bg-accent/50'
                  }`}
                >
                  <div className={`mb-3 p-2 rounded-full ${memorizationUnit === option.value ? 'bg-primary/20' : 'bg-muted'}`}>
                    <option.icon className={`h-8 w-8 ${memorizationUnit === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="text-lg font-bold">{option.label}</span>
                  <span className="text-sm text-muted-foreground mt-1">{option.desc}</span>
                  {memorizationUnit === option.value && (
                    <div className="mt-2">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8 p-4 bg-accent/50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <Label className="text-base font-semibold">وتيرة الحفظ</Label>
              </div>
              <RadioGroup
                value={memorizationFrequency}
                onValueChange={(value) => setMemorizationFrequency(value as MemorizationFrequency)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="daily" id="freq-daily" className="peer sr-only" />
                  <Label
                    htmlFor="freq-daily"
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-background p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                  >
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">يومياً</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="weekly" id="freq-weekly" className="peer sr-only" />
                  <Label
                    htmlFor="freq-weekly"
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-background p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="font-semibold">أسبوعياً</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* الخطوة 2: موقعك ومقدار الحفظ */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold">من أين وصلت في حفظك؟</h2>
              <p className="text-sm text-muted-foreground">حدد موقعك الحالي في المصحف ومقدار حفظك اليومي</p>
            </div>

            {/* ① اختيار السورة — العنصر الأبرز */}
            <div className="rounded-2xl border-2 border-primary overflow-hidden">
              <div className="flex items-center gap-2 bg-primary px-4 py-3">
                <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-white text-xs font-bold shrink-0">١</div>
                <span className="font-bold text-white">
                  {memorizationUnit === 'rub' ? 'اختر الربع الذي ستبدأ منه' :
                   memorizationUnit === 'hizb' ? 'اختر الحزب الذي ستبدأ منه' :
                   'اختر السورة التي تحفظها الآن'}
                </span>
                <span className="mr-auto text-xs bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">مطلوب</span>
              </div>

              <div className="p-4 bg-primary/5 space-y-3">
                {(memorizationUnit === 'pages' || memorizationUnit === 'verses') && (
                  <>
                    <Select
                      value={currentSurahNumber.toString()}
                      onValueChange={(value) => {
                        setCurrentSurahNumber(parseInt(value));
                        setCurrentPageInSurah(1);
                        setCurrentVerseNumber(1);
                      }}
                    >
                      <SelectTrigger className="h-14 text-base bg-background border-2 border-primary/30 focus:border-primary">
                        <SelectValue placeholder="اختر السورة" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {surahs.map((surah) => (
                          <SelectItem key={surah.number} value={surah.number.toString()}>
                            <span className="text-muted-foreground text-xs ml-1">{surah.number}.</span> {surah.arabicName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedSurah && (
                      <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-primary/20">
                        <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
                          {currentSurahNumber}
                        </div>
                        <div>
                          <p className="font-bold text-base">{selectedSurah.arabicName}</p>
                          <p className="text-xs text-muted-foreground">
                            صفحة {selectedSurah.startPage}–{selectedSurah.endPage} · {selectedSurah.totalVerses} آية
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {memorizationUnit === 'rub' && (
                  <Select value={currentRubNumber.toString()} onValueChange={(v) => setCurrentRubNumber(parseInt(v))}>
                    <SelectTrigger className="h-14 text-base bg-background border-2 border-primary/30">
                      <SelectValue placeholder="الربع الحالي" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {rubs.map((rub) => (
                        <SelectItem key={rub.number} value={rub.number.toString()}>
                          الربع {rub.number} ({getSurahNameForRub(rub.number)}) - الجزء {rub.juzNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {memorizationUnit === 'hizb' && (
                  <Select value={currentHizbNumber.toString()} onValueChange={(v) => setCurrentHizbNumber(parseInt(v))}>
                    <SelectTrigger className="h-14 text-base bg-background border-2 border-primary/30">
                      <SelectValue placeholder="الحزب الحالي" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {hizbs.map((hizb) => (
                        <SelectItem key={hizb.number} value={hizb.number.toString()}>
                          الحزب {hizb.number} ({getSurahNameForHizb(hizb.number)}) - الجزء {hizb.juz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* ② من أي صفحة/آية — فقط للصفحات والآيات */}
            {(memorizationUnit === 'pages' || memorizationUnit === 'verses') && (
              <div className="rounded-2xl border-2 border-muted overflow-hidden">
                <div className="flex items-center gap-2 bg-muted/60 px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-muted-foreground/50 flex items-center justify-center text-background text-xs font-bold shrink-0">٢</div>
                  <span className="font-semibold text-sm">
                    من أي {memorizationUnit === 'verses' ? 'آية' : 'صفحة'} ستبدأ في هذه السورة؟
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {memorizationUnit === 'pages' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">صفحة المصحف</span>
                        <span className="text-3xl font-bold text-primary">
                          {(selectedSurah?.startPage || 1) + currentPageInSurah - 1}
                        </span>
                      </div>
                      <Slider
                        value={[currentPageInSurah]}
                        onValueChange={(value) => setCurrentPageInSurah(value[0])}
                        min={1}
                        max={selectedSurah?.totalPages || 1}
                        step={1}
                        className="py-2"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        وجه {currentPageInSurah} من {selectedSurah?.totalPages || 1} في سورة {selectedSurah?.arabicName}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">رقم الآية</span>
                        <span className="text-3xl font-bold text-primary">{currentVerseNumber}</span>
                      </div>
                      <Slider
                        value={[currentVerseNumber]}
                        onValueChange={(value) => setCurrentVerseNumber(value[0])}
                        min={1}
                        max={selectedSurah?.totalVerses || 7}
                        step={1}
                        className="py-2"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        آية {currentVerseNumber} من {selectedSurah?.totalVerses || 7} في سورة {selectedSurah?.arabicName}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ③ المقدار اليومي وتاريخ البدء */}
            <div className="grid grid-cols-1 gap-4 pt-1">
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  كم {getUnitLabel()} جديدة {memorizationFrequency === 'daily' ? 'يومياً' : 'أسبوعياً'}؟
                </Label>
                {memorizationUnit === 'pages' ? (
                  <Select value={dailyNewMemorizationDecimal} onValueChange={setDailyNewMemorizationDecimal}>
                    <SelectTrigger className="bg-background h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.25">ربع صفحة (¼)</SelectItem>
                      <SelectItem value="0.5">نصف صفحة (½)</SelectItem>
                      <SelectItem value="0.75">ثلاثة أرباع (¾)</SelectItem>
                      <SelectItem value="1">صفحة واحدة</SelectItem>
                      <SelectItem value="1.5">صفحة ونصف</SelectItem>
                      <SelectItem value="2">صفحتان</SelectItem>
                      <SelectItem value="3">3 صفحات</SelectItem>
                      <SelectItem value="4">4 صفحات</SelectItem>
                      <SelectItem value="5">5 صفحات</SelectItem>
                      <SelectItem value="6">6 صفحات</SelectItem>
                      <SelectItem value="7">7 صفحات</SelectItem>
                      <SelectItem value="8">8 صفحات</SelectItem>
                      <SelectItem value="10">10 صفحات</SelectItem>
                    </SelectContent>
                  </Select>
                ) : memorizationUnit === 'verses' ? (
                  <Select value={dailyNewMemorization.toString()} onValueChange={(v) => setDailyNewMemorization(parseInt(v))}>
                    <SelectTrigger className="bg-background h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">آية واحدة</SelectItem>
                      <SelectItem value="2">آيتان</SelectItem>
                      <SelectItem value="3">3 آيات</SelectItem>
                      <SelectItem value="5">5 آيات</SelectItem>
                      <SelectItem value="7">7 آيات</SelectItem>
                      <SelectItem value="10">10 آيات</SelectItem>
                      <SelectItem value="15">15 آية</SelectItem>
                      <SelectItem value="20">20 آية</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={dailyNewMemorization.toString()} onValueChange={(v) => setDailyNewMemorization(parseInt(v))}>
                    <SelectTrigger className="bg-background h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {memorizationUnit === 'rub' ? (
                        <>
                          <SelectItem value="1">ربع واحد</SelectItem>
                          <SelectItem value="2">ربعان</SelectItem>
                          <SelectItem value="3">3 أرباع</SelectItem>
                          <SelectItem value="4">4 أرباع</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="1">حزب واحد</SelectItem>
                          <SelectItem value="2">حزبان</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">تاريخ البدء</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background h-12"
                />
              </div>
            </div>
          </div>
        )}

        {/* الخطوة 3: السور المحفوظة */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-secondary/20 mb-2">
                <BookOpen className="h-8 w-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold">ما الذي حفظته سابقاً؟</h2>
              <p className="text-muted-foreground">اختر الأجزاء أو السور التي تريد مراجعتها (اختياري)</p>
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full inline-block">
                💡 يمكنك تخطي هذه الخطوة إذا لم تحفظ شيئاً بعد
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 space-y-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">ماذا لو تجاوزت هذه الخطوة؟</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                لا مشكلة — ستبدأ المراجعة البعيدة تلقائياً من الأسبوع الثاني لتراجع ما حفظته في جدولك الجديد.
                اختر هنا <strong>فقط</strong> إذا حفظت قرآناً سابقاً وتريد إدراجه في خطة مراجعتك.
              </p>
            </div>

            <JuzSelector
              memorizedSurahs={memorizedSurahs}
              onSurahsChange={setMemorizedSurahs}
              currentMemorizedPages={currentMemorizedPages}
              memorizedJuzs={memorizedJuzs}
              onJuzsChange={setMemorizedJuzs}
            />
          </div>
        )}

        {/* الخطوة 4: المراجعة */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-accent mb-2">
                <RefreshCw className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">كيف تريد مراجعة المحفوظ سابقاً؟</h2>
              <p className="text-muted-foreground">حدد ترتيب المراجعة ومقدارها اليومي</p>
            </div>

            <div className="max-w-lg mx-auto space-y-6 mt-6">

              {/* ملخص يومك */}
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">يومك سيتضمن تقريباً:</p>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">~{dailyTimeEstimate} دقيقة</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <span>حفظ {actualDailyNew} {getUnitLabel()} جديدة</span>
                  </div>
                  {enableNearReview && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                      <span>مراجعة قريبة: {dailyNearReview} {getUnitLabelPlural()} من حفظ أمس</span>
                    </div>
                  )}
                  {enableFarReview && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                      <span>مراجعة بعيدة: {dailyFarReview} {getUnitLabelPlural()} من الحفظ القديم</span>
                    </div>
                  )}
                  {enableTomorrowPreparation && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span>استماع لما ستحفظه غداً (~5 دقائق)</span>
                    </div>
                  )}
                  {enableWeeklyPreparation && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-amber-300 shrink-0" />
                      <span>استماع أسبوعي لكل الجديد (~5 دقائق)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* اختيار المراحل المفعلة */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <Label className="text-base font-semibold">ماذا تريد أن يتضمن جدولك؟</Label>
                <p className="text-xs text-muted-foreground">عطّل ما لا يناسبك — يمكنك تغييره لاحقاً</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={enableNearReview}
                      onChange={(e) => setEnableNearReview(e.target.checked)}
                      className="h-4 w-4 rounded mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium">المراجعة القريبة</p>
                      <p className="text-xs text-muted-foreground">مراجعة ما حفظته أمس يومياً</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={enableFarReview}
                      onChange={(e) => setEnableFarReview(e.target.checked)}
                      className="h-4 w-4 rounded mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium">المراجعة البعيدة</p>
                      <p className="text-xs text-muted-foreground">مراجعة الحفظ القديم دورياً</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={enableTomorrowPreparation}
                      onChange={(e) => setEnableTomorrowPreparation(e.target.checked)}
                      className="h-4 w-4 rounded mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium">التحضير للغد</p>
                      <p className="text-xs text-muted-foreground">استمع لما ستحفظه غداً مسبقاً</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={enableWeeklyPreparation}
                      onChange={(e) => setEnableWeeklyPreparation(e.target.checked)}
                      className="h-4 w-4 rounded mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium">التحضير الأسبوعي</p>
                      <p className="text-xs text-muted-foreground">استمع لكل جديد الأسبوع القادم</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* المراجعة القريبة */}
              {enableNearReview && (
              <div className="p-4 bg-primary/5 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <Label className="text-base font-semibold">المراجعة القريبة (الحفظ الجديد نسبياً)</Label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">ترتيب المراجعة</Label>
                    <RadioGroup
                      value={nearReviewOrder}
                      onValueChange={(value) => setNearReviewOrder(value as ReviewOrder)}
                      className="grid grid-cols-3 gap-2"
                    >
                      {[
                        { value: 'forward', label: 'حسب ترتيب المصحف' },
                        { value: 'backward', label: 'عكس ترتيب المصحف' },
                        { value: 'custom', label: 'ترتيب مخصص' },
                      ].map((option) => (
                        <div key={option.value}>
                          <RadioGroupItem value={option.value} id={`near-${option.value}`} className="peer sr-only" />
                          <Label
                            htmlFor={`near-${option.value}`}
                            className="flex items-center justify-center text-center rounded-lg border-2 border-border bg-background p-2 text-xs hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {/* توضيح الترتيب */}
                    {nearReviewOrder !== 'custom' && getOrderDescription(nearReviewOrder) && (
                      <p className="text-xs text-primary bg-primary/5 p-2 rounded-lg mt-2">
                        📍 {getOrderDescription(nearReviewOrder)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>المقدار اليومي</span>
                      <span className="font-bold text-primary">{dailyNearReview} {getUnitLabelPlural()}</span>
                    </div>
                    <Slider
                      value={[dailyNearReview]}
                      onValueChange={(value) => setDailyNearReview(value[0])}
                      min={1}
                      max={maxNearReview}
                      step={1}
                      className="py-2"
                    />
                    {nearReviewCapped ? (
                      <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1.5 rounded-lg">
                        ⚠️ تم تعديل القدر تلقائياً ليتناسب مع معدل حفظك — الحد الأقصى: {maxNearReview} {getUnitLabelPlural()}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        الحد الأقصى: {maxNearReview} {getUnitLabelPlural()} (أسبوع من حفظك اليومي)
                      </p>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* المراجعة البعيدة */}
              {enableFarReview && (
              <div className="p-4 bg-accent/50 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <Label className="text-base font-semibold">المراجعة البعيدة (الحفظ القديم)</Label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">ترتيب المراجعة</Label>
                    <RadioGroup
                      value={farReviewOrder}
                      onValueChange={(value) => setFarReviewOrder(value as ReviewOrder)}
                      className="grid grid-cols-3 gap-2"
                    >
                      {[
                        { value: 'forward', label: 'حسب ترتيب المصحف' },
                        { value: 'backward', label: 'عكس ترتيب المصحف' },
                        { value: 'custom', label: 'ترتيب مخصص' },
                      ].map((option) => (
                        <div key={option.value}>
                          <RadioGroupItem value={option.value} id={`far-${option.value}`} className="peer sr-only" />
                          <Label
                            htmlFor={`far-${option.value}`}
                            className="flex items-center justify-center text-center rounded-lg border-2 border-border bg-background p-2 text-xs hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {/* توضيح الترتيب */}
                    {farReviewOrder !== 'custom' && getOrderDescription(farReviewOrder) && (
                      <p className="text-xs text-primary bg-primary/5 p-2 rounded-lg mt-2">
                        📍 {getOrderDescription(farReviewOrder)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>المقدار اليومي</span>
                      <span className="font-bold text-primary">{dailyFarReview} {getUnitLabelPlural()}</span>
                    </div>
                    <Slider
                      value={[dailyFarReview]}
                      onValueChange={(value) => setDailyFarReview(value[0])}
                      min={1}
                      max={maxFarReview}
                      step={1}
                      className="py-2"
                    />
                    {farReviewCapped ? (
                      <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1.5 rounded-lg">
                        ⚠️ تم تعديل القدر تلقائياً ليتناسب مع معدل حفظك — الحد الأقصى: {maxFarReview} {getUnitLabelPlural()}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        الحد الأقصى: {maxFarReview} {getUnitLabelPlural()}
                        {allMemorizedSurahs.length === 0 && ' · ستبدأ من الأسبوع الثاني تلقائياً'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* ترتيب السور المخصص للمراجعة القريبة */}
              {nearReviewOrder === 'custom' && allMemorizedSurahs.length > 0 && (
                <div className="p-4 bg-emerald-500/10 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-emerald-600" />
                    <Label className="text-base font-semibold text-emerald-700 dark:text-emerald-400">
                      ترتيب المراجعة القريبة المخصص
                    </Label>
                  </div>
                  <FlexibleSortableList
                    memorizedSurahs={memorizedSurahs}
                    memorizedJuzs={memorizedJuzs}
                    customOrder={nearCustomOrder}
                    onOrderChange={setNearCustomOrder}
                    getSurahsInJuz={getSurahsInJuz}
                  />
                </div>
              )}

              {/* ترتيب السور المخصص للمراجعة البعيدة */}
              {farReviewOrder === 'custom' && allMemorizedSurahs.length > 0 && (
                <div className="p-4 bg-gold/10 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-gold" />
                    <Label className="text-base font-semibold text-amber-700 dark:text-amber-400">
                      ترتيب المراجعة البعيدة المخصص
                    </Label>
                  </div>
                  <FlexibleSortableList
                    memorizedSurahs={memorizedSurahs}
                    memorizedJuzs={memorizedJuzs}
                    customOrder={farCustomOrder}
                    onOrderChange={setFarCustomOrder}
                    getSurahsInJuz={getSurahsInJuz}
                  />
                </div>
              )}

              {memorizedSurahs.length === 0 && memorizedJuzs.length === 0 && (
                <p className="text-sm text-amber-600 text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  ⚠️ لم تحدد أي سور أو أجزاء محفوظة في الخطوة السابقة
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center">
                💡 عند إكمال مراجعة السورة، ستنتقل تلقائياً للسورة التالية حسب الترتيب المختار
              </p>
            </div>
          </div>
        )}
      </div>

      {/* أزرار التنقل */}
      <div className="flex gap-3">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            className="flex-1 h-12"
          >
            <ChevronRight className="h-5 w-5 ml-1" />
            السابق
          </Button>
        )}
        <Button
          type="button"
          onClick={nextStep}
          className={`flex-1 h-12 ${currentStep === 1 ? 'w-full' : ''} ${currentStep === TOTAL_STEPS ? 'btn-primary-islamic' : ''}`}
        >
          {currentStep === TOTAL_STEPS ? (
            <>
              <Sparkles className="h-5 w-5 ml-1" />
              إنشاء الجدول
            </>
          ) : (
            <>
              التالي
              <ChevronLeft className="h-5 w-5 mr-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
