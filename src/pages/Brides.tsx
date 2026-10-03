import { Crown, Star, Gem, ArrowLeft } from "lucide-react";
import { getBridePackageWhatsAppUrl } from "@/lib/whatsapp";
import Layout from "@/components/Layout";
import { useRequireLogin } from "@/hooks/useRequireLogin";

const packages = [
  {
    name: "الباقة الاقتصادية",
    icon: Star,
    price: "من 5,000 ج.م",
    features: ["طقم حلل جرانيت 7 قطع", "طقم أركوبال 38 قطعة", "طقم معالق وشوك 24 قطعة", "أدوات مطبخ أساسية"],
    highlight: false,
  },
  {
    name: "الباقة المتوسطة",
    icon: Crown,
    price: "من 10,000 ج.م",
    features: ["طقم حلل جرانيت 10 قطع", "طقم صيني 86 قطعة", "طقم معالق وشوك 72 قطعة", "خلاط كهربائي", "أدوات مطبخ كاملة"],
    highlight: true,
  },
  {
    name: "باقة VIP",
    icon: Gem,
    price: "من 20,000 ج.م",
    features: ["طقم حلل جرانيت فاخر 12 قطعة", "طقم صيني 124 قطعة", "طقم معالق وشوك 128 قطعة", "خلاط + مفرمة + محضر طعام", "أدوات مطبخ فاخرة كاملة", "هدايا إضافية"],
    highlight: false,
  },
];

const Brides = () => {
  const requireLogin = useRequireLogin();
  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-cairo font-extrabold text-center mb-4">
          تجهيز <span className="text-gradient-gold">العرائس</span>
        </h1>
        <p className="text-center text-muted-foreground text-lg mb-4 max-w-2xl mx-auto">
          باقات كاملة لتجهيز بيتك الجديد — اختاري اللي يناسب ميزانيتك
        </p>
        <p className="text-center text-sm text-primary font-semibold mb-16">
          ✨ إمكانية تعديل أي باقة حسب احتياجاتك
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`rounded-2xl p-8 text-center relative overflow-hidden transition-transform hover:-translate-y-1 ${
                pkg.highlight
                  ? "gradient-gold text-primary-foreground shadow-gold scale-105"
                  : "bg-card shadow-warm border border-border"
              }`}
            >
              {pkg.highlight && (
                <div className="absolute top-4 left-4 bg-foreground text-background text-[10px] font-bold px-3 py-1 rounded-full">
                  الأكثر طلباً
                </div>
              )}
              <pkg.icon className={`w-12 h-12 mx-auto mb-4 ${pkg.highlight ? "text-primary-foreground" : "text-primary"}`} />
              <h3 className="font-bold text-xl mb-2">{pkg.name}</h3>
              <p className={`text-2xl font-extrabold mb-6 ${pkg.highlight ? "" : "text-primary"}`}>{pkg.price}</p>
              <ul className="space-y-2 text-sm mb-8 text-right">
                {pkg.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 ${pkg.highlight ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                    <span>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href={getBridePackageWhatsAppUrl(pkg.name)}
                onClick={requireLogin}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 ${
                  pkg.highlight
                    ? "bg-foreground text-background"
                    : "gradient-gold text-primary-foreground shadow-gold"
                }`}
              >
                اطلبي الباقة
                <ArrowLeft className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
        </div>
      </section>
    </Layout>
  );
};

export default Brides;
