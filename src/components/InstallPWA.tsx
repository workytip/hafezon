import { useState, useEffect, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { useInstallPWA, isAndroid, isIOS, isMobile, isAlreadyInstalled } from '@/hooks/useInstallPWA';

export function InstallPWA() {
  const { prompt, install, dismiss, canInstall } = useInstallPWA();
  const [visible, setVisible] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const promptReceived = useRef(false);

  useEffect(() => {
    if (!isMobile() || isAlreadyInstalled()) return;

    if (prompt) {
      promptReceived.current = true;
      const t = setTimeout(() => setVisible(true), 5000);
      return () => clearTimeout(t);
    }
  }, [prompt]);

  useEffect(() => {
    if (!isMobile() || isAlreadyInstalled() || !canInstall) return;
    const t = setTimeout(() => {
      if (!promptReceived.current) setShowManual(true);
    }, 10000);
    return () => clearTimeout(t);
  }, [canInstall]);

  const handleDismiss = () => {
    setVisible(false);
    setShowManual(false);
    dismiss();
  };

  const handleInstall = async () => {
    await install();
    setVisible(false);
  };

  const manualInstruction = isIOS()
    ? 'اضغط على زر المشاركة ← "إضافة إلى الشاشة الرئيسية"'
    : 'افتح قائمة المتصفح (⋮) ← "إضافة إلى الشاشة الرئيسية"';

  if (visible && prompt && canInstall) {
    return (
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-primary/40 shadow-xl animate-fade-in max-w-xs w-[90vw]"
        dir="rtl"
      >
        <div className="text-2xl shrink-0">📲</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">أضف حافظون للشاشة الرئيسية</p>
          <p className="text-xs text-muted-foreground mt-0.5">يعمل بدون إنترنت</p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Download className="h-3.5 w-3.5" />
          تثبيت
        </button>
        <button onClick={handleDismiss} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" aria-label="إغلاق">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (showManual && canInstall && (isAndroid() || isIOS())) {
    return (
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] flex items-start gap-3 px-4 py-3 rounded-2xl bg-card border border-primary/40 shadow-xl animate-fade-in max-w-sm w-[90vw]"
        dir="rtl"
      >
        <div className="text-2xl shrink-0 mt-0.5">📲</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight mb-1">أضف حافظون للشاشة الرئيسية</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{manualInstruction}</p>
        </div>
        <button onClick={handleDismiss} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5" aria-label="إغلاق">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return null;
}
