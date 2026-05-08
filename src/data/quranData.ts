// بيانات القرآن الكريم الكاملة
export interface Surah {
  number: number;
  name: string;
  arabicName: string;
  startPage: number;
  endPage: number;
  juz: number[];
  totalPages: number;
  totalVerses: number;
}

export interface Juz {
  number: number;
  startPage: number;
  endPage: number;
  startSurah: string;
  hizbs: number[];
}

export interface Hizb {
  number: number;
  startPage: number;
  endPage: number;
  juz: number;
}

export interface Rub {
  number: number;
  hizbNumber: number;
  juzNumber: number;
  startPage: number;
  endPage: number;
  quarterInHizb: number; // 1, 2, 3, or 4
}

// بيانات الأحزاب (60 حزب)
export const hizbs: Hizb[] = [
  { number: 1, startPage: 1, endPage: 10, juz: 1 },
  { number: 2, startPage: 11, endPage: 21, juz: 1 },
  { number: 3, startPage: 22, endPage: 31, juz: 2 },
  { number: 4, startPage: 32, endPage: 41, juz: 2 },
  { number: 5, startPage: 42, endPage: 51, juz: 3 },
  { number: 6, startPage: 52, endPage: 62, juz: 3 },
  { number: 7, startPage: 62, endPage: 71, juz: 4 },
  { number: 8, startPage: 72, endPage: 81, juz: 4 },
  { number: 9, startPage: 82, endPage: 91, juz: 5 },
  { number: 10, startPage: 92, endPage: 101, juz: 5 },
  { number: 11, startPage: 102, endPage: 111, juz: 6 },
  { number: 12, startPage: 112, endPage: 121, juz: 6 },
  { number: 13, startPage: 121, endPage: 131, juz: 7 },
  { number: 14, startPage: 132, endPage: 141, juz: 7 },
  { number: 15, startPage: 142, endPage: 151, juz: 8 },
  { number: 16, startPage: 152, endPage: 161, juz: 8 },
  { number: 17, startPage: 162, endPage: 171, juz: 9 },
  { number: 18, startPage: 172, endPage: 181, juz: 9 },
  { number: 19, startPage: 182, endPage: 191, juz: 10 },
  { number: 20, startPage: 192, endPage: 201, juz: 10 },
  { number: 21, startPage: 202, endPage: 211, juz: 11 },
  { number: 22, startPage: 212, endPage: 221, juz: 11 },
  { number: 23, startPage: 222, endPage: 231, juz: 12 },
  { number: 24, startPage: 232, endPage: 241, juz: 12 },
  { number: 25, startPage: 242, endPage: 251, juz: 13 },
  { number: 26, startPage: 252, endPage: 261, juz: 13 },
  { number: 27, startPage: 262, endPage: 271, juz: 14 },
  { number: 28, startPage: 272, endPage: 281, juz: 14 },
  { number: 29, startPage: 282, endPage: 291, juz: 15 },
  { number: 30, startPage: 292, endPage: 301, juz: 15 },
  { number: 31, startPage: 302, endPage: 311, juz: 16 },
  { number: 32, startPage: 312, endPage: 321, juz: 16 },
  { number: 33, startPage: 322, endPage: 331, juz: 17 },
  { number: 34, startPage: 332, endPage: 341, juz: 17 },
  { number: 35, startPage: 342, endPage: 351, juz: 18 },
  { number: 36, startPage: 352, endPage: 361, juz: 18 },
  { number: 37, startPage: 362, endPage: 371, juz: 19 },
  { number: 38, startPage: 372, endPage: 381, juz: 19 },
  { number: 39, startPage: 382, endPage: 391, juz: 20 },
  { number: 40, startPage: 392, endPage: 401, juz: 20 },
  { number: 41, startPage: 402, endPage: 411, juz: 21 },
  { number: 42, startPage: 412, endPage: 421, juz: 21 },
  { number: 43, startPage: 422, endPage: 431, juz: 22 },
  { number: 44, startPage: 432, endPage: 441, juz: 22 },
  { number: 45, startPage: 442, endPage: 451, juz: 23 },
  { number: 46, startPage: 452, endPage: 461, juz: 23 },
  { number: 47, startPage: 462, endPage: 471, juz: 24 },
  { number: 48, startPage: 472, endPage: 481, juz: 24 },
  { number: 49, startPage: 482, endPage: 491, juz: 25 },
  { number: 50, startPage: 492, endPage: 502, juz: 25 },
  { number: 51, startPage: 502, endPage: 511, juz: 26 },
  { number: 52, startPage: 512, endPage: 521, juz: 26 },
  { number: 53, startPage: 522, endPage: 531, juz: 27 },
  { number: 54, startPage: 532, endPage: 541, juz: 27 },
  { number: 55, startPage: 542, endPage: 551, juz: 28 },
  { number: 56, startPage: 552, endPage: 561, juz: 28 },
  { number: 57, startPage: 562, endPage: 571, juz: 29 },
  { number: 58, startPage: 572, endPage: 581, juz: 29 },
  { number: 59, startPage: 582, endPage: 591, juz: 30 },
  { number: 60, startPage: 592, endPage: 604, juz: 30 },
];

