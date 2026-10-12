import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { KeyRound, CheckCircle, ArrowRight, Mail, AlertCircle, Loader2 } from "lucide-react";
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

const getPasswordErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) return "حصل خطأ غير متوقع. حاول مرة أخرى.";
  const msg = error.message?.toLowerCase() ?? "";

  if (msg.includes("new password should be different") || msg.includes("same_password")) {
    return "كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور القديمة.";
  }
  if (msg.includes("session missing") || msg.includes("auth session missing")) {
    return "انتهت الجلسة أو الرابط غير صالح. يرجى طلب رابط استعادة جديد من صفحة «نسيت كلمة المرور».";
  }
  if (msg.includes("jwt") || msg.includes("expired") || msg.includes("token")) {
    return "انتهت صلاحية رابط الاستعادة. يرجى طلب رابط جديد.";
  }
  if (msg.includes("password should be at least") || msg.includes("weak_password")) {
    return "كلمة المرور يجب ألا تقل عن 8 أحرف وتحتوي على حرف ورقم.";
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "محاولات كثيرة جدًا. يرجى الانتظار دقيقة والمحاولة مرة أخرى.";
  }
  return error.message || "تعذّر تغيير كلمة المرور. حاول مرة أخرى.";
};

const ChangePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const setupSession = async () => {
      setCheckingSession(true);

      // 1. Handle PKCE code in query string (?code=...)
      const code = searchParams.get("code");
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session && mounted) {
            setHasValidSession(true);
            setIsRecoveryFlow(true);
            setCheckingSession(false);
            return;
          }
        } catch (err) {
          console.error("PKCE exchange error:", err);
        }
      }

      // 2. Handle hash parameters (#access_token=...&type=recovery)
      const hash = window.location.hash;
      if (hash && (hash.includes("access_token") || hash.includes("type=recovery"))) {
        setIsRecoveryFlow(true);
        const hashParams = new URLSearchParams(hash.replace(/^#/, "?"));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });
            if (!error && data.session && mounted) {
              setHasValidSession(true);
              setCheckingSession(false);
              return;
            }
          } catch (err) {
            console.error("Hash session error:", err);
          }
        }
      }

      // 3. Check for existing active session
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session && mounted) {
          setHasValidSession(true);
        }
      } catch (err) {
        console.error("Get session error:", err);
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    void setupSession();

    // 4. Listen for auth state changes (e.g. PASSWORD_RECOVERY or SIGNED_IN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryFlow(true);
        setHasValidSession(true);
      } else if (session?.user) {
        setHasValidSession(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  // Keep in sync with AuthProvider state
  useEffect(() => {
    if (isAuthenticated) {
      setHasValidSession(true);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = passwordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "بيانات غير صحيحة";
      setFormError(msg);
      toast({ title: "خطأ في البيانات", description: msg, variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      // First ensure session is present
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        const msg = "لم يتم العثور على جلسة صالحة. يرجى طلب رابط استعادة كلمة مرور جديد أو تسجيل الدخول.";
        setFormError(msg);
        toast({ title: "تعذّر الحفظ", description: msg, variant: "destructive" });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (error) {
        const msg = getPasswordErrorMessage(error);
        setFormError(msg);
        toast({ title: "تعذّر تغيير كلمة المرور", description: msg, variant: "destructive" });
        return;
      }

      setSuccess(true);
      toast({ title: "تم بنجاح!", description: "تم تحديث كلمة المرور الخاصة بك بنجاح." });
    } catch (err: unknown) {
      const msg = getPasswordErrorMessage(err);
      setFormError(msg);
      toast({ title: "خطأ غير متوقع", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const isSessionReady = hasValidSession || isAuthenticated || isRecoveryFlow;
  const isPageLoading = checkingSession || (authLoading && !hasValidSession && !isRecoveryFlow);

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
                تم حفظ كلمة المرور الجديدة. يمكنك الآن استخدامها في تسجيل الدخول.
              </p>
              <Button
                type="button"
                onClick={() => navigate("/")}
                className="w-full gradient-gold text-primary-foreground font-bold"
              >
                الذهاب للرئيسية
              </Button>
            </div>
          ) : isPageLoading ? (
            <div className="text-center py-8 space-y-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-sm">جاري التحقق من الجلسة والصلاحيات...</p>
            </div>
          ) : !isSessionReady ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-cairo font-bold">
                يلزم وجود جلسة صالحة
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                لتغيير كلمة المرور، يرجى تسجيل الدخول إلى حسابك أولاً، أو استخدام رابط استعادة كلمة المرور المرسل إلى بريدك الإلكتروني.
              </p>
              <div className="space-y-2 pt-2">
                <Button asChild className="w-full gradient-gold text-primary-foreground font-bold">
                  <Link to="/login">تسجيل الدخول</Link>
                </Button>
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link to="/forgot-password">
                    <Mail className="w-4 h-4" />
                    طلب رابط استعادة كلمة المرور
                  </Link>
                </Button>
              </div>
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
                  أدخل كلمة المرور الجديدة (8 أحرف على الأقل تحتوي على حرف ورقم)
                </p>
              </div>

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
