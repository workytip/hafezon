import { useState, useMemo, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { surahs, juzs } from '@/data/quranData';
import { GripVertical, Plus, ArrowLeft, Layers, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface FlexibleSortableListProps {
  memorizedSurahs: number[];
  memorizedJuzs: number[];
  customOrder: string[];
  onOrderChange: (order: string[]) => void;
  getSurahsInJuz: (juzNumber: number) => number[];
}

// الأجزاء القصيرة (28-30) تُعامل كوحدات كاملة
const SHORT_JUZ_THRESHOLD = 28;

// دالة للحصول على الأجزاء التي تتداخل مع سورة معينة
const getJuzsForSurah = (surahNumber: number): number[] => {
  const surah = surahs.find(s => s.number === surahNumber);
  if (!surah) return [];
  
  return juzs
    .filter(juz => surah.startPage <= juz.endPage && surah.endPage >= juz.startPage)
    .map(juz => juz.number);
};

// عنصر قابل للسحب في القائمة المرتبة
const SortableItem = ({ 
  id, 
  children,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  showMoveButtons
}: { 
  id: string; 
  children: React.ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  showMoveButtons?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 bg-background rounded-lg border transition-all",
        isDragging ? "opacity-50 shadow-lg border-primary z-50" : "border-border hover:border-primary/50"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
      {showMoveButtons && (
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-0.5 hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="p-0.5 hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

// مكون عنصر متاح (سورة أو جزء أو جزء من سورة)
const AvailableItem = ({
  item,
  onAdd,
  isMultiJuz,
  surahJuzs,
  onExpandToggle,
  isExpanded,
  onAddPortion
}: {
  item: { type: string; id: string; name: string; surahNumber?: number; juzNumber?: number; portionJuz?: number };
  onAdd: () => void;
  isMultiJuz?: boolean;
  surahJuzs?: number[];
  onExpandToggle?: () => void;
  isExpanded?: boolean;
  onAddPortion?: (juzNum: number) => void;
}) => {
  // جزء كامل (28-30)
  if (item.type === 'juz') {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="w-full flex items-center gap-2 p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-right border border-primary/20"
      >
        <Plus className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{item.name}</span>
      </button>
    );
  }

  // جزء محدد من سورة طويلة (مثل البقرة جزء 1)
  if (item.type === 'surah-portion') {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="w-full flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-right border border-amber-500/30 border-dashed"
      >
        <Plus className="h-3 w-3 text-amber-600" />
        <span className="text-sm text-amber-700 dark:text-amber-400">{item.name}</span>
      </button>
    );
  }

  // سورة عادية أو سورة متعددة الأجزاء
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-2 hover:bg-accent/50 transition-colors">
        <button
          type="button"
          onClick={onAdd}
          className="flex-1 flex items-center gap-2 text-right"
        >
          <Plus className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{item.name}</span>
          {isMultiJuz && surahJuzs && (
            <Badge variant="outline" className="text-xs">
              {surahJuzs.length} أجزاء
            </Badge>
          )}
        </button>
        {isMultiJuz && onExpandToggle && (
          <button
            type="button"
            onClick={onExpandToggle}
            className="p-1 hover:bg-background rounded text-xs text-muted-foreground"
            title="اختيار جزء محدد"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
      
      {/* أجزاء السورة الطويلة */}
      {isExpanded && isMultiJuz && surahJuzs && onAddPortion && (
        <div className="border-t bg-muted/30 p-2 space-y-1">
          <p className="text-xs text-muted-foreground mb-2">اختر جزء محدد:</p>
          <div className="flex flex-wrap gap-1">
            {surahJuzs.map(juzNum => (
              <Button
                key={juzNum}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddPortion(juzNum)}
                className="text-xs h-7"
              >
                جزء {juzNum}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const FlexibleSortableList = ({
  memorizedSurahs,
  memorizedJuzs,
  customOrder,
  onOrderChange,
  getSurahsInJuz,
}: FlexibleSortableListProps) => {
  const [expandedSurahs, setExpandedSurahs] = useState<Set<number>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // حساب كل السور المحفوظة
  const allMemorizedSurahs = useMemo(() => {
    const surahSet = new Set<number>(memorizedSurahs);
    memorizedJuzs.forEach((juzNumber) => {
      const juz = juzs.find((j) => j.number === juzNumber);
      if (!juz) return;
      surahs.forEach((surah) => {
        if (surah.startPage <= juz.endPage && surah.endPage >= juz.startPage) {
          surahSet.add(surah.number);
        }
      });
    });
    return Array.from(surahSet).sort((a, b) => a - b);
  }, [memorizedSurahs, memorizedJuzs]);

  // بناء قائمة العناصر المتاحة بشكل مسطح
  const availableItems = useMemo(() => {
    const selectedSet = new Set(customOrder);
    const items: {
      type: 'surah' | 'juz' | 'surah-portion';
      id: string;
      name: string;
      surahNumber?: number;
      juzNumber?: number;
      surahJuzs?: number[];
      portionJuz?: number;
    }[] = [];
    
    // تتبع السور التي تمت إضافتها (ضمن الأجزاء القصيرة المحفوظة)
    const addedSurahs = new Set<number>();
    
    // للأجزاء القصيرة (28-30)، أضفها كوحدات كاملة
    for (let juzNum = SHORT_JUZ_THRESHOLD; juzNum <= 30; juzNum++) {
      if (!memorizedJuzs.includes(juzNum)) continue;
      
      const juzId = `juz-${juzNum}`;
      const surahsInJuz = getSurahsInJuz(juzNum);
      
      // أضف السور لقائمة المضافة لتجنب التكرار (سواء كان الجزء مختاراً أم لا)
      surahsInJuz.forEach(s => addedSurahs.add(s));
      
      // إذا كان الجزء مختاراً، لا تعرضه
      if (selectedSet.has(juzId)) continue;
      
      // تحقق إذا كانت كل سور الجزء مختارة فردياً
      const allSurahsSelected = surahsInJuz.every(s => selectedSet.has(`surah-${s}`));
      if (allSurahsSelected) continue;
      
      items.push({
        type: 'juz',
        id: juzId,
        name: `الجزء ${juzNum}`,
        juzNumber: juzNum
      });
    }
    
    // للسور الأخرى (ليست في الأجزاء القصيرة)
    allMemorizedSurahs.forEach(surahNum => {
      // تخطي السور التي أُضيفت ضمن الأجزاء القصيرة
      if (addedSurahs.has(surahNum)) return;
      
      const surah = surahs.find(s => s.number === surahNum);
      if (!surah) return;
      
      const surahId = `surah-${surahNum}`;
      const surahJuzs = getJuzsForSurah(surahNum);
      
      // تحقق إذا كانت السورة الكاملة مختارة
      const isFullySelected = selectedSet.has(surahId);
      if (isFullySelected) return;
      
      // للسور متعددة الأجزاء، تحقق من الأجزاء المختارة
      if (surahJuzs.length > 1) {
        const portionIds = surahJuzs.map(j => `surah-${surahNum}-juz-${j}`);
        const selectedPortions = portionIds.filter(id => selectedSet.has(id));
        
        // إذا كل الأجزاء مختارة، لا تعرض شيء
        if (selectedPortions.length === surahJuzs.length) return;
        
        // إذا بعض الأجزاء مختارة، اعرض الأجزاء المتبقية فقط
        if (selectedPortions.length > 0) {
          surahJuzs.forEach(juzNum => {
            const portionId = `surah-${surahNum}-juz-${juzNum}`;
            if (!selectedSet.has(portionId)) {
              items.push({
                type: 'surah-portion',
                id: portionId,
                name: `${surah.arabicName} (جزء ${juzNum})`,
                surahNumber: surahNum,
                portionJuz: juzNum
              });
            }
          });
          return;
        }
        
        // لا شيء مختار، اعرض السورة كاملة مع خيار التوسيع
        items.push({
          type: 'surah',
          id: surahId,
          name: surah.arabicName,
          surahNumber: surahNum,
          surahJuzs: surahJuzs
        });
      } else {
        // سورة عادية (جزء واحد)
        items.push({
          type: 'surah',
          id: surahId,
          name: surah.arabicName,
          surahNumber: surahNum
        });
      }
    });
    
    return items;
  }, [allMemorizedSurahs, memorizedJuzs, customOrder, getSurahsInJuz]);

  // تبديل توسيع سورة
  const toggleSurahExpansion = (surahNumber: number) => {
    setExpandedSurahs(prev => {
      const next = new Set(prev);
      if (next.has(surahNumber)) {
        next.delete(surahNumber);
      } else {
        next.add(surahNumber);
      }
      return next;
    });
  };

  // إضافة عنصر للقائمة
  const addToOrder = useCallback((id: string) => {
    if (!customOrder.includes(id)) {
      onOrderChange([...customOrder, id]);
    }
  }, [customOrder, onOrderChange]);

  // إضافة جزء من سورة طويلة
  const addSurahPortion = useCallback((surahNumber: number, juzNumber: number) => {
    const portionId = `surah-${surahNumber}-juz-${juzNumber}`;
    if (!customOrder.includes(portionId)) {
      onOrderChange([...customOrder, portionId]);
      setExpandedSurahs(prev => {
        const next = new Set(prev);
        next.delete(surahNumber);
        return next;
      });
    }
  }, [customOrder, onOrderChange]);

  // إضافة كل العناصر المتاحة
  const addAllToOrder = useCallback(() => {
    const newItems = availableItems.map(item => item.id);
    onOrderChange([...customOrder, ...newItems]);
  }, [availableItems, customOrder, onOrderChange]);

  // إزالة عنصر من القائمة
  const removeFromOrder = useCallback((id: string) => {
    onOrderChange(customOrder.filter(item => item !== id));
  }, [customOrder, onOrderChange]);

  // مسح كل القائمة
  const clearOrder = useCallback(() => {
    onOrderChange([]);
  }, [onOrderChange]);

  // معالجة السحب والإفلات
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = customOrder.indexOf(active.id as string);
      const newIndex = customOrder.indexOf(over.id as string);
      const newOrder = arrayMove(customOrder, oldIndex, newIndex);
      onOrderChange(newOrder);
    }
  };

  // نقل عنصر لأعلى/أسفل
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= customOrder.length) return;
    const newOrder = arrayMove(customOrder, index, newIndex);
    onOrderChange(newOrder);
  };

  // الحصول على اسم العنصر
  const getItemName = (id: string) => {
    // التحقق من كونه جزء فرعي من سورة طويلة (surah-X-juz-Y)
    const portionMatch = id.match(/^surah-(\d+)-juz-(\d+)$/);
    if (portionMatch) {
      const surahNum = parseInt(portionMatch[1]);
      const juzNum = parseInt(portionMatch[2]);
      const surah = surahs.find(s => s.number === surahNum);
      return { 
        name: `${surah?.arabicName || ''} (جزء ${juzNum})`, 
        isJuz: false, 
        isSurahPortion: true
      };
    }
    
    if (id.startsWith('juz-')) {
      const juzNum = parseInt(id.replace('juz-', ''));
      return { name: `الجزء ${juzNum}`, isJuz: true };
    } else {
      const surahNum = parseInt(id.replace('surah-', ''));
      const surah = surahs.find(s => s.number === surahNum);
      return { name: surah?.arabicName || '', isJuz: false };
    }
  };

  return (
    <div className="flex gap-3 h-[420px]" dir="rtl">
      {/* القائمة المتاحة - اليمين */}
      <div className="flex-1 flex flex-col border rounded-xl overflow-hidden">
        <div className="bg-accent/50 p-3 border-b flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" />
              المتاح ({availableItems.length})
            </h4>
          </div>
          {availableItems.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addAllToOrder}
              className="text-xs h-7"
            >
              إضافة الكل
            </Button>
          )}
        </div>
        
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1.5">
            {availableItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                {customOrder.length > 0 ? 'تم اختيار كل العناصر ✓' : 'لا توجد سور محفوظة'}
              </p>
            ) : (
              availableItems.map(item => (
                <AvailableItem
                  key={item.id}
                  item={item}
                  onAdd={() => addToOrder(item.id)}
                  isMultiJuz={!!item.surahJuzs}
                  surahJuzs={item.surahJuzs}
                  isExpanded={item.surahNumber ? expandedSurahs.has(item.surahNumber) : false}
                  onExpandToggle={item.surahNumber ? () => toggleSurahExpansion(item.surahNumber!) : undefined}
                  onAddPortion={item.surahNumber ? (juz) => addSurahPortion(item.surahNumber!, juz) : undefined}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* سهم التحويل */}
      <div className="flex items-center">
        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* القائمة المرتبة - اليسار */}
      <div className="flex-1 flex flex-col border rounded-xl overflow-hidden">
        <div className="bg-primary/10 p-3 border-b flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              ترتيب المراجعة ({customOrder.length})
            </h4>
          </div>
          {customOrder.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearOrder}
              className="text-xs h-7 text-destructive hover:text-destructive"
            >
              مسح الكل
            </Button>
          )}
        </div>
        
        <ScrollArea className="flex-1 p-2">
          {customOrder.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={customOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {customOrder.map((id, index) => {
                    const { name, isJuz, isSurahPortion } = getItemName(id);
                    
                    return (
                      <SortableItem
                        key={id}
                        id={id}
                        onMoveUp={() => moveItem(index, 'up')}
                        onMoveDown={() => moveItem(index, 'down')}
                        isFirst={index === 0}
                        isLast={index === customOrder.length - 1}
                        showMoveButtons={customOrder.length > 3}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-5">{index + 1}</span>
                          <span className={cn(
                            "text-sm flex-1",
                            isJuz && "font-medium text-primary",
                            isSurahPortion && "text-amber-600 dark:text-amber-400"
                          )}>
                            {name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromOrder(id)}
                            className="p-1 hover:bg-destructive/20 rounded text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </SortableItem>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">لم تختر أي عناصر</p>
              <p className="text-xs mt-1">اضغط على العناصر من القائمة</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
