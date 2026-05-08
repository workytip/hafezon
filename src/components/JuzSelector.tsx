import { useState, useMemo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { surahs, juzs } from '@/data/quranData';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface JuzSelectorProps {
  memorizedSurahs: number[];
  onSurahsChange: (surahs: number[]) => void;
  currentMemorizedPages: number;
  memorizedJuzs: number[];
  onJuzsChange: (juzs: number[]) => void;
}

// السور التي تتداخل مع الجزء (تبدأ أو تستمر أو تنتهي فيه)
const getSurahsInJuz = (juzNumber: number) => {
  const juz = juzs.find((j) => j.number === juzNumber);
  if (!juz) return [];

  return surahs.filter(
    (surah) => surah.startPage <= juz.endPage && surah.endPage >= juz.startPage
  );
};

export const JuzSelector = ({
  memorizedSurahs,
  onSurahsChange,
  currentMemorizedPages,
  memorizedJuzs,
  onJuzsChange,
}: JuzSelectorProps) => {
  const [openJuzs, setOpenJuzs] = useState<number[]>([]);

  // حفظ السور لكل جزء في الذاكرة لتحسين الأداء
  const juzSurahsMap = useMemo(() => {
    const map = new Map<number, typeof surahs>();
    juzs.forEach((juz) => {
      map.set(juz.number, getSurahsInJuz(juz.number));
    });
    return map;
  }, []);

  // حفظ مجموعات السور والأجزاء المحفوظة
  const memorizedSurahsSet = useMemo(() => new Set(memorizedSurahs), [memorizedSurahs]);
  const memorizedJuzsSet = useMemo(() => new Set(memorizedJuzs), [memorizedJuzs]);

  const toggleJuzOpen = useCallback((juzNumber: number) => {
    setOpenJuzs((prev) =>
      prev.includes(juzNumber) ? prev.filter((n) => n !== juzNumber) : [...prev, juzNumber]
    );
  }, []);

  const toggleSurah = useCallback((surahNumber: number) => {
    onSurahsChange(
      memorizedSurahs.includes(surahNumber)
        ? memorizedSurahs.filter((n) => n !== surahNumber)
        : [...memorizedSurahs, surahNumber]
    );
  }, [memorizedSurahs, onSurahsChange]);

  const toggleJuz = useCallback((juzNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const surahsInJuz = juzSurahsMap.get(juzNumber) || [];
    const surahNumbers = surahsInJuz.map(s => s.number);
    
    if (memorizedJuzs.includes(juzNumber)) {
      // إلغاء اختيار الجزء وكل سوره
      onJuzsChange(memorizedJuzs.filter((n) => n !== juzNumber));
      onSurahsChange(memorizedSurahs.filter((n) => !surahNumbers.includes(n)));
    } else {
      // اختيار الجزء وكل سوره تلقائياً
      onJuzsChange([...memorizedJuzs, juzNumber]);
      const newSurahs = [...memorizedSurahs];
      surahNumbers.forEach(sn => {
        if (!newSurahs.includes(sn)) newSurahs.push(sn);
      });
      onSurahsChange(newSurahs);
    }
  }, [memorizedJuzs, memorizedSurahs, onJuzsChange, onSurahsChange, juzSurahsMap]);

  const isJuzSelected = useCallback((juzNumber: number) => memorizedJuzsSet.has(juzNumber), [memorizedJuzsSet]);

  const isJuzPartiallySelected = useCallback((juzNumber: number) => {
    const surahsInJuz = juzSurahsMap.get(juzNumber) || [];
    return surahsInJuz.some((s) => memorizedSurahsSet.has(s.number));
  }, [juzSurahsMap, memorizedSurahsSet]);

  const selectAll = useCallback(() => {
    onJuzsChange(juzs.map((j) => j.number));
    onSurahsChange(surahs.map((s) => s.number));
  }, [onJuzsChange, onSurahsChange]);

  const clearAll = useCallback(() => {
    onJuzsChange([]);
    onSurahsChange([]);
  }, [onJuzsChange, onSurahsChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="bg-primary/10 rounded-lg px-4 py-2">
          <span className="text-sm text-muted-foreground">إجمالي المحفوظ: </span>
          <span className="font-bold text-primary text-lg">{currentMemorizedPages}</span>
          <span className="text-sm text-muted-foreground"> صفحة</span>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAll}>
            الكل
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={clearAll}>
            مسح
          </Button>
        </div>
      </div>

      <ScrollArea className="h-80 border rounded-xl p-3 bg-background/50" dir="rtl">
        <div className="space-y-2 text-right">
          {juzs.map((juz) => {
            const surahsInJuz = juzSurahsMap.get(juz.number) || [];
            const isSelected = memorizedJuzsSet.has(juz.number);
            const isPartiallySelected = !isSelected && surahsInJuz.some((s) => memorizedSurahsSet.has(s.number));
            const isOpen = openJuzs.includes(juz.number);

            return (
              <Collapsible key={juz.number} open={isOpen} onOpenChange={() => toggleJuzOpen(juz.number)}>
                <div
                  className={`rounded-xl transition-all ${
                    isSelected
                      ? 'bg-primary/20 border-2 border-primary'
                      : isPartiallySelected
                        ? 'bg-primary/10 border-2 border-primary/50'
                        : 'bg-background border-2 border-transparent hover:bg-accent'
                  }`}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div onClick={(e) => toggleJuz(juz.number, e)}>
                          <Checkbox
                            checked={isSelected || isPartiallySelected}
                            className="h-5 w-5"
                          />
                        </div>
                        <div>
                          <span className="font-semibold">الجزء {juz.number}</span>
                          <span className="text-xs text-muted-foreground mr-2">({surahsInJuz.length} سور)</span>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-1 border-t border-border/50">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {surahsInJuz.map((surah) => {
                          const isChecked = memorizedSurahsSet.has(surah.number);
                          return (
                            <div
                              key={surah.number}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-primary/30 border border-primary'
                                  : 'bg-muted/50 hover:bg-muted border border-transparent'
                              }`}
                              onClick={() => toggleSurah(surah.number)}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleSurah(surah.number)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{surah.arabicName}</p>
                                <p className="text-[10px] text-muted-foreground">{surah.totalPages} ص</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
