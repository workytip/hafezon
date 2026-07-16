import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const toEmail = (username: string) =>
  `${username.trim().toLowerCase()}@hafezon.app`;

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setMode('signin');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
      setError('اسم المستخدم يجب أن يكون بين 3 و20 حرفاً (أحرف إنجليزية، أرقام، أو شرطة سفلية)');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقتين، تحقق وأعد المحاولة.');
      return;
    }

    setLoading(true);
    const email = toEmail(username);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) setError(error);
      else onClose();
    } else {
      const { error, loggedIn } = await signUp(email, password);
      setLoading(false);
      if (error) setError(error);
      else if (loggedIn) onClose();
      else setSuccess(true);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'signin' ? 'signup' : 'signin');
    setError(null);
    setSuccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">
            {mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">أهلاً بك في حافظون!</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                تم إنشاء حسابك بنجاح.<br />
                يمكنك الآن تسجيل الدخول والبدء في رحلة الحفظ.
              </p>
            </div>
            <Button onClick={switchMode} className="w-full">تسجيل الدخول الآن</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="مثال: ahmad_123"
                required
                dir="ltr"
                className="text-left"
                autoComplete="username"
              />
              {mode === 'signup' && (
                <p className="text-xs text-muted-foreground">أحرف إنجليزية وأرقام وشرطة سفلية فقط (3–20 حرف)</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                dir="ltr"
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              {mode === 'signup' && (
                <p className="text-xs text-muted-foreground">6 أحرف على الأقل</p>
              )}
            </div>

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-right">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              {mode === 'signin' ? 'دخول' : 'إنشاء الحساب'}
            </Button>

            <button
              type="button"
              onClick={switchMode}
              className="w-full text-sm text-muted-foreground hover:text-primary text-center transition-colors"
            >
              {mode === 'signin'
                ? 'ليس لديك حساب؟ سجّل الآن مجاناً'
                : 'لديك حساب بالفعل؟ سجّل دخولك'}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
