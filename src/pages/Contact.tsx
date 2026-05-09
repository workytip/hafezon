import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, MessageSquare, Mail, Lightbulb, Loader2 } from 'lucide-react';
import { NavLinks } from '@/components/AppNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';

const WEB3FORMS_KEY = 'fae97ba8-2944-48ad-a54c-b59a4516b80f';

const Contact = () => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !message.trim()) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: name.trim(),
          subject: (subject.trim() || 'رسالة من تطبيق حافظون'),
          message: message.trim(),
          from_name: 'حافظون',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم إرسال رسالتك بنجاح ✅');
        setName('');
        setSubject('');
        setMessage('');
      } else {
        toast.error('حدث خطأ أثناء الإرسال، حاول مرة أخرى');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال، حاول مرة أخرى');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background islamic-pattern">
      <div className="container max-w-2xl py-8 px-4">
        {/* رأس الصفحة */}
        <header className="text-center mb-10 animate-fade-in">
          <NavLinks />
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-4 glow-emerald">
            <MessageSquare className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">تواصل معنا</h1>
          <p className="text-lg text-muted-foreground">
            نسعد بملاحظاتكم واقتراحاتكم لتطوير التطبيق
          </p>
        </header>

        {/* بطاقات سريعة */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-in">
          <div className="card-islamic p-4 text-center">
            <Lightbulb className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">اقتراح ميزة جديدة</p>
          </div>
          <div className="card-islamic p-4 text-center">
            <Mail className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">الإبلاغ عن مشكلة</p>
          </div>
        </div>

        {/* نموذج التواصل */}
        <form onSubmit={handleSubmit} className="card-islamic p-6 space-y-5 animate-slide-up">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسمك هنا"
              required
              maxLength={100}
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">الموضوع</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع الرسالة (اختياري)"
              maxLength={200}
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">الرسالة *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب ملاحظاتك أو اقتراحاتك هنا..."
              required
              maxLength={2000}
              rows={6}
              dir="rtl"
            />
          </div>

          <Button type="submit" className="w-full btn-primary-islamic gap-2" size="lg" disabled={sending}>
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {sending ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            سيتم إرسال رسالتك مباشرة إلينا
          </p>
        </form>
      </div>
    </div>
  );
};

export default Contact;
