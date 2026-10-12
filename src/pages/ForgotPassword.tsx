import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { ArrowRight, Mail, CheckCircle } from "lucide-react";
import { z } from "zod";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = z.string().trim().email("أدخل بريدًا إلكترونيًا صحيحًا").safeParse(email);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "بريد إلكتروني غير صحيح";
      setFormError(msg);
      toast({ title: "خطأ", description: msg, variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        parsed.data.toLowerCase(),
        {
          redirectTo: `${window.location.origin}/change-password`,
        }
      );
      if (error) {
        const msg =
          error.message?.toLowerCase().includes("rate limit") || error.message?.toLowerCase().includes("too many")
            ? "محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى."
            : error.message || "حصل خطأ. حاول مرة أخرى.";
        setFormError(msg);
        toast({ title: "تعذّر الإرسال", description: msg, variant: "destructive" });
        return;
      }
      setSent(true);
      toast({ title: "تم الإرسال", description: "تفقد بريدك الإلكتروني لإعادة تعيين كلمة المرور." });
    } catch {
      setFormError("تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <main dir="rtl" className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-6 shadow-warm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-xl font-cairo font-bold text-gradient-gold">
                تم إرسال رابط إعادة التعيين
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                تم إرسال رابط إعادة تعيين كلمة المرور إلى
                <br />
                <span className="font-semibold text-foreground">{email}</span>
                <br />
                تفقد بريدك الإلكتروني واتبع التعليمات.
              </p>
              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setSent(false); setFormError(null); }}
                  className="w-full gap-2"
                >
                  <Mail className="w-4 h-4" />
                  إرسال مرة أخرى
                </Button>
                <Link
                  to="/login"
                  className="block text-sm text-center text-muted-foreground hover:text-primary transition-colors"
                >
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-xl font-cairo font-bold text-gradient-gold">
                  نسيت كلمة المرور
                </h1>
                <p className="text-sm text-muted-foreground">
                  أدخل بريدك الإلكتروني وهنرسلك رابط لإعادة تعيين كلمة المرور.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  autoComplete="email"
                  maxLength={255}
                  required
                />
                {formError && (
                  <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {formError}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full gradient-gold text-primary-foreground font-bold"
                >
                  {busy ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
                </Button>
              </form>
              <Link
                to="/login"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                العودة لتسجيل الدخول
              </Link>
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default ForgotPassword;
