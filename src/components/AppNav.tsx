import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Sun, Timer, TrendingUp, MessageSquare, Download, LogIn, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInstallPWA, isMobile, isAlreadyInstalled } from '@/hooks/useInstallPWA';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';

const NAV_ITEMS = [
  { to: '/',             icon: BookOpen,      label: 'الحفظ' },
  { to: '/daily-muslim', icon: Sun,           label: 'يومي' },
  { to: '/pomodoro',     icon: Timer,         label: 'بومودورو' },
  { to: '/analytics',    icon: TrendingUp,    label: 'تحليلات' },
  { to: '/contact',      icon: MessageSquare, label: 'تواصل' },
] as const;

/** Fixed top navbar — shown only on md+ screens */
export function NavLinks() {
  const { pathname } = useLocation();
  const { prompt, install } = useInstallPWA();
  const { user, signOut } = useAuth();
  const [showHint, setShowHint] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const showInstall = !isMobile() && !isAlreadyInstalled();

  const handleInstallClick = async () => {
    if (prompt) {
      await install();
    } else {
      setShowHint(h => !h);
    }
  };

  return (
    <nav
      className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
      dir="rtl"
    >
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-bold text-primary text-base">حافظون</span>
        </Link>
        <div className="flex items-center gap-1.5 relative">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}>
              <div className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                pathname === to
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-primary/10 text-muted-foreground hover:text-primary'
              )}>
                <Icon className="h-4 w-4" />
                {label}
              </div>
            </Link>
          ))}
          {showInstall && (
            <div className="relative">
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary"
              >
                <Download className="h-4 w-4" />
                تثبيت
              </button>
              {showHint && (
                <div
                  className="absolute left-0 top-full mt-2 w-64 p-3 rounded-xl bg-card border border-border shadow-xl text-xs text-right leading-relaxed z-50"
                  dir="rtl"
                >
                  انقر على أيقونة التثبيت (
                  <span className="font-mono">⊕</span>
                  ) في شريط العنوان بالمتصفح، أو افتح قائمة المتصفح واختر "تثبيت التطبيق"
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground hidden lg:block truncate max-w-[120px]" title={user.email}>
                <User className="h-3 w-3 inline ml-1" />
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              دخول
            </button>
          )}
        </div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </nav>
  );
}

/** Fixed bottom tab bar — shown only on mobile */
export function AppNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border"
      dir="rtl"
    >
      <div className="flex items-end justify-around px-1 pt-1.5"
           style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[52px]"
            >
              <div className={cn('p-1.5 rounded-xl transition-all', active && 'bg-primary/15')}>
                <Icon className={cn(
                  'h-5 w-5 transition-all',
                  active ? 'text-primary scale-110' : 'text-muted-foreground'
                )} />
              </div>
              <span className={cn(
                'text-[10px] leading-tight',
                active ? 'text-primary font-bold' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
