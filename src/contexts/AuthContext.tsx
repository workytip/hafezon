import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; loggedIn: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const translateAuthError = (msg: string): string => {
  if (!msg) return 'حدث خطأ غير متوقع، حاول مجدداً.';
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة، تحقق من بياناتك وحاول مجدداً.';
  if (m.includes('user already registered') || m.includes('already registered'))
    return 'اسم المستخدم مسجّل مسبقاً، جرّب اسماً آخر أو سجّل دخولك.';
  if (m.includes('email not confirmed'))
    return 'لم يتم تأكيد البريد الإلكتروني بعد، تحقق من صندوق الوارد واضغط رابط التأكيد.';
  if (m.includes('password should be at least'))
    return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
  if (m.includes('invalid format') || m.includes('unable to validate email'))
    return 'صيغة البريد الإلكتروني غير صحيحة.';
  if (m.includes('email rate limit') || m.includes('too many requests') || m.includes('rate limit'))
    return 'عدد المحاولات تجاوز الحد المسموح، انتظر قليلاً ثم حاول مجدداً.';
  if (m.includes('for security purposes'))
    return 'لأسباب أمنية، انتظر لحظة قبل إعادة المحاولة.';
  if (m.includes('email link is invalid') || m.includes('token has expired'))
    return 'انتهت صلاحية الرابط أو غير صالح، اطلب رابطاً جديداً.';
  if (m.includes('network') || m.includes('fetch'))
    return 'تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت.';
  return 'حدث خطأ غير متوقع، حاول مجدداً.';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return {
      error: error ? translateAuthError(error.message) : null,
      loggedIn: !!data.session,
    };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user: session?.user ?? null,
      session,
      loading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
