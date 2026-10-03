import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type AuthorizationDetails = {
  client?: { name?: string; client_name?: string; redirect_uri?: string } | null;
  scope?: string | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("رابط غير صالح: لا يوجد معرّف تفويض");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      if (active) setEmail(sess.session.user.email ?? null);
      const { data, error: err } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) return setError(err.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (err) {
      setBusy(false);
      return setError(err.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("لم يتم إرجاع رابط إعادة التوجيه");
    }
    window.location.href = target;
  };

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "التطبيق";

  return (
    <main dir="rtl" className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-warm space-y-4">
        {error ? (
          <p className="text-destructive text-sm">تعذّر تحميل طلب التفويض: {error}</p>
        ) : !details ? (
          <p className="text-muted-foreground text-sm text-center">جاري التحميل...</p>
        ) : (
          <>
            <h1 className="text-lg font-cairo font-bold text-center">
              ربط {clientName} بحسابك في معرض الأخوة
            </h1>
            {email && (
              <p className="text-sm text-muted-foreground text-center">الحساب: {email}</p>
            )}
            <p className="text-sm">
              سيتمكن {clientName} من استخدام أدوات هذا التطبيق نيابةً عنك أثناء تسجيل دخولك.
            </p>
            <ul className="text-sm text-muted-foreground list-disc pr-5 space-y-1">
              <li>مشاركة بريدك الإلكتروني وبياناتك الأساسية</li>
              <li>قراءة المنتجات والعروض</li>
              <li>إضافة وتعديل المنتجات</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              هذا لا يتجاوز صلاحيات التطبيق أو سياسات الحماية في قاعدة البيانات.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 gradient-gold text-primary-foreground font-bold"
              >
                موافقة
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => decide(false)}
                className="flex-1"
              >
                إلغاء الربط
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default OAuthConsent;
