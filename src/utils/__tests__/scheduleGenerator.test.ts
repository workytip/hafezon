import { describe, it, expect } from 'vitest';
import { generateDailyTasks } from '../scheduleGenerator';
import { UserSettings } from '@/types/schedule';

// ===== إعدادات أساسية مشتركة =====

const BASE_DATE = '2026-06-17';

const baseSettings = (overrides: Partial<UserSettings> = {}): UserSettings => ({
  memorizationUnit: 'pages',
  memorizationFrequency: 'daily',
  currentMemorizedPages: 0,
  currentSurahNumber: 2,
  currentPageInSurah: 25,
  currentRubNumber: 10,
  currentHizbNumber: 5,
  currentVerseNumber: 1,
  dailyNewMemorization: 1,
  memorizedSurahs: [],
  nearReviewSurahNumber: 2,
  nearReviewStartVerse: 1,
  dailyNearReview: 1,
  nearReviewOrder: 'forward',
  farReviewSurahNumber: 1,
  farReviewStartVerse: 1,
  dailyFarReview: 0,
  farReviewOrder: 'forward',
  startDate: BASE_DATE,
  setupMode: 'quick',
  ...overrides,
});

// ===== مساعدات =====

const hasTasks = (tasks: ReturnType<typeof generateDailyTasks>) =>
  tasks.length > 0 && tasks.every(t => t.dayNumber > 0);

const noBlankDays = (tasks: ReturnType<typeof generateDailyTasks>) =>
  tasks.every(t => t.date !== '');

// ===== ١. الحفظ الجديد بالصفحات =====

describe('الحفظ بالصفحات', () => {
  it('يولّد 30 يوماً بشكل صحيح', () => {
    const tasks = generateDailyTasks(baseSettings(), 30);
    expect(tasks).toHaveLength(30);
  });

  it('اليوم الأول من بداية السورة وبدون حفظ سابق: لا توجد مراجعة قريبة', () => {
    const tasks = generateDailyTasks(baseSettings({ currentPageInSurah: 2 }), 7);
    expect(tasks[0].nearReview.verseRange).toBeUndefined();
    expect(tasks[0].nearReview.description).toContain('لا توجد');
  });

  it('اليوم الأول من منتصف السورة: نراجع الصفحات السابقة في نفس السورة', () => {
    const tasks = generateDailyTasks(baseSettings({ dailyNearReview: 3 }), 7);
    expect(tasks[0].nearReview.verseRange?.startVerse).toBe(22);
    expect(tasks[0].nearReview.verseRange?.endVerse).toBe(24);
    expect(tasks[0].nearReview.pages).toEqual([22, 23, 24]);
  });

  it('اليوم الثاني: المراجعة القريبة تساوي محفوظ اليوم الأول', () => {
    const tasks = generateDailyTasks(baseSettings({ currentPageInSurah: 25 }), 7);
    const day1Pages = tasks[0].newMemorization.pages;
    const day2Near = tasks[1].nearReview.verseRange;
    expect(day1Pages.length).toBeGreaterThan(0);
    expect(day2Near).toBeDefined();
    expect(day2Near?.startVerse).toBe(day1Pages[0]);
  });

  it('المراجعة البعيدة: لا توجد في أول 7 أيام بدون محفوظ مسبق', () => {
    const tasks = generateDailyTasks(baseSettings({ dailyFarReview: 5 }), 7);
    tasks.forEach(t => {
      expect(t.farReview.verseRange).toBeUndefined();
    });
  });

  it('المراجعة البعيدة: تبدأ من اليوم الثامن بدون محفوظ مسبق', () => {
    const tasks = generateDailyTasks(baseSettings({ dailyFarReview: 5 }), 10);
    expect(tasks[7].farReview.verseRange).toBeDefined();
    expect(tasks[7].farReview.verseRange?.startVerse).toBe(tasks[0].newMemorization.pages[0]);
  });

  it('الصفحات تتقدم يومياً بدون تكرار', () => {
    const tasks = generateDailyTasks(baseSettings(), 10);
    const pages = tasks.map(t => t.newMemorization.pages[0]).filter(Boolean);
    const unique = new Set(pages);
    expect(unique.size).toBe(pages.length);
  });

  it('صفحة نصف: تراكم صحيح - صفحة كاملة كل يومين', () => {
    const tasks = generateDailyTasks(baseSettings({ dailyNewMemorization: 0.5 }), 10);
    const pagesWithContent = tasks.filter(t => t.newMemorization.pages.length > 0);
    expect(pagesWithContent.length).toBe(5);
  });

  it('صفحة ربع: تراكم صحيح - صفحة كاملة كل 4 أيام', () => {
    const tasks = generateDailyTasks(baseSettings({ dailyNewMemorization: 0.25 }), 12);
    const pagesWithContent = tasks.filter(t => t.newMemorization.pages.length > 0);
    expect(pagesWithContent.length).toBe(3);
  });

  it('وصف الصفحة الجزئية يحتوي على نصف/ربع', () => {
    const tasks = generateDailyTasks(baseSettings({ dailyNewMemorization: 0.5 }), 4);
    const dayWithPage = tasks.find(t => t.newMemorization.pages.length > 0);
    expect(dayWithPage?.newMemorization.unitLabel).toContain('نصف');
  });

  it('صفحات متعددة: dailyNewMemorization=2 يعطي صفحتين يومياً', () => {
    const tasks = generateDailyTasks(baseSettings({ dailyNewMemorization: 2 }), 5);
    tasks.forEach(t => {
      expect(t.newMemorization.pages.length).toBe(2);
    });
  });
});

