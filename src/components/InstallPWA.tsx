import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after 5 seconds
      setTimeout(() => setVisible(true), 5000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setVisible(false));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible || !deferredPrompt) return null;

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
      <button
        onClick={() => setVisible(false)}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="إغلاق"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
