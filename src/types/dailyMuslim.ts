export interface DailyMuslimGoal {
  id: string;
  label: string;
  icon: string;
  sectionId: string;
  order: number;
}

export interface PrayerSection {
  id: string;
  name: string;
  icon: string;
}

export const PRAYER_SECTIONS: PrayerSection[] = [
  { id: 'fajr', name: 'بعد صلاة الفجر', icon: '🌅' },
  { id: 'duha', name: 'صلاة الضحى', icon: '🌤️' },
  { id: 'dhuhr', name: 'بعد صلاة الظهر', icon: '☀️' },
  { id: 'asr', name: 'بعد صلاة العصر', icon: '🌇' },
  { id: 'maghrib', name: 'بعد صلاة المغرب', icon: '🌆' },
  { id: 'isha', name: 'بعد صلاة العشاء', icon: '🌙' },
  { id: 'general', name: 'طوال اليوم', icon: '📿' },
];

export interface DailyMuslimSettings {
  goals: DailyMuslimGoal[];
}

export interface DailyMuslimDayProgress {
  [goalId: string]: boolean;
}

export interface DailyMuslimProgress {
  settings: DailyMuslimSettings;
  dailyProgress: Record<string, DailyMuslimDayProgress>; // key = YYYY-MM-DD
  lastUpdated: string;
}

// أهداف افتراضية مقترحة - يمكن للمستخدم حذفها أو إضافة أخرى
export const DEFAULT_DAILY_GOALS: Omit<DailyMuslimGoal, 'order'>[] = [
  // الفجر
  { id: 'def-fajr-prayer', label: 'صلاة الفجر في وقتها', icon: '🕌', sectionId: 'fajr' },
  { id: 'def-morning-adhkar', label: 'أذكار الصباح', icon: '📿', sectionId: 'fajr' },
  { id: 'def-quran-wird', label: 'ورد القرآن', icon: '📖', sectionId: 'fajr' },
  { id: 'def-fajr-sunnah', label: 'سنة الفجر', icon: '🤲', sectionId: 'fajr' },
  // الضحى
  { id: 'def-duha-prayer', label: 'صلاة الضحى', icon: '🌤️', sectionId: 'duha' },
  { id: 'def-duha-dhikr', label: 'أذكار الضحى', icon: '📿', sectionId: 'duha' },
  // الظهر
  { id: 'def-dhuhr-prayer', label: 'صلاة الظهر في وقتها', icon: '🕌', sectionId: 'dhuhr' },
  { id: 'def-dhuhr-sunnah', label: 'السنن الرواتب', icon: '🤲', sectionId: 'dhuhr' },
  // العصر
  { id: 'def-asr-prayer', label: 'صلاة العصر في وقتها', icon: '🕌', sectionId: 'asr' },
  { id: 'def-evening-adhkar', label: 'أذكار المساء', icon: '📿', sectionId: 'asr' },
  // المغرب
  { id: 'def-maghrib-prayer', label: 'صلاة المغرب في وقتها', icon: '🕌', sectionId: 'maghrib' },
  { id: 'def-maghrib-sunnah', label: 'سنة المغرب', icon: '🤲', sectionId: 'maghrib' },
  { id: 'def-evening-quran', label: 'قراءة من القرآن', icon: '📖', sectionId: 'maghrib' },
  // العشاء
  { id: 'def-isha-prayer', label: 'صلاة العشاء في وقتها', icon: '🕌', sectionId: 'isha' },
  { id: 'def-witr', label: 'صلاة الوتر', icon: '🌙', sectionId: 'isha' },
  { id: 'def-day-review', label: 'محاسبة النفس', icon: '🔍', sectionId: 'isha' },
  // عام
  { id: 'def-water', label: 'شرب الماء بكفاية', icon: '💧', sectionId: 'general' },
  { id: 'def-good-deed', label: 'عمل صالح', icon: '💝', sectionId: 'general' },
  { id: 'def-family', label: 'صلة الرحم', icon: '❤️', sectionId: 'general' },
];

export const DAILY_EMOJI_OPTIONS = [
  '🕌', '🤲', '🌙', '☀️', '📿', '📖', '💝', '🔍', '📚', '🎁',
  '🙏', '💧', '🌅', '🌇', '🌆', '⭐', '✨', '❤️', '💪', '🎯',
  '🏃', '🧘', '📝', '🌿', '🕋',
];