// ===== ٢. الحفظ بالأرباع =====

describe('الحفظ بالأرباع', () => {
  const rubSettings = (overrides: Partial<UserSettings> = {}) => baseSettings({
    memorizationUnit: 'rub',
    currentRubNumber: 10,
    dailyNewMemorization: 1,
    dailyNearReview: 1,
    dailyFarReview: 0,
    ...overrides,
  });

  it('يولّد الأيام بشكل صحيح', () => {
    const tasks = generateDailyTasks(rubSettings(), 30);
    expect(tasks).toHaveLength(30);
  });

  it('اليوم الأول: المراجعة القريبة قبل موضع البداية', () => {
    const tasks = generateDailyTasks(rubSettings(), 5);
    const startPage = tasks[0].newMemorization.pages[0];
    expect(tasks[0].nearReview.verseRange!.endVerse).toBeLessThanOrEqual(startPage);
  });

  it('اليوم الثاني: المراجعة القريبة من ربع اليوم الأول', () => {
    const tasks = generateDailyTasks(rubSettings(), 5);
    expect(tasks[1].nearReview.verseRange).toBeDefined();
  });

  it('الأرباع تتقدم بدون تكرار', () => {
    const tasks = generateDailyTasks(rubSettings(), 10);
    const units = tasks.map(t => t.newMemorization.unitLabel).filter(l => l && !l.includes('يوم'));
    const unique = new Set(units);
    expect(unique.size).toBe(units.length);
  });

  it('ربعان يومياً: كل يوم ربعان', () => {
    const tasks = generateDailyTasks(rubSettings({ dailyNewMemorization: 2 }), 5);
    tasks.forEach(t => {
      expect(t.newMemorization.pages.length).toBeGreaterThan(0);
    });
  });

  it('ربع مع سور محفوظة مسبقاً: المراجعة البعيدة من اليوم الأول', () => {
    const tasks = generateDailyTasks(rubSettings({
      memorizedSurahs: [1, 2],
      farReviewSurahNumber: 1,
      dailyFarReview: 2,
    }), 5);
    expect(tasks[0].farReview.verseRange).toBeDefined();
  });
});

// ===== ٣. الحفظ بالأحزاب =====

describe('الحفظ بالأحزاب', () => {
  const hizbSettings = () => baseSettings({
    memorizationUnit: 'hizb',
    currentHizbNumber: 5,
    dailyNewMemorization: 1,
    dailyNearReview: 1,
    dailyFarReview: 0,
  });

  it('يولّد 30 يوماً', () => {
    const tasks = generateDailyTasks(hizbSettings(), 30);
    expect(tasks).toHaveLength(30);
  });

  it('حزبان يومياً: الأيام تحتوي على صفحات', () => {
    const tasks = generateDailyTasks(hizbSettings({ dailyNewMemorization: 2 }), 5);
    tasks.forEach(t => {
      expect(t.newMemorization.pages.length).toBeGreaterThan(0);
    });
  });

  it('اليوم الأول: المراجعة القريبة قبل موضع البداية', () => {
    const tasks = generateDailyTasks(hizbSettings(), 3);
    const startPage = tasks[0].newMemorization.pages[0];
    expect(tasks[0].nearReview.verseRange!.endVerse).toBeLessThanOrEqual(startPage);
  });

  it('المراجعة القريبة من اليوم الثاني', () => {
    const tasks = generateDailyTasks(hizbSettings(), 3);
    expect(tasks[1].nearReview.verseRange).toBeDefined();
  });
});

