import { useState, useEffect, useRef } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'hafezon-install-dismissed';

const isAlreadyInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as any).standalone === true;

const isAndroid = () => /Android/i.test(navigator.userAgent);
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const promptReceived = useRef(false);

  useEffect(() => {
    if (isAlreadyInstalled()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      promptReceived.current = true;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setVisible(false);
      setShowManual(false);
    });

    // For mobile browsers that never fire beforeinstallprompt (Samsung, Brave, iOS Safari)
    let fallbackTimer: ReturnType<typeof setTimeout>;
    if (isAndroid() || isIOS()) {
      fallbackTimer = setTimeout(() => {
        if (!promptReceived.current) setShowManual(true);
      }, 10000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallbackTimer!);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
    setVisible(false);
  };

  const dismiss = () => {
    setVisible(false);
    setShowManual(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  const manualInstruction = isIOS()
    ? 'اضغط على زر المشاركة ← "إضافة إلى الشاشة الرئيسية"'
    : 'افتح قائمة المتصفح (⋮) ← "إضافة إلى الشاشة الرئيسية"';

  if (visible && deferredPrompt) {
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
          onClick={install}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Download className="h-3.5 w-3.5" />
          تثبيت
        </button>
        <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" aria-label="إغلاق">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (showManual) {
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
        <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5" aria-label="إغلاق">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return null;
}