// بيانات الأرباع (240 ربع - 4 أرباع لكل حزب)
export const generateRubs = (): Rub[] => {
  const rubs: Rub[] = [];
  let rubNumber = 1;
  
  for (const hizb of hizbs) {
    const hizbPages = hizb.endPage - hizb.startPage + 1;
    const pagesPerRub = Math.ceil(hizbPages / 4);
    
    for (let q = 1; q <= 4; q++) {
      const startPage = hizb.startPage + (q - 1) * pagesPerRub;
      const endPage = Math.min(hizb.startPage + q * pagesPerRub - 1, hizb.endPage);
      
      rubs.push({
        number: rubNumber,
        hizbNumber: hizb.number,
        juzNumber: hizb.juz,
        startPage,
        endPage,
        quarterInHizb: q,
      });
      rubNumber++;
    }
  }
  
  return rubs;
};

export const rubs = generateRubs();

export interface OldHizb {
  number: number;
  startPage: number;
  juz: number;
}

// السور الـ 114
export const surahs: Surah[] = [
  { number: 1, name: "Al-Fatiha", arabicName: "الفاتحة", startPage: 1, endPage: 1, juz: [1], totalPages: 1, totalVerses: 7 },
  { number: 2, name: "Al-Baqarah", arabicName: "البقرة", startPage: 2, endPage: 49, juz: [1, 2, 3], totalPages: 48, totalVerses: 286 },
  { number: 3, name: "Aal-Imran", arabicName: "آل عمران", startPage: 50, endPage: 76, juz: [3, 4], totalPages: 27, totalVerses: 200 },
  { number: 4, name: "An-Nisa", arabicName: "النساء", startPage: 77, endPage: 106, juz: [4, 5, 6], totalPages: 30, totalVerses: 176 },
  { number: 5, name: "Al-Maidah", arabicName: "المائدة", startPage: 106, endPage: 127, juz: [6, 7], totalPages: 22, totalVerses: 120 },
  { number: 6, name: "Al-An'am", arabicName: "الأنعام", startPage: 128, endPage: 150, juz: [7, 8], totalPages: 23, totalVerses: 165 },
  { number: 7, name: "Al-A'raf", arabicName: "الأعراف", startPage: 151, endPage: 176, juz: [8, 9], totalPages: 26, totalVerses: 206 },
  { number: 8, name: "Al-Anfal", arabicName: "الأنفال", startPage: 177, endPage: 186, juz: [9, 10], totalPages: 10, totalVerses: 75 },
  { number: 9, name: "At-Tawbah", arabicName: "التوبة", startPage: 187, endPage: 207, juz: [10, 11], totalPages: 21, totalVerses: 129 },
  { number: 10, name: "Yunus", arabicName: "يونس", startPage: 208, endPage: 221, juz: [11], totalPages: 14, totalVerses: 109 },
  { number: 11, name: "Hud", arabicName: "هود", startPage: 221, endPage: 235, juz: [11, 12], totalPages: 15, totalVerses: 123 },
  { number: 12, name: "Yusuf", arabicName: "يوسف", startPage: 235, endPage: 248, juz: [12, 13], totalPages: 14, totalVerses: 111 },
  { number: 13, name: "Ar-Ra'd", arabicName: "الرعد", startPage: 249, endPage: 255, juz: [13], totalPages: 7, totalVerses: 43 },
  { number: 14, name: "Ibrahim", arabicName: "إبراهيم", startPage: 255, endPage: 261, juz: [13], totalPages: 7, totalVerses: 52 },
  { number: 15, name: "Al-Hijr", arabicName: "الحجر", startPage: 262, endPage: 267, juz: [14], totalPages: 6, totalVerses: 99 },
  { number: 16, name: "An-Nahl", arabicName: "النحل", startPage: 267, endPage: 281, juz: [14], totalPages: 15, totalVerses: 128 },
  { number: 17, name: "Al-Isra", arabicName: "الإسراء", startPage: 282, endPage: 293, juz: [15], totalPages: 12, totalVerses: 111 },
  { number: 18, name: "Al-Kahf", arabicName: "الكهف", startPage: 293, endPage: 304, juz: [15, 16], totalPages: 12, totalVerses: 110 },
  { number: 19, name: "Maryam", arabicName: "مريم", startPage: 305, endPage: 312, juz: [16], totalPages: 8, totalVerses: 98 },
  { number: 20, name: "Taha", arabicName: "طه", startPage: 312, endPage: 321, juz: [16], totalPages: 10, totalVerses: 135 },
  { number: 21, name: "Al-Anbiya", arabicName: "الأنبياء", startPage: 322, endPage: 331, juz: [17], totalPages: 10, totalVerses: 112 },
  { number: 22, name: "Al-Hajj", arabicName: "الحج", startPage: 332, endPage: 341, juz: [17], totalPages: 10, totalVerses: 78 },
  { number: 23, name: "Al-Mu'minun", arabicName: "المؤمنون", startPage: 342, endPage: 349, juz: [18], totalPages: 8, totalVerses: 118 },
  { number: 24, name: "An-Nur", arabicName: "النور", startPage: 350, endPage: 359, juz: [18], totalPages: 10, totalVerses: 64 },
  { number: 25, name: "Al-Furqan", arabicName: "الفرقان", startPage: 359, endPage: 366, juz: [18, 19], totalPages: 8, totalVerses: 77 },
  { number: 26, name: "Ash-Shu'ara", arabicName: "الشعراء", startPage: 367, endPage: 376, juz: [19], totalPages: 10, totalVerses: 227 },
  { number: 27, name: "An-Naml", arabicName: "النمل", startPage: 377, endPage: 385, juz: [19, 20], totalPages: 9, totalVerses: 93 },
  { number: 28, name: "Al-Qasas", arabicName: "القصص", startPage: 385, endPage: 396, juz: [20], totalPages: 12, totalVerses: 88 },
  { number: 29, name: "Al-Ankabut", arabicName: "العنكبوت", startPage: 396, endPage: 404, juz: [20, 21], totalPages: 9, totalVerses: 69 },
  { number: 30, name: "Ar-Rum", arabicName: "الروم", startPage: 404, endPage: 410, juz: [21], totalPages: 7, totalVerses: 60 },
  { number: 31, name: "Luqman", arabicName: "لقمان", startPage: 411, endPage: 414, juz: [21], totalPages: 4, totalVerses: 34 },
  { number: 32, name: "As-Sajdah", arabicName: "السجدة", startPage: 415, endPage: 417, juz: [21], totalPages: 3, totalVerses: 30 },
  { number: 33, name: "Al-Ahzab", arabicName: "الأحزاب", startPage: 418, endPage: 427, juz: [21, 22], totalPages: 10, totalVerses: 73 },
  { number: 34, name: "Saba", arabicName: "سبأ", startPage: 428, endPage: 434, juz: [22], totalPages: 7, totalVerses: 54 },
  { number: 35, name: "Fatir", arabicName: "فاطر", startPage: 434, endPage: 440, juz: [22], totalPages: 7, totalVerses: 45 },
  { number: 36, name: "Ya-Sin", arabicName: "يس", startPage: 440, endPage: 445, juz: [22, 23], totalPages: 6, totalVerses: 83 },
  { number: 37, name: "As-Saffat", arabicName: "الصافات", startPage: 446, endPage: 452, juz: [23], totalPages: 7, totalVerses: 182 },
  { number: 38, name: "Sad", arabicName: "ص", startPage: 453, endPage: 458, juz: [23], totalPages: 6, totalVerses: 88 },
  { number: 39, name: "Az-Zumar", arabicName: "الزمر", startPage: 458, endPage: 467, juz: [23, 24], totalPages: 10, totalVerses: 75 },
  { number: 40, name: "Ghafir", arabicName: "غافر", startPage: 467, endPage: 476, juz: [24], totalPages: 10, totalVerses: 85 },
  { number: 41, name: "Fussilat", arabicName: "فصلت", startPage: 477, endPage: 482, juz: [24, 25], totalPages: 6, totalVerses: 54 },
  { number: 42, name: "Ash-Shura", arabicName: "الشورى", startPage: 483, endPage: 489, juz: [25], totalPages: 7, totalVerses: 53 },
  { number: 43, name: "Az-Zukhruf", arabicName: "الزخرف", startPage: 489, endPage: 495, juz: [25], totalPages: 7, totalVerses: 89 },
  { number: 44, name: "Ad-Dukhan", arabicName: "الدخان", startPage: 496, endPage: 498, juz: [25], totalPages: 3, totalVerses: 59 },
  { number: 45, name: "Al-Jathiyah", arabicName: "الجاثية", startPage: 499, endPage: 502, juz: [25], totalPages: 4, totalVerses: 37 },
  { number: 46, name: "Al-Ahqaf", arabicName: "الأحقاف", startPage: 502, endPage: 506, juz: [26], totalPages: 5, totalVerses: 35 },
  { number: 47, name: "Muhammad", arabicName: "محمد", startPage: 507, endPage: 510, juz: [26], totalPages: 4, totalVerses: 38 },
  { number: 48, name: "Al-Fath", arabicName: "الفتح", startPage: 511, endPage: 515, juz: [26], totalPages: 5, totalVerses: 29 },
  { number: 49, name: "Al-Hujurat", arabicName: "الحجرات", startPage: 515, endPage: 517, juz: [26], totalPages: 3, totalVerses: 18 },
  { number: 50, name: "Qaf", arabicName: "ق", startPage: 518, endPage: 520, juz: [26], totalPages: 3, totalVerses: 45 },
  { number: 51, name: "Adh-Dhariyat", arabicName: "الذاريات", startPage: 520, endPage: 523, juz: [26, 27], totalPages: 4, totalVerses: 60 },
  { number: 52, name: "At-Tur", arabicName: "الطور", startPage: 523, endPage: 525, juz: [27], totalPages: 3, totalVerses: 49 },
  { number: 53, name: "An-Najm", arabicName: "النجم", startPage: 526, endPage: 528, juz: [27], totalPages: 3, totalVerses: 62 },
  { number: 54, name: "Al-Qamar", arabicName: "القمر", startPage: 528, endPage: 531, juz: [27], totalPages: 4, totalVerses: 55 },
  { number: 55, name: "Ar-Rahman", arabicName: "الرحمن", startPage: 531, endPage: 534, juz: [27], totalPages: 4, totalVerses: 78 },
  { number: 56, name: "Al-Waqi'ah", arabicName: "الواقعة", startPage: 534, endPage: 537, juz: [27], totalPages: 4, totalVerses: 96 },
  { number: 57, name: "Al-Hadid", arabicName: "الحديد", startPage: 537, endPage: 541, juz: [27], totalPages: 5, totalVerses: 29 },
  { number: 58, name: "Al-Mujadila", arabicName: "المجادلة", startPage: 542, endPage: 545, juz: [28], totalPages: 4, totalVerses: 22 },
  { number: 59, name: "Al-Hashr", arabicName: "الحشر", startPage: 545, endPage: 548, juz: [28], totalPages: 4, totalVerses: 24 },
  { number: 60, name: "Al-Mumtahanah", arabicName: "الممتحنة", startPage: 549, endPage: 551, juz: [28], totalPages: 3, totalVerses: 13 },
  { number: 61, name: "As-Saf", arabicName: "الصف", startPage: 551, endPage: 552, juz: [28], totalPages: 2, totalVerses: 14 },
  { number: 62, name: "Al-Jumu'ah", arabicName: "الجمعة", startPage: 553, endPage: 554, juz: [28], totalPages: 2, totalVerses: 11 },
  { number: 63, name: "Al-Munafiqun", arabicName: "المنافقون", startPage: 554, endPage: 555, juz: [28], totalPages: 2, totalVerses: 11 },
  { number: 64, name: "At-Taghabun", arabicName: "التغابن", startPage: 556, endPage: 557, juz: [28], totalPages: 2, totalVerses: 18 },
  { number: 65, name: "At-Talaq", arabicName: "الطلاق", startPage: 558, endPage: 559, juz: [28], totalPages: 2, totalVerses: 12 },
  { number: 66, name: "At-Tahrim", arabicName: "التحريم", startPage: 560, endPage: 561, juz: [28], totalPages: 2, totalVerses: 12 },
  { number: 67, name: "Al-Mulk", arabicName: "الملك", startPage: 562, endPage: 564, juz: [29], totalPages: 3, totalVerses: 30 },
  { number: 68, name: "Al-Qalam", arabicName: "القلم", startPage: 564, endPage: 566, juz: [29], totalPages: 3, totalVerses: 52 },
  { number: 69, name: "Al-Haqqah", arabicName: "الحاقة", startPage: 566, endPage: 568, juz: [29], totalPages: 3, totalVerses: 52 },
  { number: 70, name: "Al-Ma'arij", arabicName: "المعارج", startPage: 568, endPage: 570, juz: [29], totalPages: 3, totalVerses: 44 },
  { number: 71, name: "Nuh", arabicName: "نوح", startPage: 570, endPage: 571, juz: [29], totalPages: 2, totalVerses: 28 },
  { number: 72, name: "Al-Jinn", arabicName: "الجن", startPage: 572, endPage: 573, juz: [29], totalPages: 2, totalVerses: 28 },
  { number: 73, name: "Al-Muzzammil", arabicName: "المزمل", startPage: 574, endPage: 575, juz: [29], totalPages: 2, totalVerses: 20 },
  { number: 74, name: "Al-Muddaththir", arabicName: "المدثر", startPage: 575, endPage: 577, juz: [29], totalPages: 3, totalVerses: 56 },
  { number: 75, name: "Al-Qiyamah", arabicName: "القيامة", startPage: 577, endPage: 578, juz: [29], totalPages: 2, totalVerses: 40 },
  { number: 76, name: "Al-Insan", arabicName: "الإنسان", startPage: 578, endPage: 580, juz: [29], totalPages: 3, totalVerses: 31 },
  { number: 77, name: "Al-Mursalat", arabicName: "المرسلات", startPage: 580, endPage: 581, juz: [29], totalPages: 2, totalVerses: 50 },
  { number: 78, name: "An-Naba", arabicName: "النبأ", startPage: 582, endPage: 583, juz: [30], totalPages: 2, totalVerses: 40 },
  { number: 79, name: "An-Nazi'at", arabicName: "النازعات", startPage: 583, endPage: 584, juz: [30], totalPages: 2, totalVerses: 46 },
  { number: 80, name: "Abasa", arabicName: "عبس", startPage: 585, endPage: 585, juz: [30], totalPages: 1, totalVerses: 42 },
  { number: 81, name: "At-Takwir", arabicName: "التكوير", startPage: 586, endPage: 586, juz: [30], totalPages: 1, totalVerses: 29 },
  { number: 82, name: "Al-Infitar", arabicName: "الانفطار", startPage: 587, endPage: 587, juz: [30], totalPages: 1, totalVerses: 19 },
  { number: 83, name: "Al-Mutaffifin", arabicName: "المطففين", startPage: 587, endPage: 589, juz: [30], totalPages: 3, totalVerses: 36 },
  { number: 84, name: "Al-Inshiqaq", arabicName: "الانشقاق", startPage: 589, endPage: 589, juz: [30], totalPages: 1, totalVerses: 25 },
  { number: 85, name: "Al-Buruj", arabicName: "البروج", startPage: 590, endPage: 590, juz: [30], totalPages: 1, totalVerses: 22 },
  { number: 86, name: "At-Tariq", arabicName: "الطارق", startPage: 591, endPage: 591, juz: [30], totalPages: 1, totalVerses: 17 },
  { number: 87, name: "Al-A'la", arabicName: "الأعلى", startPage: 591, endPage: 591, juz: [30], totalPages: 1, totalVerses: 19 },
  { number: 88, name: "Al-Ghashiyah", arabicName: "الغاشية", startPage: 592, endPage: 592, juz: [30], totalPages: 1, totalVerses: 26 },
  { number: 89, name: "Al-Fajr", arabicName: "الفجر", startPage: 593, endPage: 594, juz: [30], totalPages: 2, totalVerses: 30 },
  { number: 90, name: "Al-Balad", arabicName: "البلد", startPage: 594, endPage: 594, juz: [30], totalPages: 1, totalVerses: 20 },
  { number: 91, name: "Ash-Shams", arabicName: "الشمس", startPage: 595, endPage: 595, juz: [30], totalPages: 1, totalVerses: 15 },
  { number: 92, name: "Al-Layl", arabicName: "الليل", startPage: 595, endPage: 596, juz: [30], totalPages: 2, totalVerses: 21 },
  { number: 93, name: "Ad-Duha", arabicName: "الضحى", startPage: 596, endPage: 596, juz: [30], totalPages: 1, totalVerses: 11 },
  { number: 94, name: "Ash-Sharh", arabicName: "الشرح", startPage: 596, endPage: 596, juz: [30], totalPages: 1, totalVerses: 8 },
  { number: 95, name: "At-Tin", arabicName: "التين", startPage: 597, endPage: 597, juz: [30], totalPages: 1, totalVerses: 8 },
  { number: 96, name: "Al-Alaq", arabicName: "العلق", startPage: 597, endPage: 597, juz: [30], totalPages: 1, totalVerses: 19 },
  { number: 97, name: "Al-Qadr", arabicName: "القدر", startPage: 598, endPage: 598, juz: [30], totalPages: 1, totalVerses: 5 },
  { number: 98, name: "Al-Bayyinah", arabicName: "البينة", startPage: 598, endPage: 599, juz: [30], totalPages: 2, totalVerses: 8 },
  { number: 99, name: "Az-Zalzalah", arabicName: "الزلزلة", startPage: 599, endPage: 599, juz: [30], totalPages: 1, totalVerses: 8 },
  { number: 100, name: "Al-Adiyat", arabicName: "العاديات", startPage: 599, endPage: 600, juz: [30], totalPages: 2, totalVerses: 11 },
  { number: 101, name: "Al-Qari'ah", arabicName: "القارعة", startPage: 600, endPage: 600, juz: [30], totalPages: 1, totalVerses: 11 },
  { number: 102, name: "At-Takathur", arabicName: "التكاثر", startPage: 600, endPage: 600, juz: [30], totalPages: 1, totalVerses: 8 },
  { number: 103, name: "Al-Asr", arabicName: "العصر", startPage: 601, endPage: 601, juz: [30], totalPages: 1, totalVerses: 3 },
  { number: 104, name: "Al-Humazah", arabicName: "الهمزة", startPage: 601, endPage: 601, juz: [30], totalPages: 1, totalVerses: 9 },
  { number: 105, name: "Al-Fil", arabicName: "الفيل", startPage: 601, endPage: 601, juz: [30], totalPages: 1, totalVerses: 5 },
  { number: 106, name: "Quraysh", arabicName: "قريش", startPage: 602, endPage: 602, juz: [30], totalPages: 1, totalVerses: 4 },
  { number: 107, name: "Al-Ma'un", arabicName: "الماعون", startPage: 602, endPage: 602, juz: [30], totalPages: 1, totalVerses: 7 },
  { number: 108, name: "Al-Kawthar", arabicName: "الكوثر", startPage: 602, endPage: 602, juz: [30], totalPages: 1, totalVerses: 3 },
  { number: 109, name: "Al-Kafirun", arabicName: "الكافرون", startPage: 603, endPage: 603, juz: [30], totalPages: 1, totalVerses: 6 },
  { number: 110, name: "An-Nasr", arabicName: "النصر", startPage: 603, endPage: 603, juz: [30], totalPages: 1, totalVerses: 3 },
  { number: 111, name: "Al-Masad", arabicName: "المسد", startPage: 603, endPage: 603, juz: [30], totalPages: 1, totalVerses: 5 },
  { number: 112, name: "Al-Ikhlas", arabicName: "الإخلاص", startPage: 604, endPage: 604, juz: [30], totalPages: 1, totalVerses: 4 },
  { number: 113, name: "Al-Falaq", arabicName: "الفلق", startPage: 604, endPage: 604, juz: [30], totalPages: 1, totalVerses: 5 },
  { number: 114, name: "An-Nas", arabicName: "الناس", startPage: 604, endPage: 604, juz: [30], totalPages: 1, totalVerses: 6 },
];