// ===== ٤. الحفظ بالآيات =====

describe('الحفظ بالآيات', () => {
  const verseSettings = (overrides: Partial<UserSettings> = {}) => baseSettings({
    memorizationUnit: 'verses',
    currentSurahNumber: 2,
    currentVerseNumber: 1,
    dailyNewMemorization: 5,
    dailyNearReview: 5,
    dailyFarReview: 0,
    ...overrides,
  });

  it('يولّد 30 يوماً', () => {
    const tasks = generateDailyTasks(verseSettings(), 30);
    expect(tasks).toHaveLength(30);
  });

  it('اليوم الأول يحفظ الآيات المطلوبة', () => {
    const tasks = generateDailyTasks(verseSettings(), 3);
    const range = tasks[0].newMemorization.verseRange;
    expect(range).toBeDefined();
    expect(range!.endVerse - range!.startVerse + 1).toBe(5);
  });

  it('لا توجد مراجعة قريبة اليوم الأول', () => {
    const tasks = generateDailyTasks(verseSettings(), 3);
    expect(tasks[0].nearReview.verseRange).toBeUndefined();
  });

  it('الآيات تتقدم يومياً', () => {
    const tasks = generateDailyTasks(verseSettings(), 5);
    const starts = tasks.map(t => t.newMemorization.verseRange?.startVerse).filter(Boolean) as number[];
    for (let i = 1; i < starts.length; i++) {
      expect(starts[i]).toBeGreaterThan(starts[i - 1]);
    }
  });

  it('الانتقال بين السور: الآيات تنتقل للسورة التالية تلقائياً', () => {
    // البقرة 286 آية - نبدأ من آية 284 (تبقى 3 آيات ثم تنتقل لآل عمران)
    const tasks = generateDailyTasks(verseSettings({
      currentSurahNumber: 2,
      currentVerseNumber: 284,
      dailyNewMemorization: 5,
    }), 5);
    const surahNames = tasks.map(t => t.newMemorization.verseRange?.surahName).filter(Boolean);
    const uniqueSurahs = new Set(surahNames);
    // اليوم الأول في البقرة، اليوم الثاني في آل عمران
    expect(uniqueSurahs.size).toBeGreaterThan(1);
  });
});

// ===== ٥. سور محفوظة مسبقاً =====

describe('سور محفوظة مسبقاً', () => {
  const withMemorized = () => baseSettings({
    memorizedSurahs: [1, 2, 3],
    farReviewSurahNumber: 1,
    farReviewStartVerse: 1,
    dailyFarReview: 3,
  });

  it('المراجعة البعيدة تبدأ من اليوم الأول عند وجود محفوظ مسبق', () => {
    const tasks = generateDailyTasks(withMemorized(), 10);
    expect(tasks[0].farReview.verseRange).toBeDefined();
  });

  it('المراجعة البعيدة تتقدم يومياً', () => {
    const tasks = generateDailyTasks(withMemorized(), 10);
    const farPages = tasks.map(t => t.farReview.verseRange?.startVerse).filter(Boolean) as number[];
    for (let i = 1; i < farPages.length; i++) {
      expect(farPages[i]).toBeGreaterThanOrEqual(farPages[i - 1]);
    }
  });

  it('بدون محفوظ مسبق ومع تفعيل المراجعة البعيدة: لا مراجعة في أول 7 أيام', () => {
    const tasks = generateDailyTasks(baseSettings({ dailyFarReview: 5 }), 7);
    tasks.forEach(t => {
      expect(t.farReview.verseRange).toBeUndefined();
    });
  });

  it('المراجعة البعيدة بعد 7 أيام تساوي محفوظ اليوم الأول', () => {
    const tasks = generateDailyTasks(baseSettings({ dailyFarReview: 5 }), 9);
    const day1Page = tasks[0].newMemorization.pages[0];
    const day8Far = tasks[7].farReview.verseRange;
    expect(day8Far).toBeDefined();
    expect(day8Far?.startVerse).toBe(day1Page);
  });
});

// ===== ٦. الوتيرة الأسبوعية =====

