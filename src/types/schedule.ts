export type MemorizationUnit = 'pages' | 'rub' | 'hizb' | 'verses';
export type MemorizationFrequency = 'daily' | 'weekly';
export type NearReviewType = 'surah' | 'juz';
export type ReviewOrder = 'forward' | 'backward' | 'custom';

export interface UserSettings {
  // وحدة القياس (صفحات أو أرباع أو أحزاب أو آيات)
  memorizationUnit: MemorizationUnit;
  // وتيرة الحفظ (يومياً أو أسبوعياً)
  memorizationFrequency: MemorizationFrequency;
  // مقدار الحفظ الحالي (بالصفحات)
  currentMemorizedPages: number;
  // السورة الحالية للحفظ
  currentSurahNumber: number;
  // الصفحة الحالية في السورة (للصفحات)
  currentPageInSurah: number;
  // الربع الحالي (للأرباع)
  currentRubNumber: number;
  // الحزب الحالي (للأحزاب)
  currentHizbNumber: number;
  // الآية الحالية (للآيات)
  currentVerseNumber: number;
  // مقدار الحفظ الجديد (بالوحدة المختارة حسب الوتيرة)
  dailyNewMemorization: number;
  
  // *** السور المحفوظة سابقاً (للمراجعة المخصصة) ***
  memorizedSurahs: number[];
  
  // *** المراجعة القريبة ***
  // السورة للمراجعة القريبة
  nearReviewSurahNumber: number;
  // الآية/الصفحة البداية للمراجعة القريبة
  nearReviewStartVerse: number;
  // مقدار المراجعة القريبة (بالوحدة المختارة)
  dailyNearReview: number;
  // ترتيب المراجعة القريبة
  nearReviewOrder: ReviewOrder;
  // الترتيب المخصص للمراجعة القريبة (strings مثل "2" أو "surah-2-juz-3" أو "juz-30")
  nearReviewCustomOrder?: string[];
  
  // *** المراجعة البعيدة ***
  // السورة للمراجعة البعيدة
  farReviewSurahNumber: number;
  // الآية/الصفحة البداية للمراجعة البعيدة
  farReviewStartVerse: number;
  // ترتيب المراجعة البعيدة
  farReviewOrder: ReviewOrder;
  // الترتيب المخصص للمراجعة البعيدة (strings مثل "2" أو "surah-2-juz-3" أو "juz-30")
  farReviewCustomOrder?: string[];
  // مقدار المراجعة البعيدة (بالوحدة المختارة)
  dailyFarReview: number;
  
  // *** تفعيل/تعطيل المراحل ***
  enableNearReview?: boolean;
  enableFarReview?: boolean;
  enableTomorrowPreparation?: boolean;
  enableWeeklyPreparation?: boolean;
  
  // أيام الحفظ الجديد (0=أحد ... 6=سبت) — إذا غير محددة يُعدّ كل يوم يوم حفظ
  memorizationDays?: number[];
  // تاريخ البدء
  startDate: string;
  // نوع الإعداد المستخدم
  setupMode?: 'quick' | 'full';
}

// نطاق الآيات
export interface VerseRange {
  surahNumber: number;
  surahName: string;
  startVerse: number;
  endVerse: number;
}

export interface DailyTask {
  date: string;
  dayNumber: number;
  // الحفظ الجديد
  newMemorization: {
    surahName: string;
    pages: number[];
    unitLabel: string;
    description: string;
    verseRange?: VerseRange; // نطاق الآيات
  };
  // المراجعة القريبة (من بداية السورة الحالية أو السابقة)
  nearReview: {
    surahName: string;
    pages: number[];
    unitLabel: string;
    description: string;
    verseRange?: VerseRange;
  };
  // المراجعة البعيدة (القديم)
  farReview: {
    pages: number[];
    juzNumber: number;
    unitLabel: string;
    description: string;
    verseRange?: VerseRange;
  };
  // التحضير للغد
  tomorrowPreparation: {
    pages: number[];
    description: string;
    verseRange?: VerseRange;
  };
  // التحضير الأسبوعي (الاستماع أو القراءة لكل الجديد في الأسبوع القادم)
  weeklyPreparation: {
    pages: number[];
    description: string;
    totalUnits: number;
  };
  // هل تم إكمال المهام
  completed: {
    newMemorization: boolean;
    nearReview: boolean;
    farReview: boolean;
    preparation: boolean;
    weeklyPreparation: boolean;
  };
}

export interface ScheduleState {
  settings: UserSettings | null;
  currentDay: number;
  tasks: DailyTask[];
}
