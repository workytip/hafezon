import { useState } from 'react';
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

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (error) {
      setError(error);
    } else if (mode === 'signup') {
      setSuccess(true);
    } else {
      onClose();
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
            {mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              تم إنشاء حسابك! تحقق من بريدك الإلكتروني لتفعيل الحساب.
            </p>
            <Button onClick={onClose} className="w-full">إغلاق</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                dir="ltr"
                className="text-left"
              />
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
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-right">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              {mode === 'signin' ? 'دخول' : 'إنشاء حساب'}
            </Button>

            <button
              type="button"
              onClick={switchMode}
              className="w-full text-sm text-muted-foreground hover:text-primary text-center transition-colors"
            >
              {mode === 'signin'
                ? 'ليس لديك حساب؟ سجّل الآن'
                : 'لديك حساب؟ سجّل دخولك'}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