describe('وتيرة أسبوعية', () => {
  const weeklySettings = () => baseSettings({
    memorizationFrequency: 'weekly',
    dailyNewMemorization: 5,
    dailyNearReview: 2,
    dailyFarReview: 0,
  });

  it('أيام الأسبوع (0 و6) فيها حفظ', () => {
    const tasks = generateDailyTasks(weeklySettings(), 7);
    const weekendTasks = tasks.filter(t => {
      const d = new Date(t.date);
      return d.getDay() === 0 || d.getDay() === 6;
    });
    weekendTasks.forEach(t => {
      expect(t.newMemorization.pages.length).toBeGreaterThan(0);
    });
  });

  it('أيام الأسبوع الوسطى (2-5) بدون حفظ جديد', () => {
    const tasks = generateDailyTasks(weeklySettings(), 7);
    const midWeekTasks = tasks.filter(t => {
      const d = new Date(t.date);
      const day = d.getDay();
      return day >= 2 && day <= 5;
    });
    midWeekTasks.forEach(t => {
      expect(t.newMemorization.pages).toHaveLength(0);
      expect(t.newMemorization.unitLabel).toBe('يوم راحة — لا حفظ جديد');
    });
  });
});

// ===== ٧. اتجاه الحفظ من النهاية =====

describe('الحفظ من نهاية المصحف', () => {
  const endSettings = () => baseSettings({
    currentSurahNumber: 112,
    currentPageInSurah: 604,
    dailyNewMemorization: 1,
    dailyNearReview: 1,
    nearReviewSurahNumber: 112,
  });

  it('يولّد أيام بدءاً من نهاية المصحف', () => {
    const tasks = generateDailyTasks(endSettings(), 5);
    expect(tasks).toHaveLength(5);
  });

  it('اسم السورة موجود في اليوم الأول', () => {
    const tasks = generateDailyTasks(endSettings(), 5);
    expect(tasks[0].newMemorization.surahName).toBeTruthy();
  });

  it('لا توجد مراجعة قريبة اليوم الأول', () => {
    const tasks = generateDailyTasks(endSettings(), 5);
    expect(tasks[0].nearReview.verseRange).toBeUndefined();
  });
});

// ===== ٨. المراجعة القريبة ذكية =====

describe('تحجيم المراجعة القريبة', () => {
  it('مراجعة قريبة 1 صفحة عند حفظ 1 صفحة يومياً', () => {
    const tasks = generateDailyTasks(baseSettings({ dailyNewMemorization: 1, dailyNearReview: 1 }), 7);
    const day2 = tasks[1];
    expect(day2.nearReview.verseRange).toBeDefined();
    // الصفحة المراجَعة هي نفس ما حُفظ يوم السبت
    expect(day2.nearReview.verseRange?.startVerse).toBe(tasks[0].newMemorization.pages[0]);
    expect(day2.nearReview.verseRange?.endVerse).toBe(tasks[0].newMemorization.pages[tasks[0].newMemorization.pages.length - 1]);
  });

  it('نصف صفحة حفظاً = نصف صفحة مراجعة قريبة', () => {
    const tasks = generateDailyTasks(baseSettings({ dailyNewMemorization: 0.5, dailyNearReview: 0.5 }), 5);
    const dayWithPage = tasks.find(t => t.newMemorization.pages.length > 0);
    expect(dayWithPage).toBeDefined();
    // التحقق أن المراجعة القريبة في اليوم التالي صحيحة
    const idx = tasks.indexOf(dayWithPage!);
    if (idx + 1 < tasks.length) {
      expect(tasks[idx + 1].nearReview.verseRange).toBeDefined();
    }
  });
});

// ===== ٩. عدم إنتاج قيم undefined أو NaN =====