// الأجزاء الـ 30
export const juzs: Juz[] = [
  { number: 1, startPage: 1, endPage: 21, startSurah: "الفاتحة", hizbs: [1, 2] },
  { number: 2, startPage: 22, endPage: 41, startSurah: "البقرة", hizbs: [3, 4] },
  { number: 3, startPage: 42, endPage: 62, startSurah: "البقرة", hizbs: [5, 6] },
  { number: 4, startPage: 62, endPage: 81, startSurah: "آل عمران", hizbs: [7, 8] },
  { number: 5, startPage: 82, endPage: 101, startSurah: "النساء", hizbs: [9, 10] },
  { number: 6, startPage: 102, endPage: 121, startSurah: "النساء", hizbs: [11, 12] },
  { number: 7, startPage: 121, endPage: 141, startSurah: "المائدة", hizbs: [13, 14] },
  { number: 8, startPage: 142, endPage: 161, startSurah: "الأنعام", hizbs: [15, 16] },
  { number: 9, startPage: 162, endPage: 181, startSurah: "الأعراف", hizbs: [17, 18] },
  { number: 10, startPage: 182, endPage: 201, startSurah: "الأنفال", hizbs: [19, 20] },
  { number: 11, startPage: 202, endPage: 221, startSurah: "التوبة", hizbs: [21, 22] },
  { number: 12, startPage: 222, endPage: 241, startSurah: "هود", hizbs: [23, 24] },
  { number: 13, startPage: 242, endPage: 261, startSurah: "يوسف", hizbs: [25, 26] },
  { number: 14, startPage: 262, endPage: 281, startSurah: "الحجر", hizbs: [27, 28] },
  { number: 15, startPage: 282, endPage: 301, startSurah: "الإسراء", hizbs: [29, 30] },
  { number: 16, startPage: 302, endPage: 321, startSurah: "الكهف", hizbs: [31, 32] },
  { number: 17, startPage: 322, endPage: 341, startSurah: "الأنبياء", hizbs: [33, 34] },
  { number: 18, startPage: 342, endPage: 361, startSurah: "المؤمنون", hizbs: [35, 36] },
  { number: 19, startPage: 362, endPage: 381, startSurah: "الفرقان", hizbs: [37, 38] },
  { number: 20, startPage: 382, endPage: 401, startSurah: "النمل", hizbs: [39, 40] },
  { number: 21, startPage: 402, endPage: 421, startSurah: "العنكبوت", hizbs: [41, 42] },
  { number: 22, startPage: 422, endPage: 441, startSurah: "الأحزاب", hizbs: [43, 44] },
  { number: 23, startPage: 442, endPage: 461, startSurah: "يس", hizbs: [45, 46] },
  { number: 24, startPage: 462, endPage: 481, startSurah: "الزمر", hizbs: [47, 48] },
  { number: 25, startPage: 482, endPage: 502, startSurah: "فصلت", hizbs: [49, 50] },
  { number: 26, startPage: 502, endPage: 521, startSurah: "الأحقاف", hizbs: [51, 52] },
  { number: 27, startPage: 522, endPage: 541, startSurah: "الذاريات", hizbs: [53, 54] },
  { number: 28, startPage: 542, endPage: 561, startSurah: "المجادلة", hizbs: [55, 56] },
  { number: 29, startPage: 562, endPage: 581, startSurah: "الملك", hizbs: [57, 58] },
  { number: 30, startPage: 582, endPage: 604, startSurah: "النبأ", hizbs: [59, 60] },
];

