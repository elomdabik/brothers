import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { KeyRound, CheckCircle, ArrowRight } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

const passwordSchema = z.object({
  password: z.string().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف").max(72, "كلمة المرور طويلة جدًا")
    .regex(/[A-Za-z]/, "كلمة المرور يجب أن تحتوي على حرف واحد على الأقل")
    .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});

const ChangePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if recovery event is fired or hash contains type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setIsRecoveryFlow(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryFlow(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = passwordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "بيانات غير صحيحة";
      setFormError(msg);
      toast({ title: "خطأ", description: msg, variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (error) {
        setFormError(error.message);
        toast({ title: "تعذّر تغيير كلمة المرور", description: error.message, variant: "destructive" });
        return;
      }

      setSuccess(true);
      toast({ title: "تم بنجاح!", description: "تم تحديث كلمة المرور الخاصة بك بنجاح." });
    } catch {
      setFormError("تعذّر الاتصال بخدمة المصادقة.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <main dir="rtl" className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-6 shadow-warm">
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-xl font-cairo font-bold text-gradient-gold">
                تم تغيير كلمة المرور بنجاح!
              </h1>
              <p className="text-sm text-muted-foreground">
                يمكنك الآن استخدام كلمة المرور الجديدة في تسجيل الدخول.
              </p>
              <Button
                type="button"
                onClick={() => navigate("/")}
                className="w-full gradient-gold text-primary-foreground font-bold"
              >
                الذهاب للرئيسية
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-cairo font-bold text-gradient-gold">
                  {isRecoveryFlow ? "إعادة تعيين كلمة المرور" : "تغيير كلمة المرور"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  أدخل كلمة المرور الجديدة لتأمين حسابك
                </p>
              </div>

              {!isRecoveryFlow && !isAuthenticated && !isLoading && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-600 dark:text-amber-400">
                  يرجى تسجيل الدخول أولاً لتتمكن من تغيير كلمة المرور، أو استخدام رابط استعادة كلمة المرور من بريدك.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور الجديدة"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تأكيد كلمة المرور الجديدة"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
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
                  {busy ? "جاري التحديث..." : "حفظ كلمة المرور الجديدة"}
                </Button>
              </form>
              <Link
                to="/"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                العودة للرئيسية
              </Link>
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default ChangePassword;