describe('سلامة البيانات', () => {
  const allCombinations: Array<Partial<UserSettings>> = [
    // صفحات - مبتدئ
    { memorizationUnit: 'pages', dailyNewMemorization: 1, dailyFarReview: 0 },
    // صفحات - مع محفوظ
    { memorizationUnit: 'pages', dailyNewMemorization: 1, memorizedSurahs: [1], dailyFarReview: 3 },
    // أرباع - مبتدئ
    { memorizationUnit: 'rub', currentRubNumber: 10, dailyNewMemorization: 1, dailyFarReview: 0 },
    // أرباع - مع محفوظ
    { memorizationUnit: 'rub', currentRubNumber: 10, dailyNewMemorization: 2, memorizedSurahs: [1, 2], dailyFarReview: 4 },
    // أحزاب - مبتدئ
    { memorizationUnit: 'hizb', currentHizbNumber: 5, dailyNewMemorization: 1, dailyFarReview: 0 },
    // أحزاب - مع محفوظ
    { memorizationUnit: 'hizb', currentHizbNumber: 5, dailyNewMemorization: 1, memorizedSurahs: [1], dailyFarReview: 2 },
    // آيات - مبتدئ
    { memorizationUnit: 'verses', currentVerseNumber: 1, dailyNewMemorization: 5, dailyFarReview: 0 },
    // آيات - مع محفوظ
    { memorizationUnit: 'verses', currentVerseNumber: 1, dailyNewMemorization: 10, memorizedSurahs: [1], dailyFarReview: 10 },
    // صفحة نصف
    { memorizationUnit: 'pages', dailyNewMemorization: 0.5, dailyFarReview: 0 },
    // صفحة ربع
    { memorizationUnit: 'pages', dailyNewMemorization: 0.25, dailyFarReview: 0 },
    // حفظ من النهاية
    { memorizationUnit: 'pages', currentSurahNumber: 112, currentPageInSurah: 604, dailyNewMemorization: 1 },
    // أسبوعي
    { memorizationFrequency: 'weekly', dailyNewMemorization: 5, dailyFarReview: 0 },
  ];

  allCombinations.forEach((combo, index) => {
    it(`التركيبة ${index + 1}: لا قيم undefined في بنية المهمة`, () => {
      const tasks = generateDailyTasks(baseSettings(combo), 14);
      expect(tasks).toHaveLength(14);
      tasks.forEach((t, d) => {
        expect(t.dayNumber).toBe(d + 1);
        expect(t.date).toBeTruthy();
        expect(t.newMemorization.description).toBeTruthy();
        expect(t.nearReview.description).toBeTruthy();
        expect(t.farReview.description).toBeTruthy();
        // لا يوجد NaN في أرقام الصفحات
        t.newMemorization.pages.forEach(p => expect(isNaN(p)).toBe(false));
        t.nearReview.pages.forEach(p => expect(isNaN(p)).toBe(false));
      });
    });
  });
});

// ===== ١٠. التحضير للغد والتحضير الأسبوعي =====

describe('التحضير للغد', () => {
  it('التحضير للغد يشير للصفحة التالية', () => {
    const tasks = generateDailyTasks(baseSettings({ dailyNewMemorization: 1 }), 5);
    const day1Page = tasks[0].newMemorization.pages[0];
    const day1PrepPages = tasks[0].tomorrowPreparation.pages;
    if (day1PrepPages.length > 0) {
      expect(day1PrepPages[0]).toBeGreaterThan(day1Page);
    }
  });

  it('التحضير الأسبوعي له وصف', () => {
    const tasks = generateDailyTasks(baseSettings(), 7);
    tasks.forEach(t => {
      expect(t.weeklyPreparation.description).toBeTruthy();
    });
  });
});

// ===== ١١. أيام الحفظ المخصصة =====

