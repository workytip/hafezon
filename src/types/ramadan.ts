export type RecitationUnit = 'pages' | 'juz' | 'hizb';

export interface RamadanGoal {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  order: number;
  // للتلاوة: كم ورد يومي
  dailyAmount?: number;
  amountLabel?: string;
  recitationUnit?: RecitationUnit;
}

export interface RamadanDayProgress {
  [goalId: string]: boolean;
}

export interface RamadanSettings {
  goals: RamadanGoal[];
  startDate: string; // التاريخ الميلادي لبداية التتبع
  startDay: number;  // يوم رمضان الذي يبدأ منه (1-30)
}

export interface RamadanProgress {
  settings: RamadanSettings;
  dailyProgress: Record<string, RamadanDayProgress>; // key = "day-1", "day-2", etc.
  lastUpdated: string;
}

export const DEFAULT_GOALS: Omit<RamadanGoal, 'order' | 'enabled'>[] = [
  { id: 'fivePrayers', label: 'الصلوات الخمس', icon: '🕌' },
  { id: 'nawafil', label: 'النوافل (السنن الرواتب)', icon: '🤲' },
  { id: 'taraweeh', label: 'صلاة التراويح', icon: '🌙' },
  { id: 'duha', label: 'صلاة الضحى', icon: '☀️' },
  { id: 'adhkar', label: 'أذكار الصباح والمساء', icon: '📿' },
  { id: 'quranRecitation', label: 'تلاوة ورد قرآني', icon: '📖', dailyAmount: 5, amountLabel: 'صفحات', recitationUnit: 'pages' },
  { id: 'goodDeeds', label: 'أعمال صالحة', icon: '💝' },
  { id: 'tadabbur', label: 'تدبر القرآن (جلسة)', icon: '🔍' },
  { id: 'lesson', label: 'درس ديني', icon: '📚' },
  { id: 'sadaqah', label: 'صدقة', icon: '🎁' },
  { id: 'dua', label: 'دعاء وتضرع', icon: '🙏' },
  { id: 'iftar', label: 'تفطير صائم', icon: '🍽️' },
];

export const GOOD_DEEDS_SUGGESTIONS = [
  'الصدقة',
  'بر الوالدين',
  'صلة الأرحام',
  'إطعام الطعام',
  'كفالة يتيم',
  'عيادة مريض',
  'إصلاح ذات البين',
  'إماطة الأذى عن الطريق',
  'الابتسامة في وجه أخيك',
  'نشر العلم النافع',
];

export const RECITATION_UNIT_OPTIONS = [
  { value: 'pages' as RecitationUnit, label: 'صفحات' },
  { value: 'juz' as RecitationUnit, label: 'أجزاء' },
  { value: 'hizb' as RecitationUnit, label: 'أحزاب' },
];
