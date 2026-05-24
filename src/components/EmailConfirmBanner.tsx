import { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function EmailConfirmBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.email_confirmed_at || dismissed) return null;

  const resend = async () => {
    setSending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email: user.email! });
    setSending(false);
    if (error) {
      toast.error('تعذر إرسال البريد، حاول مجدداً');
    } else {
      toast.success('تم إرسال رابط التأكيد إلى بريدك');
    }
  };

  return (
    <div
      className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-sm"
      dir="rtl"
    >
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <Mail className="h-4 w-4 shrink-0" />
        <span>
          تحقق من بريدك الإلكتروني لتفعيل حسابك.{' '}
          <button
            onClick={resend}
            disabled={sending}
            className="underline underline-offset-2 hover:opacity-75 transition-opacity disabled:opacity-50"
          >
            {sending ? 'جارٍ الإرسال...' : 'إعادة إرسال الرابط'}
          </button>
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-600 hover:text-amber-800 dark:hover:text-amber-300 shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
