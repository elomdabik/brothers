import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

const signupSchema = z.object({
  displayName: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100, "الاسم طويل جدًا"),
  email: z.string().trim().email("أدخل بريدًا إلكترونيًا صحيحًا").max(255),
  phone: z.string().trim().regex(/^01[0125][0-9]{8}$/, "أدخل رقم هاتف مصري صحيحًا من 11 رقمًا"),
  password: z.string().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف").max(72, "كلمة المرور طويلة جدًا")
    .regex(/[A-Za-z]/, "كلمة المرور يجب أن تحتوي على حرف")
    .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});

const getAuthErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) return "حصل خطأ غير متوقع. حاول مرة أخرى.";

  const authError = error as Error & { code?: string };
  const normalizedMessage = authError.message?.toLowerCase() ?? "";

  if (normalizedMessage.includes("email signups are disabled") || normalizedMessage.includes("signups are disabled") || normalizedMessage.includes("sign up is disabled") || normalizedMessage.includes("signups disabled")) {
    return "تم تعطيل إنشاء الحساب بالبريد الإلكتروني مؤقتًا. تواصل مع الإدارة أو فعّل تسجيل الدخول عبر البريد الإلكتروني في إعدادات Supabase.";
  }

  if (normalizedMessage.includes("email logins are disabled") || normalizedMessage.includes("logins are disabled") || normalizedMessage.includes("login is disabled") || normalizedMessage.includes("logins disabled")) {
    return "تم تعطيل تسجيل الدخول بالبريد الإلكتروني مؤقتًا. تواصل مع الإدارة أو فعّل تسجيل الدخول عبر البريد الإلكتروني في إعدادات Supabase.";
  }

  switch (authError.code) {
    case "invalid_credentials":
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من البيانات أو أنشئ كلمة مرور جديدة.";
    case "email_not_confirmed":
      return "يجب تأكيد البريد الإلكتروني من رسالة Supabase قبل تسجيل الدخول.";
    case "user_banned":
      return "هذا الحساب موقوف. تواصل مع إدارة الموقع.";
    case "too_many_requests":
      return "محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.";
    default:
      return authError.message || "تحقق من اتصال الإنترنت وإعدادات Supabase ثم حاول مرة أخرى.";
  }
};

type LoginProps = {
  embedded?: boolean;
  onSuccess?: () => void;
};

const Login = ({ embedded = false, onSuccess }: LoginProps) => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setBusy(true);
    if (mode === "signin") {
      const parsedEmail = z.string().trim().email().safeParse(email);
      if (!parsedEmail.success || password.length === 0) {
        setBusy(false);
        toast({ title: "راجع بيانات الدخول", description: "أدخل بريدًا إلكترونيًا صحيحًا وكلمة المرور.", variant: "destructive" });
        return;
      }
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsedEmail.data.toLowerCase(),
          password,
        });
        if (error) {
          const message = getAuthErrorMessage(error);
          setFormError(message);
          toast({ title: "تعذّر تسجيل الدخول", description: message, variant: "destructive" });
          return;
        }
      } catch (error: unknown) {
        const message = getAuthErrorMessage(error);
        setFormError(message);
        toast({ title: "تعذّر الاتصال بخدمة تسجيل الدخول", description: message, variant: "destructive" });
        return;
      } finally {
        setBusy(false);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(next, { replace: true });
      }
    } else {
      const parsed = signupSchema.safeParse({ displayName, email, phone, password, confirmPassword });
      if (!parsed.success) {
        setBusy(false);
        const message = parsed.error.issues[0]?.message ?? "البيانات غير صحيحة";
        setFormError(message);
        toast({ title: "راجع بيانات الحساب", description: message, variant: "destructive" });
        return;
      }
      try {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email.toLowerCase(),
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}${next}`,
            data: {
              display_name: parsed.data.displayName,
              phone: parsed.data.phone,
            },
          },
        });
        if (error) {
          const message = getAuthErrorMessage(error);
          setFormError(message);
          toast({ title: "تعذّر إنشاء الحساب", description: message, variant: "destructive" });
          return;
        }
        toast({ title: "تم إرسال رسالة التأكيد إلى بريدك" });
      } catch (error: unknown) {
        const message = getAuthErrorMessage(error);
        setFormError(message);
        toast({ title: "تعذّر الاتصال بخدمة التسجيل", description: message, variant: "destructive" });
        return;
      } finally {
        setBusy(false);
      }
    }
  };

  const form = (
    <div className={embedded ? "w-full space-y-4" : "w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 shadow-warm"}>
      {embedded ? (
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-cairo font-bold text-gradient-gold">
            {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
          </DialogTitle>
        </DialogHeader>
      ) : (
        <h1 className="text-xl font-cairo font-bold text-gradient-gold text-center">
          {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
        </h1>
      )}
      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <Input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="الاسم الكامل"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            required
          />
        )}
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
          autoComplete="email"
          maxLength={255}
          required
        />
        {mode === "signup" && (
          <Input
            type="tel"
            inputMode="numeric"
            dir="rtl"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            placeholder="رقم الهاتف (مثال: 01012345678)"
            autoComplete="tel"
            pattern="01[0125][0-9]{8}"
            maxLength={11}
            required
          />
        )}
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 8 : undefined}
          maxLength={72}
          required
        />
        {mode === "signup" && (
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="تأكيد كلمة المرور"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />
        )}
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
          {mode === "signin" ? "دخول" : "إنشاء الحساب"}
        </Button>
      </form>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setFormError(null);
          setMode(mode === "signin" ? "signup" : "signin");
        }}
        className="w-full text-sm text-muted-foreground hover:text-foreground"
      >
        {mode === "signin" ? "ليس لديك حساب؟ إنشاء حساب" : "لديك حساب؟ تسجيل الدخول"}
        </Button>
    </div>
  );

  return embedded ? (
    form
  ) : (
    <main dir="rtl" className="min-h-screen flex items-center justify-center p-4 bg-background">
      {form}
    </main>
  );
};

export default Login;