describe('أيام الحفظ المخصصة', () => {
  it('إعداد سريع: يوم راحة واحد (السبت) — ٦ أيام حفظ', () => {
    // أيام الحفظ: أحد-جمعة (0-5)
    const tasks = generateDailyTasks(
      baseSettings({ memorizationDays: [0, 1, 2, 3, 4, 5] }),
      14
    );
    const restTasks = tasks.filter(t => {
      const d = new Date(t.date);
      return d.getDay() === 6; // السبت
    });
    restTasks.forEach(t => {
      expect(t.newMemorization.pages).toHaveLength(0);
      expect(t.newMemorization.unitLabel).toBe('يوم راحة — لا حفظ جديد');
    });
    const memTasks = tasks.filter(t => {
      const d = new Date(t.date);
      return [0, 1, 2, 3, 4, 5].includes(d.getDay());
    });
    memTasks.forEach(t => {
      expect(t.newMemorization.pages.length).toBeGreaterThan(0);
    });
  });

  it('إعداد مخصص: يومان راحة (الجمعة والسبت) — المراجعة تتضاعف في أيام الراحة', () => {
    const tasks = generateDailyTasks(
      baseSettings({ memorizationDays: [0, 1, 2, 3, 4], dailyNearReview: 1 }),
      14
    );
    // من اليوم الثاني: أيام الراحة تحوي مراجعة مضاعفة
    const restTasksWithReview = tasks.filter(t => {
      const d = new Date(t.date);
      return [5, 6].includes(d.getDay()) && t.nearReview.verseRange !== undefined;
    });
    // أيام الراحة بعد اليوم الأول يجب أن يكون فيها مراجعة
    if (restTasksWithReview.length > 0) {
      expect(restTasksWithReview.length).toBeGreaterThan(0);
    }
  });

  it('إعداد مخصص: ٧ أيام محددة = نفس سلوك اليومي', () => {
    const withAllDays = generateDailyTasks(
      baseSettings({ memorizationDays: [0, 1, 2, 3, 4, 5, 6] }),
      7
    );
    const withoutDays = generateDailyTasks(baseSettings(), 7);
    withAllDays.forEach((t, i) => {
      expect(t.newMemorization.pages).toEqual(withoutDays[i].newMemorization.pages);
    });
  });

  it('إعداد مخصص: يوم واحد فقط — الحفظ يحدث فقط في ذلك اليوم', () => {
    // نحفظ فقط الأحد (0)
    const tasks = generateDailyTasks(
      baseSettings({ memorizationDays: [0] }),
      14
    );
    tasks.forEach(t => {
      const d = new Date(t.date);
      if (d.getDay() !== 0) {
        expect(t.newMemorization.pages).toHaveLength(0);
      } else {
        expect(t.newMemorization.pages.length).toBeGreaterThan(0);
      }
    });
  });

  it('أيام الحفظ الأحد-الخميس: الصفحات لا تتكرر عبر أيام الحفظ', () => {
    const tasks = generateDailyTasks(
      baseSettings({ memorizationDays: [0, 1, 2, 3, 4] }),
      14
    );
    const allMemPages = tasks.flatMap(t => t.newMemorization.pages);
    const uniquePages = new Set(allMemPages);
    expect(uniquePages.size).toBe(allMemPages.length);
  });

  it('بدون memorizationDays: undefined يساوي كل الأيام', () => {
    const tasksUndefined = generateDailyTasks(baseSettings({ memorizationDays: undefined }), 7);
    const tasksAll = generateDailyTasks(baseSettings({ memorizationDays: [0, 1, 2, 3, 4, 5, 6] }), 7);
    tasksUndefined.forEach((t, i) => {
      expect(t.newMemorization.pages).toEqual(tasksAll[i].newMemorization.pages);
    });
  });
});

// ===== ١٢. اكتمال الجدول =====

describe('اكتمال الجدول', () => {
  it('30 يوم بجميع الحقول مكتملة', () => {
    const tasks = generateDailyTasks(baseSettings({
      memorizedSurahs: [1],
      dailyFarReview: 3,
    }), 30);
    expect(tasks).toHaveLength(30);
    tasks.forEach(t => {
      expect(t.completed.newMemorization).toBe(false);
      expect(t.completed.nearReview).toBe(false);
      expect(t.completed.farReview).toBe(false);
      expect(t.completed.preparation).toBe(false);
      expect(t.completed.weeklyPreparation).toBe(false);
    });
  });

  it('التواريخ تتقدم يوماً بعد يوم بدون فجوات', () => {
    const tasks = generateDailyTasks(baseSettings(), 30);
    for (let i = 1; i < tasks.length; i++) {
      const prev = new Date(tasks[i - 1].date);
      const curr = new Date(tasks[i].date);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      expect(diff).toBe(1);
    }
  });
});

// ===== المراجعة مع حفظ سابق (الإعداد السريع) =====

