import { useMemo } from 'react';

interface ProgressRingProps {
  memorizedPages: number;
  totalPages?: number;
  size?: number;
}

export const ProgressRing = ({ 
  memorizedPages, 
  totalPages = 604,
  size = 180 
}: ProgressRingProps) => {
  const percentage = useMemo(() => {
    return Math.min((memorizedPages / totalPages) * 100, 100);
  }, [memorizedPages, totalPages]);

  const radius = size / 2;
  const center = size / 2;
  const innerRadius = radius * 0.55;
  const numSlices = 30; // 30 جزء
  
  // حساب زاوية القطاع المحفوظ (تبدأ من الأعلى)
  const progressAngle = (percentage / 100) * 360;
  const startAngle = -90; // نبدأ من الأعلى
  const endAngle = startAngle + progressAngle;
  
  // تحويل الزوايا إلى إحداثيات
  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };
  
  const start = polarToCartesian(center, center, radius, startAngle);
  const end = polarToCartesian(center, center, radius, endAngle);
  const largeArcFlag = progressAngle > 180 ? 1 : 0;
  
  // مسار القطاع المحفوظ
  const progressPath = percentage > 0 && percentage < 100
    ? `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`
    : percentage >= 100
    ? `M ${center} ${center} m -${radius} 0 a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 -${radius * 2} 0`
    : '';

  // إنشاء خطوط الشرائح (30 شريحة)
  const sliceLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < numSlices; i++) {
      const angle = startAngle + (i * 360) / numSlices;
      const outerPoint = polarToCartesian(center, center, radius, angle);
      const innerPoint = polarToCartesian(center, center, innerRadius, angle);
      lines.push({ outer: outerPoint, inner: innerPoint });
    }
    return lines;
  }, [center, radius, innerRadius, numSlices]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="drop-shadow-lg">
          {/* الدائرة الخلفية (المتبقي) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="fill-muted"
          />
          {/* قطاع التقدم (المحفوظ) */}
          {percentage > 0 && (
            <path
              d={progressPath}
              className="fill-primary transition-all duration-1000 ease-out"
            />
          )}
          {/* خطوط الشرائح */}
          {sliceLines.map((line, i) => (
            <line
              key={i}
              x1={line.outer.x}
              y1={line.outer.y}
              x2={line.inner.x}
              y2={line.inner.y}
              className="stroke-background"
              strokeWidth={2}
            />
          ))}
          {/* دائرة داخلية للنص */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            className="fill-background"
          />
        </svg>
        {/* النسبة في المنتصف */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-primary">
            {percentage.toFixed(1)}%
          </span>
          <span className="text-sm text-muted-foreground">محفوظ</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>{memorizedPages} صفحة</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted" />
          <span>{totalPages - memorizedPages} متبقية</span>
        </div>
      </div>
    </div>
  );
};
