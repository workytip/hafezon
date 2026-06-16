import { UserSettings, DailyTask, VerseRange } from '@/types/schedule';
import { 
  surahs, 
  juzs,
  getSurahByPage, 
  getSurahByNumber, 
  TOTAL_PAGES,
  rubs,
  hizbs,
  getRubByNumber,
  getHizbByNumber,
  TOTAL_RUB,
  TOTAL_HIZB,
  TOTAL_VERSES
} from '@/data/quranData';

export const generateDailyTasks = (
  settings: UserSettings,
  numberOfDays: number = 30
): DailyTask[] => {
  const tasks: DailyTask[] = [];
  const startDate = new Date(settings.startDate);
  
  const { memorizationUnit, memorizationFrequency } = settings;
  
  // تحديد القيم الابتدائية حسب وحدة القياس
  let currentUnit = memorizationUnit === 'pages' 
    ? settings.currentPageInSurah 
    : memorizationUnit === 'rub' 
    ? settings.currentRubNumber 
    : memorizationUnit === 'hizb'
    ? settings.currentHizbNumber
    : settings.currentVerseNumber;
  
  let currentSurahNumber = settings.currentSurahNumber;
  
  // للآيات: تتبع السورة والآية الحالية للحفظ الجديد
  let currentVerseSurah = settings.currentSurahNumber;
  let currentVerseInSurah = settings.currentVerseNumber;
  
  // المراجعة القريبة: تتبع الموقع الحالي
  let nearReviewCurrentSurah = settings.nearReviewSurahNumber;
  let nearReviewCurrentVerse = settings.nearReviewStartVerse;
  
  // المراجعة البعيدة: تتبع الموقع الحالي
  let farReviewCurrentSurah = settings.farReviewSurahNumber;
  let farReviewCurrentVerse = settings.farReviewStartVerse;
  
  const getMaxUnit = () => {
    switch (memorizationUnit) {
      case 'rub': return TOTAL_RUB;
      case 'hizb': return TOTAL_HIZB;
      case 'verses': return TOTAL_VERSES;
      default: return TOTAL_PAGES;
    }
  };

  const getUnitPages = (unitNumber: number): number[] => {
    if (memorizationUnit === 'rub') {
      const rub = getRubByNumber(unitNumber);
      if (!rub) return [];
      const pages: number[] = [];
      for (let p = rub.startPage; p <= rub.endPage; p++) {
        pages.push(p);
      }
      return pages;
    } else if (memorizationUnit === 'hizb') {
      const hizb = getHizbByNumber(unitNumber);
      if (!hizb) return [];
      const pages: number[] = [];
      for (let p = hizb.startPage; p <= hizb.endPage; p++) {
        pages.push(p);
      }
      return pages;
    } else if (memorizationUnit === 'verses') {
      return [];
    }
    return [unitNumber];
  };

  const getUnitLabel = (unitNumber: number, count: number = 1): string => {
    if (memorizationUnit === 'rub') {
      const rub = getRubByNumber(unitNumber);
      return rub ? `الربع ${unitNumber} (الحزب ${rub.hizbNumber})` : `الربع ${unitNumber}`;
    } else if (memorizationUnit === 'hizb') {
      const hizb = getHizbByNumber(unitNumber);
      return hizb ? `الحزب ${unitNumber} (الجزء ${hizb.juz})` : `الحزب ${unitNumber}`;
    } else if (memorizationUnit === 'verses') {
      return `${count} آية`;
    }
    return count > 1 ? `صفحات ${unitNumber}` : `صفحة ${unitNumber}`;
  };
  
  // دالة لحساب نطاق الآيات للحفظ الجديد
  const calculateVerseRange = (amount: number): VerseRange | undefined => {
    if (memorizationUnit !== 'verses') return undefined;
    
    const surah = getSurahByNumber(currentVerseSurah);
    if (!surah) return undefined;
    
    const startVerse = currentVerseInSurah;
    let endVerse = Math.min(startVerse + amount - 1, surah.totalVerses);
    
    const range: VerseRange = {
      surahNumber: currentVerseSurah,
      surahName: surah.arabicName,
      startVerse,
      endVerse
    };
    
    // تحديث الموقع الحالي
    if (endVerse >= surah.totalVerses) {
      const remainingVerses = amount - (surah.totalVerses - startVerse + 1);
      if (remainingVerses > 0 && currentVerseSurah < 114) {
        currentVerseSurah++;
        currentVerseInSurah = 1 + remainingVerses;
      } else {
        currentVerseSurah++;
        currentVerseInSurah = 1;
      }
    } else {
      currentVerseInSurah = endVerse + 1;
    }
    
    return range;
  };

  // ترتيب المراجعة
  const nearReviewOrder = settings.nearReviewOrder || 'forward';
  const farReviewOrder = settings.farReviewOrder || 'forward';
  
  // السور المحفوظة
  const memorizedSurahs = settings.memorizedSurahs || [];
  // الترتيب المخصص المنفصل لكل نوع مراجعة (strings)
  const nearReviewCustomOrder = settings.nearReviewCustomOrder || [];
  const farReviewCustomOrder = settings.farReviewCustomOrder || [];

  // دالة لتحليل عنصر الترتيب المخصص والحصول على نطاق الصفحات
  const parseCustomOrderItem = (item: string): { surahNumber: number; startPage: number; endPage: number } | null => {
    // جزء كامل: "juz-30"
    if (item.startsWith('juz-')) {
      const juzNum = parseInt(item.replace('juz-', ''));
      const juz = juzs.find(j => j.number === juzNum);
      if (!juz) return null;
      // أول سورة في الجزء
      const firstSurah = surahs.find(s => s.startPage >= juz.startPage && s.startPage <= juz.endPage);
      return {
        surahNumber: firstSurah?.number || 1,
        startPage: juz.startPage,
        endPage: juz.endPage
      };
    }
    
    // سورة مع جزء محدد: "surah-2-juz-3"
    if (item.includes('-juz-')) {
      const match = item.match(/surah-(\d+)-juz-(\d+)/);
      if (match) {
        const surahNum = parseInt(match[1]);
        const juzNum = parseInt(match[2]);
        const surah = getSurahByNumber(surahNum);
        const juz = juzs.find(j => j.number === juzNum);
        if (!surah || !juz) return null;
        // تقاطع صفحات السورة مع الجزء
        const startPage = Math.max(surah.startPage, juz.startPage);
        const endPage = Math.min(surah.endPage, juz.endPage);
        return { surahNumber: surahNum, startPage, endPage };
      }
    }
    
    // جزء من سورة (portion): "surah-2-portion-3" 
    if (item.includes('-portion-')) {
      const match = item.match(/surah-(\d+)-portion-(\d+)/);
      if (match) {
        const surahNum = parseInt(match[1]);
        const juzNum = parseInt(match[2]);
        const surah = getSurahByNumber(surahNum);
        const juz = juzs.find(j => j.number === juzNum);
        if (!surah || !juz) return null;
        const startPage = Math.max(surah.startPage, juz.startPage);
        const endPage = Math.min(surah.endPage, juz.endPage);
        return { surahNumber: surahNum, startPage, endPage };
      }
    }
    
    // سورة كاملة: "surah-2" أو رقم فقط "2"
    const surahMatch = item.match(/surah-(\d+)/) || item.match(/^(\d+)$/);
    if (surahMatch) {
      const surahNum = parseInt(surahMatch[1]);
      const surah = getSurahByNumber(surahNum);
      if (!surah) return null;
      return { surahNumber: surahNum, startPage: surah.startPage, endPage: surah.endPage };
    }
    
    return null;
  };

  // دالة للحصول على العنصر التالي في الترتيب المخصص
  const getNextCustomItem = (
    currentItem: string,
    customList: string[]
  ): string | null => {
    if (customList.length === 0) return null;
    const currentIndex = customList.indexOf(currentItem);
    if (currentIndex !== -1 && currentIndex < customList.length - 1) {
      return customList[currentIndex + 1];
    }
    // العودة للأول
    return customList[0];
  };

  // تتبع العنصر الحالي في الترتيب المخصص
  let nearCurrentCustomItem = nearReviewCustomOrder[0] || '';
  let farCurrentCustomItem = farReviewCustomOrder[0] || '';

  // دالة للحصول على السورة التالية حسب الترتيب (للترتيب غير المخصص)
  const getNextSurah = (
    currentSurah: number, 
    order: 'forward' | 'backward' | 'custom'
  ): number => {
    if (order === 'backward') {
      return currentSurah > 1 ? currentSurah - 1 : 114;
    }
    return currentSurah < 114 ? currentSurah + 1 : 1;
  };

  // دالة لحساب نطاق المراجعة القريبة
  const calculateNearReviewRange = (amount: number): VerseRange | undefined => {
    // للترتيب المخصص: نستخدم بيانات العنصر الحالي
    if (nearReviewOrder === 'custom' && nearCurrentCustomItem) {
      const itemData = parseCustomOrderItem(nearCurrentCustomItem);
      if (itemData) {
        const surah = getSurahByNumber(itemData.surahNumber);
        if (!surah) return undefined;
        
        // حساب الصفحات النسبية داخل هذا الجزء
        const totalPagesInPortion = itemData.endPage - itemData.startPage + 1;
        const relativeStartPage = itemData.startPage + nearReviewCurrentVerse - 1;
        const relativeEndPage = Math.min(relativeStartPage + amount - 1, itemData.endPage);
        
        const range: VerseRange = {
          surahNumber: itemData.surahNumber,
          surahName: surah.arabicName,
          startVerse: relativeStartPage - itemData.startPage + 1, // موقع نسبي للعرض
          endVerse: relativeEndPage - itemData.startPage + 1
        };
        
        // إذا وصلنا لنهاية هذا الجزء
        if (relativeEndPage >= itemData.endPage) {
          const nextItem = getNextCustomItem(nearCurrentCustomItem, nearReviewCustomOrder);
          if (nextItem) {
            nearCurrentCustomItem = nextItem;
            nearReviewCurrentVerse = 1;
            // تحديث السورة الحالية من العنصر الجديد
            const nextData = parseCustomOrderItem(nextItem);
            if (nextData) {
              nearReviewCurrentSurah = nextData.surahNumber;
            }
          }
        } else {
          nearReviewCurrentVerse = relativeEndPage - itemData.startPage + 2;
        }
        
        // إرجاع النطاق بالصفحات الفعلية
        return {
          ...range,
          startVerse: relativeStartPage,
          endVerse: relativeEndPage
        };
      }
    }
    
    // للترتيب العادي (forward/backward)
    const surah = getSurahByNumber(nearReviewCurrentSurah);
    if (!surah) return undefined;
    
    const startVerse = nearReviewCurrentVerse;
    const maxVerse = memorizationUnit === 'verses' ? surah.totalVerses : surah.totalPages;
    let endVerse = Math.min(startVerse + amount - 1, maxVerse);
    
    const range: VerseRange = {
      surahNumber: nearReviewCurrentSurah,
      surahName: surah.arabicName,
      startVerse,
      endVerse
    };
    
    // تحديث الموقع الحالي للمراجعة القريبة
    if (endVerse >= maxVerse) {
      nearReviewCurrentSurah = getNextSurah(nearReviewCurrentSurah, nearReviewOrder);
      nearReviewCurrentVerse = 1;
    } else {
      nearReviewCurrentVerse = endVerse + 1;
    }
    
    return range;
  };

  // دالة لحساب نطاق المراجعة البعيدة
  const calculateFarReviewRange = (amount: number): VerseRange | undefined => {
    // للترتيب المخصص: نستخدم بيانات العنصر الحالي
    if (farReviewOrder === 'custom' && farCurrentCustomItem) {
      const itemData = parseCustomOrderItem(farCurrentCustomItem);
      if (itemData) {
        const surah = getSurahByNumber(itemData.surahNumber);
        if (!surah) return undefined;
        
        // حساب الصفحات النسبية داخل هذا الجزء
        const totalPagesInPortion = itemData.endPage - itemData.startPage + 1;
        const relativeStartPage = itemData.startPage + farReviewCurrentVerse - 1;
        const relativeEndPage = Math.min(relativeStartPage + amount - 1, itemData.endPage);
        
        const range: VerseRange = {
          surahNumber: itemData.surahNumber,
          surahName: surah.arabicName,
          startVerse: relativeStartPage - itemData.startPage + 1,
          endVerse: relativeEndPage - itemData.startPage + 1
        };
        
        // إذا وصلنا لنهاية هذا الجزء
        if (relativeEndPage >= itemData.endPage) {
          const nextItem = getNextCustomItem(farCurrentCustomItem, farReviewCustomOrder);
          if (nextItem) {
            farCurrentCustomItem = nextItem;
            farReviewCurrentVerse = 1;
            const nextData = parseCustomOrderItem(nextItem);
            if (nextData) {
              farReviewCurrentSurah = nextData.surahNumber;
            }
          }
        } else {
          farReviewCurrentVerse = relativeEndPage - itemData.startPage + 2;
        }
        
        // إرجاع النطاق بالصفحات الفعلية
        return {
          ...range,
          startVerse: relativeStartPage,
          endVerse: relativeEndPage
        };
      }
    }
    
    // للترتيب العادي (forward/backward)
    const surah = getSurahByNumber(farReviewCurrentSurah);
    if (!surah) return undefined;
    
    const startVerse = farReviewCurrentVerse;
    const maxVerse = memorizationUnit === 'verses' ? surah.totalVerses : surah.totalPages;
    let endVerse = Math.min(startVerse + amount - 1, maxVerse);
    
    const range: VerseRange = {
      surahNumber: farReviewCurrentSurah,
      surahName: surah.arabicName,
      startVerse,
      endVerse
    };
    
    // تحديث الموقع الحالي للمراجعة البعيدة
    if (endVerse >= maxVerse) {
      farReviewCurrentSurah = getNextSurah(farReviewCurrentSurah, farReviewOrder);
      farReviewCurrentVerse = 1;
    } else {
      farReviewCurrentVerse = endVerse + 1;
    }
    
    return range;
  };
  
  // حساب معدل الحفظ
  const isWeekly = memorizationFrequency === 'weekly';
  const weeklyAmount = settings.dailyNewMemorization;
  const customMemDays = settings.memorizationDays;

  const getMemorizationDays = (dayOfWeek: number): boolean => {
    if (customMemDays && customMemDays.length > 0) return customMemDays.includes(dayOfWeek);
    if (!isWeekly) return true;
    return dayOfWeek === 0 || dayOfWeek === 6;
  };
  
  let weeklyAccumulated = 0;

  // تاريخ الأيام المحفوظة للمراجعة الديناميكية
  type DayEntry = { pages: number[]; units: number[]; verseRange?: VerseRange };
  const dayHistory: DayEntry[] = [];
  const hasMemoizedSurahs = memorizedSurahs.length > 0;

  const buildRangeFromHistory = (entry: DayEntry | undefined): VerseRange | undefined => {
    if (!entry) return undefined;
    if (memorizationUnit === 'verses') return entry.verseRange;
    if (memorizationUnit === 'pages' && entry.pages.length > 0) {
      const surah = getSurahByPage(entry.pages[0]);
      if (!surah) return undefined;
      return { surahNumber: surah.number, surahName: surah.arabicName, startVerse: entry.pages[0], endVerse: entry.pages[entry.pages.length - 1] };
    }
    if ((memorizationUnit === 'rub' || memorizationUnit === 'hizb') && entry.units.length > 0) {
      const pages = getUnitPages(entry.units[0]);
      if (pages.length === 0) return undefined;
      const surah = getSurahByPage(pages[0]);
      if (!surah) return undefined;
      return { surahNumber: surah.number, surahName: surah.arabicName, startVerse: pages[0], endVerse: pages[pages.length - 1] };
    }
    return undefined;
  };

  const getPageFractionLabel = (page: number, amount: number, surahName: string): string => {
    const s = surahName ? ` (${surahName})` : '';
    if (amount === 0.5) return `نصف الصفحة ${page}${s}`;
    if (amount === 0.25) return `ربع الصفحة ${page}${s}`;
    if (amount === 0.75) return `ثلاثة أرباع الصفحة ${page}${s}`;
    return `جزء من الصفحة ${page}${s}`;
  };

  for (let day = 0; day < numberOfDays; day++) {
    const taskDate = new Date(startDate);
    taskDate.setDate(taskDate.getDate() + day);
    const dayOfWeek = taskDate.getDay();
    const isMemorizationDay = getMemorizationDays(dayOfWeek);
    
    // الحفظ الجديد
    const newMemPages: number[] = [];
    let newMemUnits: number[] = [];
    let newMemVerseRange: VerseRange | undefined = undefined;
    const unitAtStartOfDay = currentUnit;

    let dailyAmount: number;

    if (!isMemorizationDay) {
      dailyAmount = 0;
    } else if (isWeekly) {
      dailyAmount = Math.ceil(weeklyAmount / 2);
    } else {
      dailyAmount = settings.dailyNewMemorization;
    }
    
    const isDecimal = dailyAmount % 1 !== 0;
    
    if (dailyAmount > 0) {
      if (memorizationUnit === 'verses') {
        newMemVerseRange = calculateVerseRange(dailyAmount);
      } else if (memorizationUnit === 'pages' && isDecimal) {
        weeklyAccumulated += dailyAmount;
        const pagesToAdd = Math.floor(weeklyAccumulated);
        weeklyAccumulated -= pagesToAdd;
        
        for (let i = 0; i < pagesToAdd; i++) {
          if (currentUnit <= getMaxUnit()) {
            const pages = getUnitPages(currentUnit);
            newMemPages.push(...pages);
            newMemUnits.push(currentUnit);
            currentUnit++;
          }
        }
      } else {
        for (let i = 0; i < Math.ceil(dailyAmount); i++) {
          if (currentUnit <= getMaxUnit()) {
            const pages = getUnitPages(currentUnit);
            newMemPages.push(...pages);
            newMemUnits.push(currentUnit);
            currentUnit++;
          }
        }
      }
    }
    
    // تسجيل الحفظ في تاريخ الأيام (قبل حساب المراجعات)
    dayHistory.push({ pages: [...newMemPages], units: [...newMemUnits], verseRange: newMemVerseRange });

    // المراجعة القريبة: اليوم الأول لا توجد، ومن اليوم الثاني نراجع ما حُفظ أمس
    // تحجيم ذكي: إذا كان الحفظ اليومي ضئيلاً، يكون قدر المراجعة مساوياً له
    const smartNearReview = settings.dailyNearReview === 0 ? 0
      : settings.dailyNewMemorization < 1 ? settings.dailyNewMemorization
      : settings.dailyNearReview;
    // أيام الراحة (مراجعة فقط): يتضاعف قدر المراجعة لاستغلال الوقت
    const isRestDay = !isMemorizationDay;
    const nearReviewAmount = isRestDay ? smartNearReview * 2 : smartNearReview;
    const nearReviewRange = day === 0 ? undefined : buildRangeFromHistory(dayHistory[day - 1]);

    // المراجعة البعيدة
    const farReviewAmount = isRestDay
      ? settings.dailyFarReview * 2
      : settings.dailyFarReview;
    // بدون سور محفوظة مسبقاً: لا مراجعة بعيدة في الأسبوع الأول، ومن اليوم الثامن نراجع محفوظ قبل 7 أيام
    const farReviewRange = hasMemoizedSurahs
      ? calculateFarReviewRange(farReviewAmount)
      : (day >= 7 && farReviewAmount > 0 ? buildRangeFromHistory(dayHistory[day - 7]) : undefined);
    
    // التحضير للغد
    const prepPages: number[] = [];
    const prepAmount = (isWeekly && !customMemDays) ? Math.ceil(weeklyAmount / 2) : settings.dailyNewMemorization;
    for (let i = 0; i < prepAmount; i++) {
      const prepUnit = currentUnit + i;
      if (prepUnit <= getMaxUnit()) {
        const pages = getUnitPages(prepUnit);
        prepPages.push(...pages);
      }
    }

    // التحضير الأسبوعي - حساب النطاق للأسبوع القادم
    const weeklyPrepAmount = Math.ceil(settings.dailyNewMemorization * 7);
    const weeklyPrepStartUnit = currentUnit;
    const weeklyPrepEndUnit = Math.min(currentUnit + weeklyPrepAmount - 1, getMaxUnit());
    const weeklyPrepStartPage = memorizationUnit === 'pages' ? weeklyPrepStartUnit : (getUnitPages(weeklyPrepStartUnit)[0] || 1);
    const weeklyPrepEndPage = memorizationUnit === 'pages' ? weeklyPrepEndUnit : (getUnitPages(weeklyPrepEndUnit).pop() || 1);
    const weeklyPrepStartSurah = getSurahByPage(weeklyPrepStartPage);
    const weeklyPrepEndSurah = getSurahByPage(weeklyPrepEndPage);
    
    const newMemSurah = newMemPages.length > 0 ? getSurahByPage(newMemPages[0]) : getSurahByPage(unitAtStartOfDay);
    const currentSurah = getSurahByNumber(currentSurahNumber);
    
    const formatUnitsRange = (units: number[]): string => {
      if (units.length === 0) return '';
      if (units.length === 1) return getUnitLabel(units[0]);
      return `${getUnitLabel(units[0])} إلى ${getUnitLabel(units[units.length - 1])}`;
    };

    const isReviewOnlyDay = !isMemorizationDay;

    // تنسيق وصف الآيات
    const formatVerseRangeLabel = (range?: VerseRange): string => {
      if (!range) return '';
      if (memorizationUnit === 'verses') {
        return `سورة ${range.surahName} آية ${range.startVerse}-${range.endVerse}`;
      }
      return `سورة ${range.surahName} صفحة ${range.startVerse}-${range.endVerse}`;
    };

    const getUnitLabelPlural = () => {
      switch (memorizationUnit) {
        case 'rub': return 'أرباع';
        case 'hizb': return 'أحزاب';
        case 'verses': return 'آيات';
        default: return 'صفحات';
      }
    };

    tasks.push({
      date: taskDate.toISOString().split('T')[0],
      dayNumber: day + 1,
      newMemorization: {
        surahName: memorizationUnit === 'verses' 
          ? (newMemVerseRange?.surahName || currentSurah?.arabicName || '')
          : (newMemSurah?.arabicName || currentSurah?.arabicName || ''),
        pages: newMemPages,
        unitLabel: isReviewOnlyDay
          ? 'يوم مراجعة'
          : memorizationUnit === 'verses'
          ? formatVerseRangeLabel(newMemVerseRange)
          : memorizationUnit === 'pages' && newMemPages.length > 0
          ? (isDecimal
              ? getPageFractionLabel(newMemPages[0], dailyAmount, newMemSurah?.arabicName || '')
              : `ص${newMemPages[0]}${newMemPages.length > 1 ? `-${newMemPages[newMemPages.length - 1]}` : ''} (${newMemSurah?.arabicName || ''})`)
          : memorizationUnit === 'pages' && isDecimal && dailyAmount > 0
          ? getPageFractionLabel(unitAtStartOfDay, dailyAmount, newMemSurah?.arabicName || '')
          : formatUnitsRange(newMemUnits),
        description: isReviewOnlyDay
          ? 'يوم مخصص للمراجعة فقط'
          : memorizationUnit === 'verses'
          ? newMemVerseRange
            ? `حفظ ${newMemVerseRange.endVerse - newMemVerseRange.startVerse + 1} آيات من سورة ${newMemVerseRange.surahName}`
            : 'لا يوجد حفظ'
          : memorizationUnit === 'pages'
            ? newMemPages.length > 0
              ? `حفظ ${isDecimal ? (dailyAmount === 0.5 ? 'نصف صفحة' : dailyAmount === 0.25 ? 'ربع صفحة' : 'جزء من صفحة') + ' ' : 'صفحة '}${newMemPages[0]} - سورة ${newMemSurah?.arabicName || ''}`
              : isDecimal
              ? `حفظ ${dailyAmount === 0.5 ? 'نصف' : dailyAmount === 0.25 ? 'ربع' : 'جزء من'} صفحة ${unitAtStartOfDay} - سورة ${newMemSurah?.arabicName || ''}`
              : 'لا يوجد حفظ'
            : `حفظ ${newMemUnits.length} ${memorizationUnit === 'rub' ? 'ربع' : 'حزب'}`,
        verseRange: newMemVerseRange,
      },
      nearReview: {
        surahName: nearReviewRange?.surahName || '',
        pages: [],
        unitLabel: nearReviewRange
          ? (memorizationUnit === 'pages' && nearReviewAmount > 0 && nearReviewAmount < 1
              ? getPageFractionLabel(nearReviewRange.startVerse, nearReviewAmount, nearReviewRange.surahName)
              : memorizationUnit === 'pages'
              ? `ص${nearReviewRange.startVerse}${nearReviewRange.endVerse !== nearReviewRange.startVerse ? `-${nearReviewRange.endVerse}` : ''} (${nearReviewRange.surahName})`
              : formatVerseRangeLabel(nearReviewRange))
          : '',
        description: nearReviewRange
          ? memorizationUnit === 'pages'
            ? `مراجعة قريبة: ${smartNearReview < 1 ? (smartNearReview === 0.5 ? `نصف الصفحة ${nearReviewRange.startVerse}` : `ربع الصفحة ${nearReviewRange.startVerse}`) : `صفحة ${nearReviewRange.startVerse}${nearReviewRange.endVerse !== nearReviewRange.startVerse ? `-${nearReviewRange.endVerse}` : ''}`} - سورة ${nearReviewRange.surahName}`
            : memorizationUnit === 'verses'
            ? `مراجعة قريبة: سورة ${nearReviewRange.surahName} آية ${nearReviewRange.startVerse}-${nearReviewRange.endVerse}`
            : `مراجعة قريبة: ${nearReviewAmount} ${getUnitLabelPlural()} - سورة ${nearReviewRange.surahName}`
          : 'لا توجد مراجعة قريبة',
        verseRange: nearReviewRange,
      },
      farReview: {
        pages: [],
        juzNumber: 1,
        unitLabel: farReviewRange
          ? (memorizationUnit === 'pages' && farReviewAmount > 0 && farReviewAmount < 1
              ? getPageFractionLabel(farReviewRange.startVerse, farReviewAmount, farReviewRange.surahName)
              : memorizationUnit === 'pages'
              ? `ص${farReviewRange.startVerse}${farReviewRange.endVerse !== farReviewRange.startVerse ? `-${farReviewRange.endVerse}` : ''} (${farReviewRange.surahName})`
              : formatVerseRangeLabel(farReviewRange))
          : '',
        description: farReviewRange
          ? memorizationUnit === 'pages'
            ? `مراجعة بعيدة: ${farReviewAmount < 1 ? (farReviewAmount === 0.5 ? `نصف الصفحة ${farReviewRange.startVerse}` : `ربع الصفحة ${farReviewRange.startVerse}`) : `صفحة ${farReviewRange.startVerse}${farReviewRange.endVerse !== farReviewRange.startVerse ? `-${farReviewRange.endVerse}` : ''}`} - سورة ${farReviewRange.surahName}`
            : memorizationUnit === 'verses'
            ? `مراجعة بعيدة: سورة ${farReviewRange.surahName} آية ${farReviewRange.startVerse}-${farReviewRange.endVerse}`
            : `مراجعة بعيدة: ${farReviewAmount} ${getUnitLabelPlural()} - سورة ${farReviewRange.surahName}`
          : 'لا توجد مراجعة بعيدة',
        verseRange: farReviewRange,
      },
      tomorrowPreparation: {
        pages: prepPages,
        description: memorizationUnit === 'verses'
          ? `استعداد للغد: ${dailyAmount} آيات`
          : prepPages.length > 0 
            ? `استعداد للغد: ${memorizationUnit === 'pages' ? `صفحات ${prepPages.join('، ')}` : `${prepAmount} ${memorizationUnit === 'rub' ? 'ربع' : 'حزب'}`}` 
            : 'لا يوجد تحضير',
      },
      weeklyPreparation: {
        pages: [],
        description: memorizationUnit === 'verses'
          ? `استمع للآيات القادمة (${weeklyPrepAmount} آية)`
          : weeklyPrepStartSurah && weeklyPrepEndSurah
          ? `ص${weeklyPrepStartPage}-${weeklyPrepEndPage} (${weeklyPrepStartSurah.arabicName}${weeklyPrepStartSurah.number !== weeklyPrepEndSurah.number ? ` - ${weeklyPrepEndSurah.arabicName}` : ''})`
          : `استمع أو اقرأ ${weeklyPrepAmount} ${getUnitLabelPlural()}`,
        totalUnits: weeklyPrepAmount,
      },
      completed: {
        newMemorization: false,
        nearReview: false,
        farReview: false,
        preparation: false,
        weeklyPreparation: false,
      },
    });
  }
  
  return tasks;
};

export const formatArabicDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('ar-SA', options);
};
