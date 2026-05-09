interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Singleton — captured at module load so no component misses the early-firing event
let _storedPrompt: BeforeInstallPromptEvent | null = null;
let _listeners: Array<(p: BeforeInstallPromptEvent | null) => void> = [];

const _notify = (p: BeforeInstallPromptEvent | null) => {
  _storedPrompt = p;
  _listeners.forEach(l => l(p));
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _notify(e as BeforeInstallPromptEvent);
  });
  window.addEventListener('appinstalled', () => _notify(null));
}

export const INSTALL_DISMISSED_KEY = 'hafezon-install-dismissed';

export const isAlreadyInstalled = () =>
  typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );

export const isAndroid = () => /Android/i.test(navigator.userAgent);
export const isIOS    = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
export const isMobile = () => isAndroid() || isIOS();

// ─── hook ────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';

export function useInstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(_storedPrompt);
  const [dismissed, setDismissedState] = useState(
    () => !!localStorage.getItem(INSTALL_DISMISSED_KEY)
  );

  useEffect(() => {
    const listener = (p: BeforeInstallPromptEvent | null) => setPrompt(p);
    _listeners.push(listener);
    return () => { _listeners = _listeners.filter(l => l !== listener); };
  }, []);

  const install = async () => {
    if (!prompt) return false;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') _notify(null);
    return outcome === 'accepted';
  };

  const dismiss = () => {
    setDismissedState(true);
    localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
  };

  const canInstall = !isAlreadyInstalled() && !dismissed;

  return { prompt, install, dismiss, dismissed, canInstall };
}