// دوال مساعدة
export const getSurahByPage = (page: number): Surah | undefined => {
  return surahs.find(s => page >= s.startPage && page <= s.endPage);
};

export const getJuzByPage = (page: number): Juz | undefined => {
  return juzs.find(j => page >= j.startPage && page <= j.endPage);
};

export const getSurahByNumber = (num: number): Surah | undefined => {
  return surahs.find(s => s.number === num);
};

export const getPreviousSurah = (currentSurahNumber: number): Surah | undefined => {
  if (currentSurahNumber <= 1) return undefined;
  return surahs.find(s => s.number === currentSurahNumber - 1);
};

export const getPagesBetween = (startPage: number, endPage: number): number[] => {
  const pages: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  return pages;
};

export const getRubByNumber = (num: number): Rub | undefined => {
  return rubs.find(r => r.number === num);
};

export const getHizbByNumber = (num: number): Hizb | undefined => {
  return hizbs.find(h => h.number === num);
};

export const getRubByPage = (page: number): Rub | undefined => {
  return rubs.find(r => page >= r.startPage && page <= r.endPage);
};

export const getHizbByPage = (page: number): Hizb | undefined => {
  return hizbs.find(h => page >= h.startPage && page <= h.endPage);
};

// الحصول على اسم السورة للربع
export const getSurahNameForRub = (rubNumber: number): string => {
  const rub = getRubByNumber(rubNumber);
  if (!rub) return '';
  const surah = getSurahByPage(rub.startPage);
  return surah?.arabicName || '';
};

// الحصول على اسم السورة للحزب
export const getSurahNameForHizb = (hizbNumber: number): string => {
  const hizb = getHizbByNumber(hizbNumber);
  if (!hizb) return '';
  const surah = getSurahByPage(hizb.startPage);
  return surah?.arabicName || '';
};

export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;
export const TOTAL_HIZB = 60;
export const TOTAL_RUB = 240;
export const TOTAL_VERSES = 6236;