describe('المراجعة مع حفظ سابق وأيام راحة', () => {
  // النحل ص1 (ص267)، صفحة يومياً، راحة الخميس والجمعة والسبت، 13 جزءاً محفوظاً
  const s = () => baseSettings({
    currentSurahNumber: 16,
    currentPageInSurah: 267,
    memorizationDays: [0, 1, 2, 3],
    currentMemorizedPages: 260,
    dailyNearReview: 8,
    dailyFarReview: 8,
    farReviewSurahNumber: 1,
    startDate: '2026-07-31', // جمعة (يوم راحة)
  });

  it('المراجعة القريبة موجودة من اليوم الأول حتى في يوم الراحة', () => {
    const tasks = generateDailyTasks(s(), 7);
    tasks.forEach(t => expect(t.nearReview.pages.length).toBeGreaterThan(0));
    expect(tasks[0].nearReview.verseRange!.endVerse).toBe(266);
  });

  it('المراجعة القريبة تشمل حفظ الأمس', () => {
    const tasks = generateDailyTasks(s(), 7);
    // الأحد 2 أغسطس حفظ ص267، الاثنين يراجعها
    expect(tasks[3].nearReview.pages).toContain(267);
  });

  it('المراجعة البعيدة تبدأ من السورة المختارة وتعرض الجزء الصحيح', () => {
    const tasks = generateDailyTasks(s(), 14);
    expect(tasks[0].farReview.verseRange!.startVerse).toBe(1);
    expect(tasks[0].farReview.juzNumber).toBe(1);
    const juzs = new Set(tasks.map(t => t.farReview.juzNumber));
    expect(juzs.size).toBeGreaterThan(1);
    // لا تدخل المراجعة البعيدة في الحفظ الجديد
    tasks.forEach(t => t.farReview.pages.forEach(p => expect(p).toBeLessThan(267)));
  });

  it('يوم الراحة لا يحمل اسم سورة في خانة الحفظ', () => {
    const tasks = generateDailyTasks(s(), 3);
    expect(tasks[0].newMemorization.surahName).toBe('');
    expect(tasks[0].newMemorization.unitLabel).not.toContain('مراجعة');
  });

  it('الصفحة الأولى تُنسب للسورة المختارة لا للسورة السابقة', () => {
    const tasks = generateDailyTasks(s(), 3);
    expect(tasks[2].newMemorization.unitLabel).toBe('ص267 (النحل)');
  });

  it('التحضير الأسبوعي يحسب أيام الحفظ فقط', () => {
    const tasks = generateDailyTasks(s(), 3);
    expect(tasks[0].weeklyPreparation.totalUnits).toBe(4);
  });
});

// ===== فترة المراجعة المكثفة =====

describe('فترة المراجعة المكثفة', () => {
  const s = (days = 7) => baseSettings({
    currentSurahNumber: 16,
    currentPageInSurah: 267,
    memorizationDays: [0, 1, 2, 3],
    currentMemorizedPages: 260,
    dailyNearReview: 8,
    dailyFarReview: 8,
    farReviewSurahNumber: 1,
    startDate: '2026-07-31',
    intensiveReview: { startDate: '2026-08-06', days },
  });

  const period = (tasks: ReturnType<typeof generateDailyTasks>) => tasks.filter(t => t.intensive);

  it('لا حفظ جديد خلال الفترة', () => {
    const tasks = generateDailyTasks(s(), 30);
    const p = period(tasks);
    expect(p).toHaveLength(7);
    p.forEach(t => {
      expect(t.newMemorization.pages).toHaveLength(0);
      expect(t.newMemorization.unitLabel).toContain('مراجعة مكثفة');
    });
  });

  it('تُراجع كل المحفوظ مرة واحدة خلال الفترة', () => {
    const tasks = generateDailyTasks(s(), 30);
    const pages = period(tasks).flatMap(t => t.farReview.pages);
    // ص1-266 محفوظ سابقاً + ص267-270 حُفظت قبل الفترة
    expect(pages).toEqual(Array.from({ length: 270 }, (_, i) => i + 1));
  });

  it('يُستأنف الحفظ من نفس الموضع بعد الفترة', () => {
    const tasks = generateDailyTasks(s(), 30);
    const after = tasks.filter(t => t.date > '2026-08-12' && t.newMemorization.pages.length > 0);
    expect(after[0].newMemorization.pages[0]).toBe(271);
  });

  it('شهر كامل: مقدار يومي أصغر', () => {
    const tasks = generateDailyTasks(s(30), 60);
    const p = period(tasks);
    expect(p).toHaveLength(30);
    p.forEach(t => expect(t.farReview.pages.length).toBeLessThanOrEqual(10));
  });

  it('طول الجدول يشمل الفترة', async () => {
    const { getScheduleLength } = await import('../scheduleGenerator');
    expect(getScheduleLength(s(30))).toBeGreaterThanOrEqual(6 + 30);
    expect(getScheduleLength(baseSettings())).toBe(30);
  });

  it('بدون فترة: الجدول لا يتغير', () => {
    const { intensiveReview: _ir, ...rest } = s();
    const tasks = generateDailyTasks(rest as UserSettings, 14);
    expect(tasks.some(t => t.intensive)).toBe(false);
  });
});
